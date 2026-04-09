import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { QuestService, QUEST_KEYS } from '../quest/quest.service';
import { CreateMessageDto, TIER_COST, MentoringTier } from './dto/create-message.dto';
import { AIMessageRole, CreditTransactionType, UserPlan } from '@prisma/client';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

const SYSTEM_PROMPT = `당신은 IT 프로젝트 팀의 AI 멘토입니다. 팀원들의 코드, 설계, 문서, 기획 관련 질문에 전문적이고 친절하게 답변해주세요.
한국어로 답변하되, 코드는 반드시 마크다운 코드블록(\`\`\`)을 사용해 작성해주세요.`;

// 모델 라우팅 매트릭스 (실제 모델 ID)
const MODEL_MATRIX: Record<string, Record<number, string>> = {
  CODE:     { 1: 'claude-haiku-4-5-20251001', 2: 'gpt-4o-mini',       3: 'claude-opus-4-6' },
  DOCUMENT: { 1: 'gemini-2.5-flash-lite',    2: 'gpt-4o-mini',       3: 'claude-opus-4-6' },
  DESIGN:   { 1: 'gemini-2.5-flash-lite',    2: 'gemini-2.5-flash',  3: 'gemini-2.5-pro' },
  PLANNING: { 1: 'claude-haiku-4-5-20251001', 2: 'claude-sonnet-4-6', 3: 'claude-opus-4-6' },
  RESEARCH: { 1: 'grok-3-mini',              2: 'grok-3',             3: 'grok-4-0709' },
  OTHER:    { 1: 'gemini-2.5-flash-lite',    2: 'gemini-2.5-flash',  3: 'gemini-2.5-pro' },
};

// 등급 이름 매핑
const TIER_LABEL: Record<number, string> = { 1: '일반', 2: '심화', 3: '전문가' };

// 플랜별 허용 등급
const PLAN_MAX_TIER = {
  [UserPlan.FREE]:    MentoringTier.BASIC,
  [UserPlan.PRO]:     MentoringTier.ADVANCED,
  [UserPlan.PREMIUM]: MentoringTier.EXPERT,
};

type HistoryMessage = { role: AIMessageRole; content: string };

// 인사말 패턴 (제목에서 제거)
const GREETING_PATTERNS = /^(안녕하세요[!.]?\s*|안녕[!.]?\s*|반갑습니다[!.]?\s*|질문이\s*있(어요|습니다)[!.]?\s*|도움이?\s*필요합니다[!.]?\s*|문의\s*드립니다[!.]?\s*|hi[!.]?\s*|hello[!.]?\s*)/i;

@Injectable()
export class AiMentorService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private readonly quest: QuestService,
  ) {}

  // ─── 대화 제목 생성 (Gemini Flash-Lite) ─────────────────────
  private async generateTitle(content: string): Promise<string> {
    try {
      const genAI = new GoogleGenerativeAI(this.config.get<string>('GEMINI_API_KEY')!);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
      const result = await model.generateContent(
        `다음 사용자 메시지를 보고 대화 제목을 한국어 15자 이내로 생성해줘. 제목만 출력하고 따옴표나 부가 설명 없이 핵심 주제만 담아줘.\n\n메시지: ${content.slice(0, 300)}`,
      );
      const title = result.response.text().trim().replace(/^["'""']|["'""']$/g, '');
      if (title && title.length <= 30) return title;
    } catch { /* AI 실패 시 폴백 */ }

    // 폴백: 텍스트 기반 제목 생성
    let text = content.replace(GREETING_PATTERNS, '').trim();
    text = text.split(/[\n\r]/)[0]?.trim() || '';
    if (!text) return '새 대화';
    return text.length > 20 ? text.slice(0, 20) + '…' : text;
  }

  // ─── Task 컨텍스트 프롬프트 빌드 ─────────────────────────────
  private async buildContextPrompt(contextType: string, contextId: string): Promise<string> {
    if (contextType !== 'TASK') return '';

    const task = await this.prisma.task.findUnique({
      where: { id: contextId },
      include: {
        project: { select: { issuePrefix: true } },
        comments: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { author: { select: { nickname: true } } },
        },
      },
    });

    if (!task) return '';

    const prefix = task.project?.issuePrefix ?? 'TASK';
    const lines = [
      `\n\n=== 참조 Task ===`,
      `[${prefix}-${task.issueNumber}] ${task.title}`,
      `상태: ${task.status} | 우선순위: ${task.priority}${task.taskType ? ` | 유형: ${task.taskType}` : ''}`,
    ];

    if (task.tags?.length) lines.push(`태그: ${task.tags.join(', ')}`);

    if (task.description) {
      const desc = task.description.length > 2000 ? task.description.slice(0, 2000) + '…' : task.description;
      lines.push(`설명:\n${desc}`);
    }

    if (task.comments.length > 0) {
      lines.push(`--- 코멘트 (${task.comments.length}개) ---`);
      for (const c of task.comments.reverse()) {
        lines.push(`${c.author.nickname}: ${c.content}`);
      }
    }

    lines.push(`=================`);
    lines.push(`위 Task 정보를 참고하여 질문에 답변해주세요.`);

    return lines.join('\n');
  }

  // ─── AI 스트리밍 호출 (AsyncGenerator) ───────────────────────
  private async *callAIStream(modelId: string, history: HistoryMessage[], systemPrompt: string = SYSTEM_PROMPT): AsyncGenerator<string> {
    if (modelId.startsWith('claude-')) {
      const client = new Anthropic({ apiKey: this.config.get<string>('ANTHROPIC_API_KEY')! });
      const stream = await client.messages.stream({
        model: modelId,
        max_tokens: 2048,
        system: systemPrompt,
        messages: history.map(m => ({
          role: m.role === AIMessageRole.USER ? 'user' : 'assistant',
          content: m.content,
        })),
      });
      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          yield event.delta.text;
        }
      }
      return;
    }

    if (modelId.startsWith('gpt-') || modelId.startsWith('grok-')) {
      const client = modelId.startsWith('grok-')
        ? new OpenAI({ apiKey: this.config.get<string>('XAI_API_KEY')!, baseURL: 'https://api.x.ai/v1' })
        : new OpenAI({ apiKey: this.config.get<string>('OPENAI_API_KEY')! });
      const stream = await client.chat.completions.create({
        model: modelId,
        stream: true,
        messages: [
          { role: 'system', content: systemPrompt },
          ...history.map(m => ({
            role: (m.role === AIMessageRole.USER ? 'user' : 'assistant') as 'user' | 'assistant',
            content: m.content,
          })),
        ],
      });
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) yield delta;
      }
      return;
    }

    if (modelId.startsWith('gemini-')) {
      const genAI = new GoogleGenerativeAI(this.config.get<string>('GEMINI_API_KEY')!);
      const model = genAI.getGenerativeModel({ model: modelId, systemInstruction: systemPrompt });
      const chatHistory = history.slice(0, -1).map(m => ({
        role: m.role === AIMessageRole.USER ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));
      const chat = model.startChat({ history: chatHistory });
      const result = await chat.sendMessageStream(history[history.length - 1].content);
      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) yield text;
      }
      return;
    }

    throw new InternalServerErrorException(`지원하지 않는 모델: ${modelId}`);
  }

  // ─── AI 호출 (provider 자동 분기) ─────────────────────────────
  private async callAI(modelId: string, history: HistoryMessage[], systemPrompt: string = SYSTEM_PROMPT): Promise<string> {
    if (modelId.startsWith('claude-')) {
      const client = new Anthropic({ apiKey: this.config.get<string>('ANTHROPIC_API_KEY')! });
      const response = await client.messages.create({
        model: modelId,
        max_tokens: 2048,
        system: systemPrompt,
        messages: history.map(m => ({
          role: m.role === AIMessageRole.USER ? 'user' : 'assistant',
          content: m.content,
        })),
      });
      const block = response.content[0];
      return block.type === 'text' ? block.text : '';
    }

    if (modelId.startsWith('gpt-')) {
      const client = new OpenAI({ apiKey: this.config.get<string>('OPENAI_API_KEY')! });
      const response = await client.chat.completions.create({
        model: modelId,
        messages: [
          { role: 'system', content: systemPrompt },
          ...history.map(m => ({
            role: (m.role === AIMessageRole.USER ? 'user' : 'assistant') as 'user' | 'assistant',
            content: m.content,
          })),
        ],
      });
      return response.choices[0]?.message?.content ?? '';
    }

    if (modelId.startsWith('gemini-')) {
      const genAI = new GoogleGenerativeAI(this.config.get<string>('GEMINI_API_KEY')!);
      const model = genAI.getGenerativeModel({ model: modelId, systemInstruction: systemPrompt });
      const chatHistory = history.slice(0, -1).map(m => ({
        role: m.role === AIMessageRole.USER ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));
      const chat = model.startChat({ history: chatHistory });
      const result = await chat.sendMessage(history[history.length - 1].content);
      return result.response.text();
    }

    if (modelId.startsWith('grok-')) {
      const client = new OpenAI({
        apiKey: this.config.get<string>('XAI_API_KEY')!,
        baseURL: 'https://api.x.ai/v1',
      });
      const response = await client.chat.completions.create({
        model: modelId,
        messages: [
          { role: 'system', content: systemPrompt },
          ...history.map(m => ({
            role: (m.role === AIMessageRole.USER ? 'user' : 'assistant') as 'user' | 'assistant',
            content: m.content,
          })),
        ],
      });
      return response.choices[0]?.message?.content ?? '';
    }

    throw new InternalServerErrorException(`지원하지 않는 모델: ${modelId}`);
  }

  // ─── 대화 목록 ────────────────────────────────────────────────
  async getConversations(userId: string) {
    return this.prisma.aIConversation.findMany({
      where: { userId },
      include: { _count: { select: { messages: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  // ─── 대화 상세 ────────────────────────────────────────────────
  async getConversation(conversationId: string, userId: string) {
    const conv = await this.prisma.aIConversation.findUnique({
      where: { id: conversationId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!conv) throw new NotFoundException('대화를 찾을 수 없습니다');
    if (conv.userId !== userId) throw new ForbiddenException('접근 권한이 없습니다');
    return conv;
  }

  // ─── 대화 삭제 ────────────────────────────────────────────────
  async deleteConversation(conversationId: string, userId: string) {
    const conv = await this.prisma.aIConversation.findUnique({ where: { id: conversationId } });
    if (!conv) throw new NotFoundException('대화를 찾을 수 없습니다');
    if (conv.userId !== userId) throw new ForbiddenException('접근 권한이 없습니다');
    await this.prisma.aIConversation.delete({ where: { id: conversationId } });
    return { message: '대화가 삭제되었습니다' };
  }

  // ─── 메시지 전송 (핵심) ───────────────────────────────────────
  async sendMessage(
    conversationId: string | null,
    userId: string,
    dto: CreateMessageDto,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다');

    // 플랜별 등급 제한
    const maxTier = PLAN_MAX_TIER[user.plan];
    if (dto.tier > maxTier)
      throw new ForbiddenException(`현재 플랜(${user.plan})에서는 ${dto.tier}등급을 사용할 수 없습니다`);

    const cost = TIER_COST[dto.tier];
    if (user.credit < cost)
      throw new BadRequestException(`크레딧이 부족합니다 (필요: ${cost}cr, 보유: ${user.credit}cr)`);

    const modelUsed = MODEL_MATRIX[dto.taskType]?.[dto.tier] ?? 'claude-haiku-4-5-20251001';

    // 컨텍스트 프롬프트 빌드
    let systemPrompt = SYSTEM_PROMPT;
    const contextType = dto.contextType ?? null;
    const contextId = dto.contextId ?? null;
    if (contextType && contextId) {
      const contextBlock = await this.buildContextPrompt(contextType, contextId);
      if (contextBlock) systemPrompt += contextBlock;
    }

    // 대화 세션 생성 or 기존 사용
    let convId = conversationId;
    if (!convId) {
      const conv = await this.prisma.aIConversation.create({
        data: {
          userId,
          title: await this.generateTitle(dto.content),
          taskId: dto.taskId,
          contextType,
          contextId,
        },
      });
      convId = conv.id;
    } else {
      const existing = await this.prisma.aIConversation.findUnique({ where: { id: convId } });
      if (!existing || existing.userId !== userId)
        throw new NotFoundException('대화를 찾을 수 없습니다');
      // 기존 대화의 컨텍스트 재사용
      if (existing.contextType && existing.contextId) {
        const contextBlock = await this.buildContextPrompt(existing.contextType, existing.contextId);
        if (contextBlock) systemPrompt = SYSTEM_PROMPT + contextBlock;
      }
    }

    // 유저 메시지 저장
    await this.prisma.aIMessage.create({
      data: {
        conversationId: convId,
        role: AIMessageRole.USER,
        content: dto.content,
        taskType: dto.taskType,
        modelUsed,
        creditsUsed: 0,
      },
    });

    // 대화 히스토리 로드 (최근 20개)
    const historyRows = await this.prisma.aIMessage.findMany({
      where: { conversationId: convId },
      orderBy: { createdAt: 'asc' },
      take: 20,
      select: { role: true, content: true },
    });

    // 실제 AI 호출 (트랜잭션 외부 - 외부 API 호출)
    let aiResponse: string;
    try {
      aiResponse = await this.callAI(modelUsed, historyRows, systemPrompt);
    } catch (err) {
      throw new InternalServerErrorException(`AI 응답 실패: ${(err as Error).message}`);
    }

    // 트랜잭션: AI 메시지 저장 + 크레딧 차감 + updatedAt 갱신
    await this.prisma.$transaction(async (tx) => {
      await tx.aIMessage.create({
        data: {
          conversationId: convId!,
          role: AIMessageRole.ASSISTANT,
          content: aiResponse,
          taskType: dto.taskType,
          modelUsed,
          creditsUsed: cost,
        },
      });
      await tx.user.update({ where: { id: userId }, data: { credit: { decrement: cost } } });
      await tx.creditTransaction.create({
        data: {
          userId,
          amount: -cost,
          type: CreditTransactionType.SPEND,
          description: `AI멘토링 (${dto.taskType} ${TIER_LABEL[dto.tier] ?? dto.tier})`,
          relatedId: convId,
        },
      });
      await tx.aIConversation.update({ where: { id: convId! }, data: { updatedAt: new Date() } });
    });

    // 퀘스트 체크: AI 멘토링 이용
    await this.quest.checkAndComplete(userId, QUEST_KEYS.AI_CHAT);

    return { conversationId: convId, model: modelUsed, creditsUsed: cost };
  }

  // ─── 메시지 전송 (SSE 스트리밍) ──────────────────────────────
  async streamMessage(
    conversationId: string | null,
    userId: string,
    dto: CreateMessageDto,
    res: Response,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
      return;
    }

    const maxTier = PLAN_MAX_TIER[user.plan];
    if (dto.tier > maxTier) {
      res.status(403).json({ message: `현재 플랜(${user.plan})에서는 ${dto.tier}등급을 사용할 수 없습니다` });
      return;
    }

    const cost = TIER_COST[dto.tier];
    if (user.credit < cost) {
      res.status(400).json({ message: `크레딧이 부족합니다 (필요: ${cost}cr, 보유: ${user.credit}cr)` });
      return;
    }

    const modelUsed = MODEL_MATRIX[dto.taskType]?.[dto.tier] ?? 'claude-haiku-4-5-20251001';

    // 컨텍스트 프롬프트 빌드
    let systemPrompt = SYSTEM_PROMPT;
    const contextType = dto.contextType ?? null;
    const contextId = dto.contextId ?? null;
    if (contextType && contextId) {
      const contextBlock = await this.buildContextPrompt(contextType, contextId);
      if (contextBlock) systemPrompt += contextBlock;
    }

    // 대화 세션 생성 or 기존 사용
    let convId = conversationId;
    if (!convId) {
      const conv = await this.prisma.aIConversation.create({
        data: {
          userId,
          title: await this.generateTitle(dto.content),
          taskId: dto.taskId,
          contextType,
          contextId,
        },
      });
      convId = conv.id;
    } else {
      const existing = await this.prisma.aIConversation.findUnique({ where: { id: convId } });
      if (!existing || existing.userId !== userId) {
        res.status(404).json({ message: '대화를 찾을 수 없습니다' });
        return;
      }
      // 기존 대화의 컨텍스트 재사용
      if (existing.contextType && existing.contextId) {
        const contextBlock = await this.buildContextPrompt(existing.contextType, existing.contextId);
        if (contextBlock) systemPrompt = SYSTEM_PROMPT + contextBlock;
      }
    }

    // 유저 메시지 저장
    await this.prisma.aIMessage.create({
      data: {
        conversationId: convId,
        role: AIMessageRole.USER,
        content: dto.content,
        taskType: dto.taskType,
        modelUsed,
        creditsUsed: 0,
      },
    });

    // 대화 히스토리 로드 (최근 20개)
    const historyRows = await this.prisma.aIMessage.findMany({
      where: { conversationId: convId },
      orderBy: { createdAt: 'asc' },
      take: 20,
      select: { role: true, content: true },
    });

    // SSE 헤더 설정
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    // 대화 ID를 FE에 먼저 전달
    res.write(`data: ${JSON.stringify({ type: 'start', conversationId: convId })}\n\n`);

    // 스트리밍 AI 호출
    let fullText = '';
    try {
      for await (const token of this.callAIStream(modelUsed, historyRows, systemPrompt)) {
        fullText += token;
        res.write(`data: ${JSON.stringify({ type: 'token', text: token })}\n\n`);
      }
    } catch (err) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: (err as Error).message })}\n\n`);
      res.end();
      return;
    }

    // 스트리밍 완료 후 트랜잭션 (메시지 저장 + 크레딧 차감)
    await this.prisma.$transaction(async (tx) => {
      await tx.aIMessage.create({
        data: {
          conversationId: convId!,
          role: AIMessageRole.ASSISTANT,
          content: fullText,
          taskType: dto.taskType,
          modelUsed,
          creditsUsed: cost,
        },
      });
      await tx.user.update({ where: { id: userId }, data: { credit: { decrement: cost } } });
      await tx.creditTransaction.create({
        data: {
          userId,
          amount: -cost,
          type: CreditTransactionType.SPEND,
          description: `AI멘토링 (${dto.taskType} ${TIER_LABEL[dto.tier] ?? dto.tier})`,
          relatedId: convId,
        },
      });
      await tx.aIConversation.update({ where: { id: convId! }, data: { updatedAt: new Date() } });
    });

    res.write(`data: ${JSON.stringify({ type: 'done', model: modelUsed, creditsUsed: cost })}\n\n`);
    res.end();
  }

  // ─── AI 메시지 피드백 (DRE-211) ──────────────────────────────
  async rateMessage(conversationId: string, messageId: string, userId: string, rating: 1 | -1) {
    // 대화 소유자 확인
    const conversation = await this.prisma.aIConversation.findUnique({
      where: { id: conversationId },
      select: { userId: true },
    });
    if (!conversation) throw new NotFoundException('대화를 찾을 수 없습니다.');
    if (conversation.userId !== userId) throw new ForbiddenException('접근 권한이 없습니다.');

    // 메시지가 해당 대화에 속하는지 확인 + ASSISTANT 메시지만 평가 가능
    const message = await this.prisma.aIMessage.findFirst({
      where: { id: messageId, conversationId, role: AIMessageRole.ASSISTANT },
    });
    if (!message) throw new NotFoundException('메시지를 찾을 수 없습니다.');

    return this.prisma.aIMessage.update({
      where: { id: messageId },
      data: { rating },
      select: { id: true, rating: true },
    });
  }
}
