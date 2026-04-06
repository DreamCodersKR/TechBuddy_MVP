<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'
import MarkdownViewer from '@/components/post/MarkdownViewer.client.vue'

definePageMeta({ layout: 'default', middleware: 'auth' })
useHead({ title: 'AI 멘토 질문 - FLOWIT' })

const route = useRoute()
const authStore = useAuthStore()
const { post: authPost } = useAuthFetch()

// ─── query param pre-fill ─────────────────────────────────
const taskId = route.query.taskId as string | undefined
const prefillTitle = route.query.title as string | undefined
const prefillDesc = route.query.description as string | undefined
const prefillTaskType = (route.query.taskType as string | undefined) || 'CODE'

// ─── 타입 정의 ───────────────────────────────────────────
const TASK_TYPES = [
  { value: 'CODE', label: '코드', icon: 'heroicons:code-bracket' },
  { value: 'DOCUMENT', label: '문서', icon: 'heroicons:document-text' },
  { value: 'DESIGN', label: '디자인', icon: 'heroicons:paint-brush' },
  { value: 'PLANNING', label: '기획', icon: 'heroicons:light-bulb' },
  { value: 'RESEARCH', label: '리서치', icon: 'heroicons:magnifying-glass' },
  { value: 'OTHER', label: '기타', icon: 'heroicons:ellipsis-horizontal-circle' },
]

const TIERS = [
  { value: 1, label: '기본', cost: 1, desc: '빠른 답변' },
  { value: 2, label: '심화', cost: 10, desc: '더 정확한 분석' },
  { value: 3, label: '전문가', cost: 50, desc: '최고 품질 답변' },
]

// ─── 폼 상태 ─────────────────────────────────────────────
const selectedTaskType = ref(prefillTaskType)
const selectedTier = ref(1)
const content = ref(prefillTitle
  ? `${prefillTitle}${prefillDesc ? `\n\n${prefillDesc}` : ''}\n\n어떤 부분에서 막히셨나요?`
  : '')

const isSending = ref(false)
const messages = ref<{ role: 'USER' | 'ASSISTANT', content: string, modelUsed?: string }[]>([])
const conversationId = ref<string | null>(null)
const inputContent = ref(content.value)
const hasStarted = ref(false)

const userCredit = computed(() => authStore.currentUser?.credit ?? 0)
const selectedTierData = computed(() => TIERS.find(t => t.value === selectedTier.value)!)

async function sendMessage() {
  const text = inputContent.value.trim()
  if (!text || isSending.value) return

  const cost = selectedTierData.value.cost
  if (userCredit.value < cost) {
    alert(`크레딧이 부족합니다. 필요: ${cost}cr, 보유: ${userCredit.value}cr`)
    return
  }

  isSending.value = true
  hasStarted.value = true
  messages.value.push({ role: 'USER', content: text })
  inputContent.value = ''

  try {
    const body: Record<string, unknown> = {
      content: text,
      taskType: selectedTaskType.value,
      tier: selectedTier.value,
    }
    if (taskId) body.taskId = taskId

    const endpoint = conversationId.value
      ? `/ai-mentor/conversations/${conversationId.value}/messages`
      : '/ai-mentor/messages'

    const res = await authPost<{ conversationId: string, model: string, creditsUsed: number }>(endpoint, body)
    conversationId.value = res.conversationId

    // 대화 상세에서 AI 응답 로드
    const { get: authGet } = useAuthFetch()
    const conv = await authGet<{ messages: { role: string, content: string, modelUsed: string }[] }>(`/ai-mentor/conversations/${res.conversationId}`)
    const lastMsg = conv.messages[conv.messages.length - 1]
    if (lastMsg?.role === 'ASSISTANT') {
      messages.value.push({ role: 'ASSISTANT', content: lastMsg.content, modelUsed: lastMsg.modelUsed })
    }

    // 크레딧 차감 반영
    if (authStore.currentUser) {
      authStore.currentUser.credit -= res.creditsUsed
    }
  }
  catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    messages.value.pop()
    inputContent.value = text
    alert(err?.data?.message || '전송에 실패했습니다.')
  }
  finally { isSending.value = false }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendMessage()
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col min-h-[calc(100vh-120px)]">
    <!-- 헤더 -->
    <div class="flex items-center gap-3 mb-6">
      <button
        class="p-2 rounded-lg hover:bg-accent transition-colors"
        @click="navigateTo('/ai-mentor')"
      >
        <Icon icon="heroicons:arrow-left" class="w-5 h-5 text-muted-foreground" />
      </button>
      <div>
        <h1 class="text-xl font-bold text-foreground flex items-center gap-2">
          <Icon icon="heroicons:sparkles" class="w-5 h-5 text-violet-500" />
          AI 멘토에게 질문
        </h1>
        <p v-if="prefillTitle" class="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">
          태스크: {{ prefillTitle }}
        </p>
      </div>
      <div class="ml-auto flex items-center gap-1.5 text-sm text-muted-foreground">
        <Icon icon="heroicons:bolt" class="w-4 h-4 text-amber-500" />
        {{ userCredit }}cr
      </div>
    </div>

    <!-- 설정 (아직 대화 시작 전) -->
    <div v-if="!hasStarted" class="mb-6 space-y-4">
      <!-- 태스크 유형 -->
      <div>
        <p class="text-sm font-medium text-foreground mb-2">
          질문 유형
        </p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="tt in TASK_TYPES"
            :key="tt.value"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors"
            :class="selectedTaskType === tt.value
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'"
            @click="selectedTaskType = tt.value"
          >
            <Icon :icon="tt.icon" class="w-4 h-4" />
            {{ tt.label }}
          </button>
        </div>
      </div>

      <!-- 티어 선택 -->
      <div>
        <p class="text-sm font-medium text-foreground mb-2">
          답변 품질
        </p>
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="tier in TIERS"
            :key="tier.value"
            class="flex flex-col items-center p-3 rounded-lg border transition-colors"
            :class="selectedTier === tier.value
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-primary/50'"
            @click="selectedTier = tier.value"
          >
            <span class="text-sm font-semibold text-foreground">{{ tier.label }}</span>
            <span class="text-xs text-muted-foreground mt-0.5">{{ tier.desc }}</span>
            <span
              class="text-xs font-medium mt-1 px-1.5 py-0.5 rounded-full"
              :class="userCredit >= tier.cost ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-muted text-muted-foreground'"
            >
              {{ tier.cost }}cr
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- 메시지 목록 -->
    <div v-if="hasStarted" class="flex-1 space-y-4 mb-4 overflow-y-auto">
      <div
        v-for="(msg, i) in messages"
        :key="i"
        class="flex gap-3"
        :class="msg.role === 'USER' ? 'flex-row-reverse' : ''"
      >
        <!-- 아바타 -->
        <div
          class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium"
          :class="msg.role === 'USER' ? 'bg-primary text-primary-foreground' : 'bg-violet-100 dark:bg-violet-900/30'"
        >
          <Icon
            v-if="msg.role === 'ASSISTANT'"
            icon="heroicons:sparkles"
            class="w-4 h-4 text-violet-600 dark:text-violet-400"
          />
          <span v-else>나</span>
        </div>
        <!-- 버블 -->
        <div
          class="max-w-[80%] rounded-xl px-4 py-3 text-sm"
          :class="msg.role === 'USER'
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground'"
        >
          <ClientOnly>
            <MarkdownViewer v-if="msg.role === 'ASSISTANT'" :content="msg.content" class="prose prose-sm dark:prose-invert max-w-none" />
            <p v-else class="whitespace-pre-wrap">{{ msg.content }}</p>
          </ClientOnly>
          <p v-if="msg.modelUsed && msg.role === 'ASSISTANT'" class="text-xs opacity-60 mt-1">
            {{ msg.modelUsed }}
          </p>
        </div>
      </div>

      <!-- 전송 중 -->
      <div v-if="isSending" class="flex gap-3">
        <div class="flex-shrink-0 w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
          <Icon icon="heroicons:sparkles" class="w-4 h-4 text-violet-500 animate-pulse" />
        </div>
        <div class="bg-muted rounded-xl px-4 py-3">
          <div class="flex gap-1.5">
            <span class="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style="animation-delay:0ms" />
            <span class="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style="animation-delay:150ms" />
            <span class="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style="animation-delay:300ms" />
          </div>
        </div>
      </div>
    </div>

    <!-- 입력창 -->
    <div class="mt-auto">
      <div class="border border-border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-ring bg-background">
        <textarea
          v-model="inputContent"
          :placeholder="hasStarted ? '추가 질문을 입력하세요...' : '막히는 부분을 자세히 설명해주세요...'"
          rows="4"
          class="w-full px-4 py-3 text-sm bg-transparent resize-none focus:outline-none"
          @keydown="handleKeydown"
        />
        <div class="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/30">
          <span class="text-xs text-muted-foreground">
            Cmd+Enter로 전송 · 소요 크레딧: <span class="font-medium text-foreground">{{ selectedTierData.cost }}cr</span>
          </span>
          <Button
            size="sm"
            :disabled="!inputContent.trim() || isSending"
            @click="sendMessage"
          >
            <Icon v-if="isSending" icon="heroicons:arrow-path" class="w-4 h-4 mr-1.5 animate-spin" />
            <Icon v-else icon="heroicons:paper-airplane" class="w-4 h-4 mr-1.5" />
            전송
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
