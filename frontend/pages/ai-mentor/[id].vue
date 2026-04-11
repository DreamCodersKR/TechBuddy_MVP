<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'
import MarkdownViewer from '@/components/post/MarkdownViewer.client.vue'
import { toast } from 'vue-sonner'

definePageMeta({ layout: 'default', middleware: 'auth' })
useHead({ title: 'FLOWIT AI - FLOWIT' })

const route = useRoute()
const conversationId = route.params.id as string
const authStore = useAuthStore()
const config = useRuntimeConfig()
const { get: authGet, patch: authPatch } = useAuthFetch()

const TIERS = [
  { value: 1, label: '일반', cost: 1 },
  { value: 2, label: '심화', cost: 10 },
  { value: 3, label: '전문가', cost: 50 },
]

interface Message {
  id: string
  role: 'USER' | 'ASSISTANT'
  content: string
  modelUsed: string
  taskType: string
  creditsUsed: number
  createdAt: string
  rating?: number | null
  isStreaming?: boolean
}

interface Conversation {
  id: string
  title: string
  contextType: string | null
  contextId: string | null
  messages: Message[]
}

const conversation = ref<Conversation | null>(null)
const loading = ref(true)
const inputContent = ref('')
const isSending = ref(false)
const selectedTier = ref(1)
const copiedMsgId = ref<string | null>(null)

const userCredit = computed(() => authStore.currentUser?.credit ?? 0)
const userPlan = computed(() => authStore.currentUser?.plan ?? 'FREE')
const selectedTierCost = computed(() => TIERS.find(t => t.value === selectedTier.value)?.cost ?? 1)

async function loadConversation() {
  loading.value = true
  try {
    conversation.value = await authGet<Conversation>(`/ai-mentor/conversations/${conversationId}`)
  }
  catch { navigateTo('/ai-mentor') }
  finally { loading.value = false }
}

async function sendMessage() {
  const text = inputContent.value.trim()
  if (!text || isSending.value || !conversation.value) return

  isSending.value = true
  inputContent.value = ''

  // USER 메시지 낙관적 추가
  conversation.value.messages.push({
    id: 'temp-user',
    role: 'USER',
    content: text,
    modelUsed: '',
    taskType: 'CODE',
    creditsUsed: 0,
    createdAt: new Date().toISOString(),
  })

  // 스트리밍 AI 메시지 placeholder
  const streamingIdx = conversation.value.messages.length
  conversation.value.messages.push({
    id: 'temp-streaming',
    role: 'ASSISTANT',
    content: '',
    modelUsed: '',
    taskType: 'CODE',
    creditsUsed: 0,
    createdAt: new Date().toISOString(),
    isStreaming: true,
  })

  try {
    const response = await fetch(
      `${config.public.apiBaseUrl}/ai-mentor/conversations/${conversationId}/messages/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authStore.accessToken}`,
        },
        body: JSON.stringify({ content: text, taskType: 'CODE', tier: selectedTier.value }),
      },
    )

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.message || '전송에 실패했습니다.')
    }

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = JSON.parse(line.slice(6))

        if (data.type === 'token') {
          conversation.value!.messages[streamingIdx].content += data.text
        }
        if (data.type === 'done') {
          conversation.value!.messages[streamingIdx].isStreaming = false
          conversation.value!.messages[streamingIdx].modelUsed = data.model
          conversation.value!.messages[streamingIdx].creditsUsed = data.creditsUsed
          if (authStore.currentUser) {
            authStore.currentUser.credit -= data.creditsUsed
          }
        }
        if (data.type === 'error') {
          throw new Error(data.message)
        }
      }
    }
  }
  catch (e: unknown) {
    conversation.value!.messages.splice(streamingIdx, 1)
    conversation.value!.messages.pop()
    inputContent.value = text
    toast.error((e as Error).message || '전송에 실패했습니다.')
  }
  finally { isSending.value = false }
}

async function rateMessage(msg: Message, rating: 1 | -1) {
  if (msg.rating === rating) return // 이미 동일 평가
  try {
    await authPatch(`/ai-mentor/conversations/${conversationId}/messages/${msg.id}/rating`, { rating })
    msg.rating = rating
  }
  catch { /* 실패 시 조용히 무시 */ }
}

async function copyMessage(msgId: string, content: string) {
  await navigator.clipboard.writeText(content)
  copiedMsgId.value = msgId
  setTimeout(() => { copiedMsgId.value = null }, 2000)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
    e.preventDefault()
    sendMessage()
  }
}

onMounted(() => { loadConversation() })
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col min-h-[calc(100vh-120px)]">
    <!-- 헤더 -->
    <div class="flex items-center gap-3 mb-6">
      <button
        class="p-2 rounded-lg hover:bg-accent transition-colors"
        aria-label="대화 목록으로 돌아가기"
        @click="navigateTo('/ai-mentor')"
      >
        <Icon icon="heroicons:arrow-left" class="w-5 h-5 text-muted-foreground" />
      </button>
      <div class="flex-1 min-w-0">
        <h1 class="text-lg font-bold text-foreground truncate">
          {{ conversation?.title || 'AI 멘토 대화' }}
        </h1>
        <div v-if="conversation?.contextType" class="flex items-center gap-1 mt-0.5">
          <Icon icon="heroicons:link" class="w-3 h-3 text-violet-500" />
          <span class="text-xs text-violet-600 dark:text-violet-400">Task 참조 대화</span>
        </div>
      </div>
      <div class="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Icon icon="heroicons:bolt" class="w-4 h-4 text-amber-500" />
        {{ userCredit }}cr
      </div>
    </div>

    <!-- 로딩 -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <Icon icon="heroicons:arrow-path" class="w-8 h-8 text-muted-foreground animate-spin" />
    </div>

    <!-- 메시지 목록 -->
    <div v-else class="flex-1 space-y-4 mb-4 overflow-y-auto">
      <div
        v-for="msg in conversation?.messages"
        :key="msg.id"
        class="flex gap-3"
        :class="msg.role === 'USER' ? 'flex-row-reverse' : ''"
      >
        <div
          class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
          :class="msg.role === 'USER' ? 'bg-primary text-primary-foreground text-xs font-medium' : 'bg-violet-100 dark:bg-violet-900/30'"
        >
          <Icon v-if="msg.role === 'ASSISTANT'" icon="heroicons:sparkles" class="w-4 h-4 text-violet-600 dark:text-violet-400" />
          <span v-else>나</span>
        </div>
        <div
          class="max-w-[80%] rounded-xl px-4 py-3 text-sm"
          :class="msg.role === 'USER' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'"
        >
          <template v-if="msg.role === 'ASSISTANT'">
            <!-- 스트리밍 중: plain text + 커서 -->
            <p v-if="msg.isStreaming" class="whitespace-pre-wrap">{{ msg.content }}<span class="animate-pulse">▋</span></p>
            <!-- 완료: 마크다운 렌더링 -->
            <ClientOnly v-else>
              <MarkdownViewer :content="msg.content" class="prose prose-sm dark:prose-invert max-w-none" />
            </ClientOnly>
            <!-- 액션 버튼 영역 (DRE-207 복사, DRE-211 피드백) -->
            <div v-if="!msg.isStreaming" class="mt-2 flex items-center justify-between">
              <!-- 피드백 (좋아요/싫어요) -->
              <div class="flex items-center gap-1">
                <button
                  class="p-1 rounded transition-colors"
                  :class="msg.rating === 1 ? 'text-emerald-500' : 'text-muted-foreground hover:text-emerald-500'"
                  title="좋아요"
                  aria-label="좋아요"
                  @click="rateMessage(msg, 1)"
                >
                  <Icon icon="heroicons:hand-thumb-up" class="w-3.5 h-3.5" />
                </button>
                <button
                  class="p-1 rounded transition-colors"
                  :class="msg.rating === -1 ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'"
                  title="싫어요"
                  aria-label="싫어요"
                  @click="rateMessage(msg, -1)"
                >
                  <Icon icon="heroicons:hand-thumb-down" class="w-3.5 h-3.5" />
                </button>
              </div>
              <!-- 전체 복사 -->
              <button
                class="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                @click="copyMessage(msg.id, msg.content)"
              >
                <Icon
                  :icon="copiedMsgId === msg.id ? 'heroicons:check' : 'heroicons:clipboard'"
                  class="w-3.5 h-3.5"
                />
                {{ copiedMsgId === msg.id ? '복사됨' : '전체 복사' }}
              </button>
            </div>
          </template>
          <p v-else class="whitespace-pre-wrap">{{ msg.content }}</p>
        </div>
      </div>

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
          placeholder="추가 질문을 입력하세요..."
          rows="3"
          class="w-full px-4 py-3 text-sm bg-transparent resize-none focus:outline-none"
          @keydown="handleKeydown"
        />
        <div class="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/30 gap-2">
          <!-- tier 선택 (DRE-208: 첫 메시지 후 고정) -->
          <div
            class="flex items-center gap-1"
            :title="(conversation?.messages.length ?? 0) > 0 ? '품질은 대화 시작 시에만 변경 가능합니다' : ''"
          >
            <button
              v-for="tier in TIERS"
              :key="tier.value"
              class="px-2 py-1 text-xs rounded-md border transition-colors"
              :class="[
                selectedTier === tier.value
                  ? 'border-primary bg-primary/10 text-primary font-medium'
                  : 'border-border text-muted-foreground hover:border-primary/50',
                (tier.value > 1 && userPlan === 'FREE') || (conversation?.messages.length ?? 0) > 0
                  ? 'opacity-40 cursor-not-allowed'
                  : '',
              ]"
              :disabled="(tier.value > 1 && userPlan === 'FREE') || (conversation?.messages.length ?? 0) > 0"
              @click="(tier.value > 1 && userPlan === 'FREE') || (conversation?.messages.length ?? 0) > 0 ? null : selectedTier = tier.value"
            >
              {{ tier.label }} {{ tier.cost }}cr
              <Icon v-if="tier.value > 1 && userPlan === 'FREE'" icon="heroicons:lock-closed" class="w-2.5 h-2.5 inline ml-0.5" />
            </button>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <span class="text-xs text-muted-foreground hidden sm:inline">Enter 전송 · Shift+Enter 줄바꿈</span>
            <Button size="sm" :disabled="!inputContent.trim() || isSending" @click="sendMessage">
              <Icon v-if="isSending" icon="heroicons:arrow-path" class="w-4 h-4 mr-1.5 animate-spin" />
              <Icon v-else icon="heroicons:paper-airplane" class="w-4 h-4 mr-1.5" />
              전송
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
