# FLOWIT LangChain AI 고도화 기획서 v1.0

> **작성일**: 2026-04-16  
> **작성자**: 윤종호 (DreamCoders 대표)  
> **상태**: 초안 (Draft)  
> **관련 문서**: FLOWIT_기능정의서_v2.3.md, FLOWIT_MCP_API_확장성_기획서_v1.0.md  

---

## 1. 개요

### 1.1 LangChain이란

LangChain.js는 생성형 AI 애플리케이션을 구축하기 위한 오픈소스 프레임워크로, 다음과 같은 핵심 기능을 제공한다:

- **다중 LLM 통합**: OpenAI, Anthropic, Google, Cohere 등 다양한 모델에 대한 통일 인터페이스
- **RAG (Retrieval Augmented Generation)**: 외부 데이터베이스에서 관련 정보를 검색하여 LLM 프롬프트에 주입
- **Agent 패턴**: LLM이 도구(Tool)를 선택·실행하여 복잡한 작업을 자동으로 처리
- **메모리 관리**: 대화 이력을 지능적으로 유지·요약하여 맥락 단절 문제 해결
- **Chain 구성**: 여러 LLM 작업을 선형 또는 조건부로 연결

> **핵심**: LangChain은 단순 LLM API 호출을 넘어, 실제 프로덕션 AI 시스템을 구축할 수 있는 프레임워크

### 1.2 FLOWIT에 도입하는 목적

| 목적 | 현재 상태 | 도입 후 |
|------|---------|--------|
| **RAG 파이프라인** | M12 마일스톤 (미구현, 모든 질문을 일반 LLM으로만 처리) | 사용자의 이전 질문, 프로젝트 맥락, 커뮤니티 데이터를 자동 검색·주입 |
| **멀티모델 라우팅** | 작업유형별 하드코딩된 프롬프트 (프로바이더 추상화 없음) | LangChain 인터페이스로 모델 A 실패 시 모델 B 자동 전환 (fallback chain) |
| **AI 멘토 intelligent화** | 정적 라우팅 (코드는 GPT-4o로, 계획은 Claude3로 고정) | Agent가 "이 질문은 먼저 프로젝트 데이터를 조회한 뒤 코드 분석이 필요"를 스스로 판단 |
| **대화 맥락 유지** | 각 질문이 독립적 (세션 내 맥락 단절) | ConversationMemory로 멘토링 세션별 대화 이력 자동 관리 |

### 1.3 기술 선택: LangChain.js (TypeScript)

- **NestJS와의 완벽한 호환성**: TypeScript 기반, 동기화된 생태계
- **커뮤니티 성숙도**: 초기 LangChain Python에서 프로덕션 사용 사례 축적
- **Supabase pgvector 지원**: LangChain의 공식 VectorStore 통합 가능
- **MCP/REST API 기획과의 시너지**: 도구(Tool) 정의 표준화 → MCP Tool로 재활용

---

## 2. 현재 AI 아키텍처 분석

### 2.1 현재 멀티모델 라우팅 구조

```
사용자 질문
  ↓
MODEL_MATRIX 룩업 (작업유형 기반)
  ├─ CODE → GPT-4o (10cr)
  ├─ DOCUMENT → Claude-3-Opus (50cr)
  ├─ DESIGN → GPT-4-vision (10cr)
  ├─ PLANNING → Claude-3-Sonnet (10cr)
  ├─ RESEARCH → Gemini-2-Pro (10cr)
  └─ OTHER → GPT-4o-mini (1cr)
  ↓
선택된 모델에 프롬프트 전송
  ↓
응답 반환
```

**문제점:**
- 프롬프트가 하드코딩되어 있음 → 모델 변경 시 코드 수정 필수
- 각 호출이 독립적 (이전 대화 맥락 없음)
- 모델 실패 시 폴백 메커니즘 없음
- RAG 파이프라인 전혀 미적용 (모든 질문이 일반 LLM으로만 처리)

### 2.2 현재 한계점

| 한계점 | 영향 |
|--------|------|
| **RAG 부재** | "내 프로젝트의 이전 질문 답변을 참고해서" 같은 요청이 불가능. 할루시네이션 위험 높음. |
| **대화 맥락 단절** | 세 번째 질문에서도 "이전에 뭘 했는지 모르겠어요" 같은 응답 → 사용자 불만족 |
| **정적 라우팅** | 질문 특성에 따라 동적으로 도구/모델을 선택 불가 |
| **하드코딩 프롬프트** | 일관성 있는 멘토링 음성(persona) 유지 어려움 |
| **에러 처리 미흡** | 특정 모델 API 장애 시 전체 멘토링 기능 중단 |

---

## 3. LangChain 적용 시나리오

### 3-1. RAG 파이프라인 구축 (M12 고도화)

#### 3-1.1 전체 흐름

```
데이터 소스 (Task, 커뮤니티, 대화 이력)
  ↓
LangChain DocumentLoader (Supabase 쿼리)
  ↓
TextSplitter (청크 단위로 분할)
  ↓
OpenAI text-embedding-3-small (임베딩 생성)
  ↓
Supabase pgvector (벡터 저장)
  ↓
RetrievalQAChain (사용자 질문 시)
  ├─ 유사도 검색 (cosine similarity)
  ├─ 상위 K개 문서 검색
  └─ LLM 프롬프트에 컨텍스트 주입
  ↓
최종 응답 (프로젝트 맥락 포함)
```

#### 3-1.2 구현 상세

**의존성:**
```bash
npm install langchain @langchain/community @langchain/openai
npm install pg-vector # Supabase pgvector 라이브러리
```

**Prisma 스키마 (벡터 저장):**
```prisma
model DocumentEmbedding {
  id            String          @id @default(cuid())
  sourceId      String          // Task ID or QnA ID or Post ID
  sourceType    String          // "task", "qna", "post", "conversation"
  content       String          @db.Text
  embedding     Unsupported("vector(1536)")? // OpenAI embedding dim
  metadata      Json
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  @@index([sourceId, sourceType])
  @@index([createdAt])
}
```

**NestJS RAG Service:**
```typescript
import { Injectable } from '@nestjs/common';
import { OpenAIEmbeddings } from '@langchain/openai';
import { RetrievalQAChain } from 'langchain/chains';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class RagService {
  private embeddings: OpenAIEmbeddings;
  private prisma = new PrismaClient();

  constructor() {
    this.embeddings = new OpenAIEmbeddings({
      apiKey: process.env.OPENAI_API_KEY,
      modelName: 'text-embedding-3-small',
    });
  }

  // 1. 문서 임베딩 및 벡터 저장
  async embedAndStoreDocument(
    sourceId: string,
    sourceType: 'task' | 'qna' | 'post' | 'conversation',
    content: string,
    metadata: Record<string, any>,
  ) {
    const embedding = await this.embeddings.embedQuery(content);
    
    await this.prisma.documentEmbedding.create({
      data: {
        sourceId,
        sourceType,
        content,
        embedding, // pgvector 저장
        metadata,
      },
    });
  }

  // 2. 벡터 검색
  async searchSimilarDocuments(
    query: string,
    topK: number = 5,
    sourceTypes?: string[],
  ) {
    const queryEmbedding = await this.embeddings.embedQuery(query);
    
    // Supabase pgvector RPC 호출
    const results = await this.prisma.$queryRaw`
      SELECT 
        id, sourceId, sourceType, content, metadata,
        1 - (embedding <=> ${queryEmbedding}::vector) as similarity
      FROM "DocumentEmbedding"
      ${sourceTypes ? `WHERE "sourceType" = ANY($1)` : ''}
      ORDER BY embedding <=> ${queryEmbedding}::vector
      LIMIT ${topK}
    `;
    
    return results;
  }

  // 3. RAG 기반 질문 응답
  async answerWithRag(userId: string, question: string, workType: string) {
    // 사용자 컨텍스트 검색 (이전 질문, 프로젝트 데이터, QnA)
    const context = await this.searchSimilarDocuments(question, 10, [
      'task',
      'conversation',
      'qna',
    ]);

    // 프롬프트 구성
    const systemPrompt = `
당신은 IT 취준생·주니어 개발자를 위한 AI 멘토입니다.
아래 컨텍스트는 사용자의 이전 활동, 프로젝트 정보, 커뮤니티 Q&A입니다.
이를 활용하여 개인화된 조언을 제공하세요.

---
컨텍스트:
${context.map(doc => `[${doc.sourceType}] ${doc.content}`).join('\n')}
---

작업 유형: ${workType}
질문: ${question}

개인화되고 실용적인 조언을 제공하세요.
    `;

    // LLM 호출 (나중에 Agent로 확장 가능)
    const response = await this.llmService.call(systemPrompt, workType);

    // 응답과 사용된 컨텍스트 반환
    return {
      answer: response,
      sources: context.slice(0, 3), // 상위 3개만 참고 문헌으로 표시
    };
  }
}
```

#### 3-1.3 데이터 온보딩

**Task/QnA 생성 시 자동 임베딩:**
```typescript
// TaskService에 임베딩 훅 추가
async createTask(userId: string, createTaskDto: CreateTaskDto) {
  const task = await this.prisma.task.create({
    data: { ...createTaskDto, userId },
  });

  // 비동기로 임베딩
  this.ragService.embedAndStoreDocument(
    task.id,
    'task',
    `${task.title}\n${task.description}`,
    {
      userId,
      projectId: task.projectId,
      status: task.status,
    },
  ).catch(err => console.error('Embedding error:', err));

  return task;
}
```

**대화 이력도 실시간 임베딩:**
```typescript
// AI 멘토 응답 저장 후 즉시 임베딩
async saveMentorResponse(sessionId: string, userQuestion: string, response: string) {
  const conversation = await this.prisma.mentorConversation.create({
    data: { sessionId, userMessage: userQuestion, response },
  });

  // 임베딩 저장
  await this.ragService.embedAndStoreDocument(
    conversation.id,
    'conversation',
    `Q: ${userQuestion}\nA: ${response}`,
    { sessionId },
  );

  return conversation;
}
```

---

### 3-2. AI 멘토 Agent화

#### 3-2.1 현재 vs 개선안

**현재 (정적 라우팅):**
```
질문 "내 데이터베이스 느려졌어"
  ↓
작업유형: "CODE" 감지
  ↓
GPT-4o로 고정 라우팅
  ↓
일반적인 DB 최적화 팁 반환 (프로젝트 데이터 없음)
```

**개선 (Agent):**
```
질문 "내 데이터베이스 느려졌어"
  ↓
Agent 초기화
  ├─ Tool 1: ProjectDataFetcher (사용자 프로젝트 스키마 조회)
  ├─ Tool 2: CodeAnalyzer (기존 DB 쿼리 분석)
  ├─ Tool 3: DocumentSearcher (RAG로 유사 해결책 검색)
  └─ Tool 4: PerformanceProfiler (쿼리 성능 측정)
  ↓
Agent가 자동 선택: "먼저 프로젝트 데이터를 가져와야겠다"
  ↓
Tool 1 실행 → 사용자 DB 스키마 반환
  ↓
Agent 재판단: "이제 기존 쿼리들을 분석해보자"
  ↓
Tool 2 실행 → N+1 쿼리 문제 발견
  ↓
최적화된 SQL 제시 (프로젝트 맥락 기반)
```

#### 3-2.2 Tool 정의

```typescript
// tools/project-data-fetcher.tool.ts
import { Tool } from 'langchain/tools';
import { PrismaClient } from '@prisma/client';

export class ProjectDataFetcherTool extends Tool {
  name = 'ProjectDataFetcher';
  description = `
    Fetch user's project information including:
    - Database schema (tables, columns, indexes)
    - Recent commits and code changes
    - Project dependencies and tech stack
    
    Use this when you need context about the user's actual project.
  `;

  constructor(private prisma: PrismaClient, private userId: string) {
    super();
  }

  async _call(projectId: string): Promise<string> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId, userId: this.userId },
      include: {
        tasks: { take: 10, orderBy: { createdAt: 'desc' } },
        metadata: true,
      },
    });

    if (!project) return 'Project not found';

    return JSON.stringify({
      name: project.name,
      techStack: project.metadata?.techStack,
      description: project.description,
      recentTasks: project.tasks.map(t => t.title),
    });
  }
}

// tools/code-analyzer.tool.ts
export class CodeAnalyzerTool extends Tool {
  name = 'CodeAnalyzer';
  description = `
    Analyze code snippets for:
    - Complexity issues (N+1 queries, inefficient loops)
    - Anti-patterns and bad practices
    - Security vulnerabilities
    
    Provide the code as input and get analysis.
  `;

  async _call(code: string): Promise<string> {
    // 외부 코드 분석 API 호출 또는 로컬 파서 사용
    // 여기서는 예시로 간단한 분석만 수행
    const analysis = {
      hasN1: code.includes('await') && code.match(/await.*loop/gi),
      hasHardcodedValues: /['"][a-zA-Z0-9]+['"]/.test(code),
      complexity: code.split('\n').length,
    };

    return JSON.stringify(analysis);
  }
}

// tools/document-searcher.tool.ts
export class DocumentSearcherTool extends Tool {
  name = 'DocumentSearcher';
  description = `
    Search for similar problems and solutions in:
    - User's previous conversations with AI mentor
    - FLOWIT community Q&A
    - Public documentation
    
    Provide keywords or the problem description.
  `;

  constructor(private ragService: RagService) {
    super();
  }

  async _call(query: string): Promise<string> {
    const results = await this.ragService.searchSimilarDocuments(query, 5);
    return JSON.stringify(
      results.map(r => ({ source: r.sourceType, content: r.content }))
    );
  }
}
```

#### 3-2.3 Agent 실행 로직

```typescript
// ai-mentor.service.ts
import { AgentExecutor, initializeAgentExecutorWithOptions } from 'langchain/agents';
import { ChatOpenAI } from '@langchain/openai';

@Injectable()
export class AiMentorService {
  async answerWithAgent(
    userId: string,
    question: string,
    projectId: string,
    workType: string,
  ) {
    // Tool 조합
    const tools = [
      new ProjectDataFetcherTool(this.prisma, userId),
      new CodeAnalyzerTool(),
      new DocumentSearcherTool(this.ragService),
    ];

    // LLM 모델 선택 (멀티모델 라우팅과 통합)
    const llm = new ChatOpenAI({
      modelName: this.selectModel(workType),
      temperature: 0.7,
    });

    // Agent 초기화
    const agent = await initializeAgentExecutorWithOptions(tools, llm, {
      agentType: 'openai-functions',
      verbose: true, // 디버깅용
    });

    // Agent 실행
    try {
      const result = await agent.call({ input: question });
      return {
        answer: result.output,
        creditsUsed: this.calculateCredits(workType),
      };
    } catch (error) {
      // fallback to simple LLM call
      return this.fallbackAnswer(question, workType);
    }
  }

  private selectModel(workType: string): string {
    const modelMap = {
      CODE: 'gpt-4o',
      DOCUMENT: 'gpt-4-turbo',
      DESIGN: 'gpt-4-vision',
      PLANNING: 'gpt-4-turbo',
      RESEARCH: 'gpt-4o',
      OTHER: 'gpt-3.5-turbo',
    };
    return modelMap[workType] || 'gpt-4o-mini';
  }
}
```

---

### 3-3. 멀티모델 라우팅 통합

#### 3-3.1 LangChain 통일 인터페이스

LangChain은 모든 LLM을 동일한 인터페이스로 제공하므로, 프로바이더 추상화가 자동으로 가능하다.

```typescript
// llm-factory.service.ts
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

@Injectable()
export class LlmFactoryService {
  createLlm(provider: string, modelName: string) {
    switch (provider) {
      case 'openai':
        return new ChatOpenAI({
          apiKey: process.env.OPENAI_API_KEY,
          modelName,
          temperature: 0.7,
        });

      case 'anthropic':
        return new ChatAnthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
          modelId: modelName,
          temperature: 0.7,
        });

      case 'google':
        return new ChatGoogleGenerativeAI({
          apiKey: process.env.GOOGLE_API_KEY,
          modelName,
          temperature: 0.7,
        });

      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }
}
```

#### 3-3.2 Fallback Chain (모델 장애 자동 처리)

```typescript
import { RunnableSequence } from 'langchain/runnables';

// mentoring.service.ts
async answerWithFallback(
  userId: string,
  question: string,
  workType: string,
): Promise<string> {
  // 1차 선택: 크레딧 기반 Tier 모델
  const primaryModel = this.selectModelByTier(workType, userTier);
  const primaryLlm = this.llmFactory.createLlm(
    primaryModel.provider,
    primaryModel.name,
  );

  // 2차 fallback: 더 저렴한 모델
  const fallbackModel = this.getFollupModel(workType);
  const fallbackLlm = this.llmFactory.createLlm(
    fallbackModel.provider,
    fallbackModel.name,
  );

  // Fallback Chain 구성
  const chain = RunnableSequence.from([
    {
      question: () => question,
      context: () => getRelevantContext(question), // RAG
    },
    primaryLlm.withFallbacks([{ fallback: fallbackLlm }]),
  ]);

  try {
    const response = await chain.invoke({});
    return response.content;
  } catch (error) {
    // 모든 모델 실패 시 에러 반환 (UI에서 재시도 안내)
    throw new MentorUnavailableException('All models failed');
  }
}
```

---

### 3-4. Conversation Memory 관리

#### 3-4.1 메모리 전략

| 메모리 타입 | 사용처 | 특징 |
|-----------|--------|------|
| **BufferWindowMemory** | 짧은 멘토링 세션 (5~10 턴) | 최근 N턴만 유지, 비용 최소 |
| **SummaryMemory** | 장기 멘토링 (수십 턴) | 과거 대화 자동 요약, 토큰 절약 |
| **EntityMemory** | 사용자 프로필 추적 | "사용자가 NestJS 배우는 중", "주니어 레벨" 등 추출 |

#### 3-4.2 구현

```typescript
// memory.service.ts
import {
  BufferWindowMemory,
  ConversationSummaryMemory,
} from 'langchain/memory';

@Injectable()
export class MemoryService {
  // 세션별 메모리 맵
  private sessionMemories = new Map<string, any>();

  // 메모리 생성 또는 로드
  async getOrCreateMemory(
    sessionId: string,
    userId: string,
    turnCount: number,
  ) {
    if (this.sessionMemories.has(sessionId)) {
      return this.sessionMemories.get(sessionId);
    }

    // 턴 수에 따라 메모리 타입 선택
    let memory;
    if (turnCount < 10) {
      // 짧은 세션: BufferWindowMemory
      memory = new BufferWindowMemory({
        returnMessages: true,
        k: 5, // 최근 5개 메시지만 유지
        memoryKey: 'chat_history',
      });
    } else {
      // 긴 세션: SummaryMemory
      memory = new ConversationSummaryMemory({
        llm: new ChatOpenAI({ modelName: 'gpt-3.5-turbo' }),
        memoryKey: 'chat_history',
      });
    }

    // DB에서 기존 대화 이력 로드
    const conversations = await this.loadConversationHistory(sessionId);
    for (const conv of conversations) {
      await memory.saveContext(
        { input: conv.userMessage },
        { output: conv.response },
      );
    }

    this.sessionMemories.set(sessionId, memory);
    return memory;
  }

  // 메모리에 새 턴 추가
  async addTurn(
    sessionId: string,
    userMessage: string,
    response: string,
  ) {
    const memory = this.sessionMemories.get(sessionId);
    if (!memory) throw new Error('Session memory not found');

    await memory.saveContext(
      { input: userMessage },
      { output: response },
    );

    // DB에도 저장 (영구 기록)
    await this.prisma.mentorConversation.create({
      data: {
        sessionId,
        userMessage,
        response,
      },
    });
  }

  // 세션 종료 시 메모리 정리
  async closeSession(sessionId: string) {
    this.sessionMemories.delete(sessionId);
  }

  private async loadConversationHistory(sessionId: string) {
    return this.prisma.mentorConversation.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
```

#### 3-4.3 멘토링 체인에 메모리 통합

```typescript
// ai-mentor.service.ts
async answerWithMemory(
  userId: string,
  sessionId: string,
  question: string,
): Promise<string> {
  // 세션 메모리 로드
  const sessionData = await this.prisma.mentorSession.findUnique({
    where: { id: sessionId },
  });
  const memory = await this.memoryService.getOrCreateMemory(
    sessionId,
    userId,
    sessionData.turnCount,
  );

  // LLM과 메모리를 연결한 체인
  const llm = new ChatOpenAI({ modelName: 'gpt-4o' });
  
  const chain = new ConversationChain({
    llm,
    memory,
    prompt: new PromptTemplate({
      template: `
당신은 IT 취준생 멘토입니다. 사용자의 이전 대화 맥락을 활용하여 조언하세요.

이전 대화 이력:
{chat_history}

새로운 질문: {input}

개인화되고 일관된 조언을 제공하세요.
      `,
      inputVariables: ['input', 'chat_history'],
    }),
  });

  // 체인 실행
  const response = await chain.call({ input: question });

  // 메모리에 새 턴 저장
  await this.memoryService.addTurn(sessionId, question, response);

  // 세션 턴 카운트 증가
  await this.prisma.mentorSession.update({
    where: { id: sessionId },
    data: { turnCount: { increment: 1 } },
  });

  return response;
}
```

---

## 4. 기술 구현 가이드

### 4-1. 패키지 및 의존성

```bash
# 핵심 LangChain 패키지
npm install langchain @langchain/core

# 프로바이더별 LLM 패키지
npm install @langchain/openai @langchain/anthropic @langchain/google-genai

# 커뮤니티 패키지 (Vector store, Document loader 등)
npm install @langchain/community

# 벡터 DB
npm install pg pg-vector

# 타입 정의
npm install --save-dev @types/node
```

**package.json 예시:**
```json
{
  "dependencies": {
    "langchain": "^0.1.35",
    "@langchain/core": "^0.1.35",
    "@langchain/openai": "^0.0.15",
    "@langchain/anthropic": "^0.0.10",
    "@langchain/google-genai": "^0.0.9",
    "@langchain/community": "^0.0.25",
    "pg": "^8.11.0",
    "pg-vector": "^0.1.0"
  }
}
```

### 4-2. Supabase pgvector 연동

#### 4-2.1 pgvector 확장 활성화

```sql
-- Supabase SQL Editor에서 실행
CREATE EXTENSION IF NOT EXISTS vector;
```

#### 4-2.2 Prisma 스키마

```prisma
// prisma/schema.prisma
model DocumentEmbedding {
  id            String   @id @default(cuid())
  sourceId      String
  sourceType    String   // "task" | "qna" | "post" | "conversation"
  content       String   @db.Text
  embedding     Unsupported("vector(1536)")? // OpenAI text-embedding-3-small은 1536차원
  metadata      Json
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([sourceId])
  @@index([sourceType])
  @@index([createdAt])
}

model MentorSession {
  id          String   @id @default(cuid())
  userId      String
  projectId   String?
  workType    String   // "CODE" | "DOCUMENT" | "DESIGN" | ...
  turnCount   Int      @default(0)
  startedAt   DateTime @default(now())
  endedAt     DateTime?
  
  conversations MentorConversation[]
  
  @@index([userId])
}

model MentorConversation {
  id         String   @id @default(cuid())
  sessionId  String
  userMessage String  @db.Text
  response   String   @db.Text
  createdAt  DateTime @default(now())
  
  session MentorSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  
  @@index([sessionId])
}
```

#### 4-2.3 벡터 검색 쿼리

```typescript
// Vector 유사도 검색 (cosine similarity)
async function searchByVector(queryEmbedding: number[], topK = 5) {
  const results = await prisma.$queryRaw`
    SELECT 
      id,
      "sourceId",
      "sourceType",
      content,
      metadata,
      1 - ("embedding" <=> ${queryEmbedding}::vector) as similarity
    FROM "DocumentEmbedding"
    WHERE "embedding" IS NOT NULL
    ORDER BY "embedding" <=> ${queryEmbedding}::vector
    LIMIT ${topK}
  `;
  
  return results;
}

// 특정 소스 타입만 검색
async function searchBySourceType(
  queryEmbedding: number[],
  sourceTypes: string[],
  topK = 5,
) {
  const results = await prisma.$queryRaw`
    SELECT 
      id,
      "sourceId",
      "sourceType",
      content,
      metadata,
      1 - ("embedding" <=> ${queryEmbedding}::vector) as similarity
    FROM "DocumentEmbedding"
    WHERE "sourceType" = ANY(${sourceTypes}::text[])
    AND "embedding" IS NOT NULL
    ORDER BY "embedding" <=> ${queryEmbedding}::vector
    LIMIT ${topK}
  `;
  
  return results;
}
```

### 4-3. NestJS 서비스 구조

#### 4-3.1 모듈 구조

```
src/
├── ai/
│   ├── ai.module.ts
│   ├── llm/
│   │   ├── llm-factory.service.ts
│   │   └── llm.service.ts
│   ├── rag/
│   │   ├── rag.service.ts
│   │   └── embeddings.service.ts
│   ├── memory/
│   │   └── memory.service.ts
│   ├── agent/
│   │   ├── agent.service.ts
│   │   └── tools/
│   │       ├── project-data-fetcher.tool.ts
│   │       ├── code-analyzer.tool.ts
│   │       └── document-searcher.tool.ts
│   └── mentor/
│       ├── ai-mentor.service.ts
│       └── ai-mentor.controller.ts
```

#### 4-3.2 ai.module.ts

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LlmFactoryService } from './llm/llm-factory.service';
import { RagService } from './rag/rag.service';
import { MemoryService } from './memory/memory.service';
import { AgentService } from './agent/agent.service';
import { AiMentorService } from './mentor/ai-mentor.service';
import { AiMentorController } from './mentor/ai-mentor.controller';

@Module({
  imports: [ConfigModule],
  providers: [
    LlmFactoryService,
    RagService,
    MemoryService,
    AgentService,
    AiMentorService,
  ],
  controllers: [AiMentorController],
  exports: [AiMentorService, RagService, AgentService],
})
export class AiModule {}
```

#### 4-3.3 기존 ai-mentor.service.ts와의 통합

**기존 코드:**
```typescript
// src/mentor/services/ai-mentor.service.ts
async askMentor(userId: string, dto: AskMentorDto) {
  // MODEL_MATRIX 기반 라우팅
  const modelKey = this.routeModel(dto.workType, dto.tier);
  const response = await this.llmProvider.call(modelKey, dto.message);
  // ...
}
```

**개선 코드:**
```typescript
// src/ai/mentor/ai-mentor.service.ts
@Injectable()
export class AiMentorService {
  constructor(
    private agentService: AgentService,
    private ragService: RagService,
    private memoryService: MemoryService,
    private prisma: PrismaClient,
  ) {}

  async askMentor(userId: string, dto: AskMentorDto) {
    const { message, workType, tier, projectId, sessionId } = dto;

    // 세션 없으면 새로 생성
    const session = await this.ensureSession(userId, sessionId, workType, projectId);

    // Agent + RAG + Memory 통합
    let response: string;
    
    if (tier === 1) {
      // Tier 1: 빠른 응답 (메모리 + RAG만, Agent 제외)
      response = await this.ragService.answerWithRag(userId, message, workType);
    } else if (tier === 2) {
      // Tier 2: 균형잡힌 응답 (메모리 + RAG + 간단한 라우팅)
      response = await this.memoryService.addContextAndRespond(
        session.id,
        message,
      );
    } else {
      // Tier 3: 풀 파워 (Agent + RAG + 메모리)
      response = await this.agentService.executeFullAgent(
        userId,
        session.id,
        message,
        projectId,
        workType,
      );
    }

    // 세션 메모리 업데이트
    await this.memoryService.addTurn(session.id, message, response);

    // 크레딧 차감 및 응답 저장
    await this.saveMentorResponse(session.id, message, response, tier);

    return { response, creditsUsed: this.calculateCredits(tier) };
  }

  private async ensureSession(
    userId: string,
    sessionId: string | undefined,
    workType: string,
    projectId: string | undefined,
  ) {
    if (sessionId) {
      return this.prisma.mentorSession.findUnique({ where: { id: sessionId } });
    }

    return this.prisma.mentorSession.create({
      data: { userId, workType, projectId },
    });
  }
}
```

---

## 5. 비용 분석

### 5-1. 임베딩 비용

| 모델 | 가격 | 월 예상 (10만 토큰 기준) |
|------|------|---------|
| **OpenAI text-embedding-3-small** | $0.02 / 1M tokens | $2 |
| OpenAI text-embedding-3-large | $0.13 / 1M tokens | $13 |
| Cohere Embed | $0.10 / 1M tokens | $10 |
| Gemini 1.5 Embed | 무료 (한도 내) | $0 |

**추천**: `text-embedding-3-small` (가성비 최고, 차원 1536으로 충분)

### 5-2 Supabase 추가 비용

pgvector 저장소는 기존 PostgreSQL 용량에 포함되므로 추가 비용 없음.

| 항목 | 비용 |
|------|------|
| pgvector 확장 | 무료 |
| 벡터 스토리지 (100만 문서, 1536차원) | 약 500MB (기존 플랜에 포함) |
| 벡터 검색 (인덱싱) | 무료 |

### 5-3 총 추가 비용

**기존 AI API 비용:**
- OpenAI GPT-4o: ~$3,000/월 (사용량 기준)
- Claude API: ~$1,000/월
- Gemini API: ~$500/월

**LangChain 도입 시 추가:**
- 임베딩 (text-embedding-3-small): +$2/월
- 메모리 관리 (GPT-3.5 요약): +$50/월 (선택사항, 긴 세션만)

**총 추가 비용: 약 $52/월 (전체 AI API 비용의 1% 미만)**

---

## 6. 구현 로드맵

### Phase 1: RAG 기본 파이프라인 (M12, 2주)

**목표**: Task/QnA/대화 이력을 벡터화하고 검색 가능하게 만들기

- [ ] Supabase pgvector 활성화 및 Prisma 스키마 작성
- [ ] OpenAI text-embedding-3-small 통합 (RagService)
- [ ] DocumentEmbedding 테이블 마이그레이션
- [ ] Task/QnA 생성 시 자동 임베딩 훅 구현
- [ ] 벡터 검색 쿼리 작성
- [ ] 기본 RAG 체인 구현 (`RetrievalQAChain`)
- [ ] 테스트 및 배포

**산출물:**
- RagService 클래스
- 임베딩 자동화 훅
- RAG 검색 쿼리 성능 벤치마크

---

### Phase 2: Conversation Memory + 세션 관리 (M12+, 2주)

**목표**: 멘토링 세션별 대화 맥락 유지

- [ ] MemoryService 구현 (BufferWindowMemory, SummaryMemory)
- [ ] MentorSession, MentorConversation 테이블 생성
- [ ] 세션별 메모리 로드/저장 로직
- [ ] ConversationChain 통합
- [ ] 장기 세션 요약 메커니즘
- [ ] 메모리 퍼시스턴스 (DB ↔ 메모리 동기화)
- [ ] 통합 테스트

**산출물:**
- MemoryService 클래스
- 세션 관리 API
- 메모리 성능 프로필

---

### Phase 3: Agent 패턴 도입 + Tool 정의 (M12++, 3주)

**목표**: 질문 특성에 따라 도구를 자동 선택하는 Agent 구현

- [ ] Tool 추상 클래스 설계
- [ ] ProjectDataFetcherTool 구현
- [ ] CodeAnalyzerTool 구현
- [ ] DocumentSearcherTool 구현
- [ ] AgentService (OpenAI Functions Agent) 구현
- [ ] Fallback 메커니즘 추가
- [ ] Agent 실행 로직 테스트
- [ ] MCP Tool로 재활용 준비

**산출물:**
- AgentService 클래스
- Tool 4~5개 구현
- Agent 성능 벤치마크

---

### Phase 4: 멀티모델 Fallback Chain + 최적화 (후속, 2~3주)

**목표**: 모든 모델 통합, 장애 복원력 강화

- [ ] LlmFactoryService 완성 (모든 프로바이더)
- [ ] Fallback Chain 구현 (모델 A → B → C)
- [ ] 크레딧 기반 Tier별 모델 선택 로직
- [ ] 성능 모니터링 (응답 시간, 비용)
- [ ] RAG 검색 최적화 (chroma, faiss 등 고려)
- [ ] 프로덕션 배포 및 모니터링

**산출물:**
- LlmFactoryService 완성
- Fallback Chain 구현
- 성능 대시보드

---

## 7. 레퍼런스

### 공식 문서
- [LangChain.js 공식 문서](https://js.langchain.com)
- [LangChain Agents](https://js.langchain.com/docs/modules/agents/)
- [LangChain Memory](https://js.langchain.com/docs/modules/memory/)
- [LangChain RAG](https://js.langchain.com/docs/use_cases/question_answering/)

### Supabase pgvector
- [Supabase pgvector 가이드](https://supabase.com/docs/guides/database/extensions/pgvector)
- [pgvector 성능 최적화](https://github.com/pgvector/pgvector)

### 유사 사례
- **Quivr**: Supabase + LangChain을 활용한 RAG 플랫폼 (오픈소스)
- **Notion AI**: 자체 문서 맥락을 기반으로 한 AI 조언
- **ChatPDF**: PDF 벡터화 및 검색 기반 응답
- **GitHub Copilot**: 리포지토리 맥락 이해 (유사 개념)

### 추가 학습 자료
- [LangChain in Action](https://www.manning.com/books/langchain-in-action) (서적)
- [LangChain Academy](https://academy.langchain.com) (공식 강의)
- [Harrison Chase 유튜브](https://www.youtube.com/@harrisonchase) (LangChain 창시자)

---

## 부록: 구현 체크리스트

### 환경 설정
- [ ] Supabase 프로젝트에서 pgvector 활성화
- [ ] OpenAI API Key 환경변수 설정
- [ ] LangChain 패키지 설치 (`npm install`)
- [ ] Prisma 스키마 작성 및 마이그레이션

### Phase 1 체크리스트
- [ ] RagService 클래스 구현
- [ ] EmbeddingsService 구현
- [ ] DocumentEmbedding 테이블 생성
- [ ] Task/QnA 생성 시 임베딩 훅 작성
- [ ] 벡터 검색 쿼리 작성 및 테스트
- [ ] RetrievalQAChain 통합 및 테스트

### Phase 2 체크리스트
- [ ] MemoryService 클래스 구현
- [ ] MentorSession/MentorConversation 테이블 생성
- [ ] BufferWindowMemory 테스트
- [ ] SummaryMemory 테스트 (장기 세션)
- [ ] ConversationChain 통합 테스트

### Phase 3 체크리스트
- [ ] Tool 기반 클래스 설계
- [ ] 각 Tool 구현 및 개별 테스트
- [ ] AgentService 구현
- [ ] OpenAI Functions Agent 테스트
- [ ] Fallback 로직 테스트

### 테스트 및 배포
- [ ] 통합 테스트 (모든 모듈)
- [ ] 성능 벤치마크 (응답 시간, 비용)
- [ ] 사용자 UAT (3~5명 베타 테스트)
- [ ] 프로덕션 배포
- [ ] 모니터링 대시보드 구축
