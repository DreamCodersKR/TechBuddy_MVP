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

@Injectable()
export class AiMentorService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private readonly quest: QuestService,
  ) {}

  // ─── AI 스트리밍 호출 (AsyncGenerator) ───────────────────────
  private async *callAIStream(modelId: string, history: HistoryMessage[]): AsyncGenerator<string> {
    if (modelId.startsWith('claude-')) {
      const client = new Anthropic({ apiKey: this.config.get<string>('ANTHROPIC_API_KEY')! });
      const stream = await client.messages.stream({
        model: modelId,
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
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
          { role: 'system', content: SYSTEM_PROMPT },
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
      const model = genAI.getGenerativeModel({ model: modelId, systemInstruction: SYSTEM_PROMPT });
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
  private async callAI(modelId: string, history: HistoryMessage[]): Promise<string> {
    if (modelId.startsWith('claude-')) {
      const client = new Anthropic({ apiKey: this.config.get<string>('ANTHROPIC_API_KEY')! });
      const response = await client.messages.create({
        model: modelId,
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
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
          { role: 'system', content: SYSTEM_PROMPT },
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
      const model = genAI.getGenerativeModel({ model: modelId, systemInstruction: SYSTEM_PROMPT });
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
          { role: 'system', content: SYSTEM_PROMPT },
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

    // 대화 세션 생성 or 기존 사용
    let convId = conversationId;
    if (!convId) {
      const conv = await this.prisma.aIConversation.create({
        data: { userId, title: dto.content.slice(0, 50), taskId: dto.taskId },
      });
      convId = conv.id;
    } else {
      const existing = await this.prisma.aIConversation.findUnique({ where: { id: convId } });
      if (!existing || existing.userId !== userId)
        throw new NotFoundException('대화를 찾을 수 없습니다');
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
      aiResponse = await this.callAI(modelUsed, historyRows);
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

    // 대화 세션 생성 or 기존 사용
    let convId = conversationId;
    if (!convId) {
      const conv = await this.prisma.aIConversation.create({
        data: { userId, title: dto.content.slice(0, 50), taskId: dto.taskId },
      });
      convId = conv.id;
    } else {
      const existing = await this.prisma.aIConversation.findUnique({ where: { id: convId } });
      if (!existing || existing.userId !== userId) {
        res.status(404).json({ message: '대화를 찾을 수 없습니다' });
        return;
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
      for await (const token of this.callAIStream(modelUsed, historyRows)) {
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
