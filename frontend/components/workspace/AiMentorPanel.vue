<script setup lang="ts">
import { Icon } from '@iconify/vue'
import MarkdownViewer from '@/components/post/MarkdownViewer.client.vue'
import { toast } from 'vue-sonner'

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  tags: string[]
}

const props = defineProps<{ task: Task }>()
const emit = defineEmits<{ close: [] }>()

const authStore = useAuthStore()
const config = useRuntimeConfig()

// ─── 타입/상수 ─────────────────────────────────────────────
const TASK_TYPES = [
  { value: 'CODE', label: '코드' },
  { value: 'DOCUMENT', label: '문서' },
  { value: 'DESIGN', label: '디자인' },
  { value: 'PLANNING', label: '기획' },
  { value: 'RESEARCH', label: '리서치' },
  { value: 'OTHER', label: '기타' },
]

const TIERS = [
  { value: 1, label: '일반', cost: 1 },
  { value: 2, label: '심화', cost: 10 },
  { value: 3, label: '전문가', cost: 50 },
]

interface ChatMessage {
  role: 'USER' | 'ASSISTANT'
  content: string
  modelUsed?: string
  isStreaming?: boolean
}

// ─── 상태 ─────────────────────────────────────────────────
const selectedTaskType = ref('CODE')
const selectedTier = ref(1)
const inputContent = ref('')
const messages = ref<ChatMessage[]>([])
const conversationId = ref<string | null>(null)
const isSending = ref(false)
const messagesEl = ref<HTMLDivElement | null>(null)

const userCredit = computed(() => (authStore.currentUser as any)?.credit ?? 0)
const selectedTierData = computed(() => TIERS.find(t => t.value === selectedTier.value)!)
const userPlan = computed(() => (authStore.currentUser as any)?.plan ?? 'FREE')

// Task 변경 시 대화 초기화
watch(() => props.task.id, () => {
  messages.value = []
  conversationId.value = null
  inputContent.value = ''
}, { immediate: false })

function scrollToBottom() {
  nextTick(() => {
    if (messagesEl.value) {
      messagesEl.value.scrollTop = messagesEl.value.scrollHeight
    }
  })
}

async function sendMessage() {
  const text = inputContent.value.trim()
  if (!text || isSending.value) return

  const cost = selectedTierData.value.cost
  if (userCredit.value < cost) {
    toast.error(`크레딧이 부족합니다. 필요: ${cost}cr, 보유: ${userCredit.value}cr`)
    return
  }

  isSending.value = true
  messages.value.push({ role: 'USER', content: text })
  inputContent.value = ''
  scrollToBottom()

  const streamingIdx = messages.value.length
  messages.value.push({ role: 'ASSISTANT', content: '', isStreaming: true })
  scrollToBottom()

  const endpoint = conversationId.value
    ? `${config.public.apiBaseUrl}/ai-mentor/conversations/${conversationId.value}/messages/stream`
    : `${config.public.apiBaseUrl}/ai-mentor/messages/stream`

  const body: Record<string, unknown> = {
    content: text,
    taskType: selectedTaskType.value,
    tier: selectedTier.value,
    taskId: props.task.id,
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authStore.accessToken}`,
      },
      body: JSON.stringify(body),
    })

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

        if (data.type === 'start') {
          conversationId.value = data.conversationId
        }
        if (data.type === 'token') {
          messages.value[streamingIdx].content += data.text
          scrollToBottom()
        }
        if (data.type === 'done') {
          messages.value[streamingIdx].isStreaming = false
          messages.value[streamingIdx].modelUsed = data.model
          if (authStore.currentUser) {
            ;(authStore.currentUser as any).credit -= data.creditsUsed
          }
        }
        if (data.type === 'error') {
          throw new Error(data.message)
        }
      }
    }
  }
  catch (e: unknown) {
    messages.value.splice(streamingIdx, 1)
    messages.value.pop()
    inputContent.value = text
    toast.error((e as Error).message || '전송에 실패했습니다.')
  }
  finally { isSending.value = false }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendMessage()
}

function prefillContext() {
  const ctx = [props.task.title]
  if (props.task.description) ctx.push(props.task.description)
  inputContent.value = ctx.join('\n\n') + '\n\n어떤 부분에서 도움이 필요한지 알려주세요.'
}
</script>

<template>
  <div class="flex flex-col h-full border-l border-border bg-card">
    <!-- 헤더 -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
      <div class="flex items-center gap-2">
        <Icon icon="heroicons:sparkles" class="w-4 h-4 text-primary" />
        <span class="text-sm font-semibold text-foreground">AI 멘토</span>
        <span class="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
          {{ userCredit }}cr
        </span>
      </div>
      <button
        class="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-accent"
        @click="emit('close')"
      >
        <Icon icon="heroicons:x-mark" class="w-4 h-4" />
      </button>
    </div>

    <!-- 설정 바 -->
    <div class="flex items-center gap-2 px-4 py-2 border-b border-border flex-shrink-0 flex-wrap">
      <select
        v-model="selectedTaskType"
        class="h-7 px-2 text-xs border border-border rounded bg-background focus:outline-none"
      >
        <option v-for="t in TASK_TYPES" :key="t.value" :value="t.value">
          {{ t.label }}
        </option>
      </select>
      <div class="flex gap-1">
        <button
          v-for="tier in TIERS"
          :key="tier.value"
          class="h-7 px-2.5 text-xs rounded border transition-colors"
          :class="[
            selectedTier === tier.value
              ? 'bg-primary text-primary-foreground border-primary'
              : 'border-border text-muted-foreground hover:bg-accent',
            (tier.value > 1 && userPlan === 'FREE') ? 'opacity-40 cursor-not-allowed' : '',
          ]"
          :disabled="tier.value > 1 && userPlan === 'FREE'"
          @click="selectedTier = tier.value"
        >
          {{ tier.label }} {{ tier.cost }}cr
        </button>
      </div>
    </div>

    <!-- 태스크 컨텍스트 -->
    <div class="px-4 py-2 border-b border-border flex-shrink-0 bg-muted/30">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <p class="text-xs font-medium text-foreground truncate">{{ task.title }}</p>
          <p v-if="task.description" class="text-xs text-muted-foreground line-clamp-1 mt-0.5">
            {{ task.description.replace(/[#*`]/g, '').slice(0, 60) }}...
          </p>
        </div>
        <button
          class="flex-shrink-0 text-xs text-primary hover:underline"
          @click="prefillContext"
        >
          컨텍스트 불러오기
        </button>
      </div>
    </div>

    <!-- 메시지 목록 -->
    <div ref="messagesEl" class="flex-1 overflow-y-auto p-4 space-y-4">
      <div v-if="messages.length === 0" class="flex flex-col items-center justify-center h-full text-center">
        <Icon icon="heroicons:sparkles" class="w-8 h-8 text-muted-foreground mb-2 opacity-50" />
        <p class="text-sm text-muted-foreground">태스크에 대해 AI 멘토에게 질문하세요</p>
        <p class="text-xs text-muted-foreground mt-1 opacity-60">Ctrl+Enter로 전송</p>
      </div>

      <div
        v-for="(msg, i) in messages"
        :key="i"
        class="flex gap-2.5"
        :class="msg.role === 'USER' ? 'justify-end' : 'justify-start'"
      >
        <!-- AI 아바타 -->
        <div v-if="msg.role === 'ASSISTANT'" class="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon icon="heroicons:sparkles" class="w-3.5 h-3.5 text-primary" />
        </div>

        <!-- 메시지 버블 -->
        <div
          class="max-w-[85%] rounded-lg px-3 py-2 text-xs"
          :class="msg.role === 'USER'
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground'"
        >
          <div v-if="msg.role === 'ASSISTANT' && msg.content">
            <ClientOnly>
              <MarkdownViewer :content="msg.content" />
            </ClientOnly>
            <div v-if="msg.isStreaming" class="flex items-center gap-1 mt-1 opacity-60">
              <span class="w-1 h-1 bg-current rounded-full animate-bounce" style="animation-delay:0ms" />
              <span class="w-1 h-1 bg-current rounded-full animate-bounce" style="animation-delay:150ms" />
              <span class="w-1 h-1 bg-current rounded-full animate-bounce" style="animation-delay:300ms" />
            </div>
          </div>
          <div v-else-if="msg.role === 'ASSISTANT' && !msg.content && msg.isStreaming" class="flex items-center gap-1 opacity-60">
            <span class="w-1 h-1 bg-current rounded-full animate-bounce" style="animation-delay:0ms" />
            <span class="w-1 h-1 bg-current rounded-full animate-bounce" style="animation-delay:150ms" />
            <span class="w-1 h-1 bg-current rounded-full animate-bounce" style="animation-delay:300ms" />
          </div>
          <p v-else-if="msg.role === 'USER'" class="whitespace-pre-wrap">{{ msg.content }}</p>
          <p v-if="msg.modelUsed && !msg.isStreaming && msg.role === 'ASSISTANT'" class="text-xs opacity-40 mt-1">
            {{ msg.modelUsed }}
          </p>
        </div>
      </div>
    </div>

    <!-- 입력창 -->
    <div class="flex-shrink-0 p-3 border-t border-border">
      <div class="relative">
        <textarea
          v-model="inputContent"
          placeholder="태스크에 대해 질문하세요... (Ctrl+Enter로 전송)"
          rows="3"
          class="w-full px-3 py-2 pr-10 text-xs border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          :disabled="isSending"
          @keydown="handleKeydown"
        />
        <button
          :disabled="!inputContent.trim() || isSending"
          class="absolute right-2 bottom-2 p-1.5 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          @click="sendMessage"
        >
          <Icon v-if="isSending" icon="heroicons:arrow-path" class="w-3.5 h-3.5 animate-spin" />
          <Icon v-else icon="heroicons:paper-airplane" class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  </div>
</template>
