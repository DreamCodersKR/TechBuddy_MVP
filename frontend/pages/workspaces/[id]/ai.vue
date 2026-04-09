<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'
import MarkdownViewer from '@/components/post/MarkdownViewer.client.vue'

definePageMeta({ layout: 'workspace', middleware: 'auth' })
useHead({ title: 'FLOWIT AI - FLOWIT' })

const route = useRoute()
const workspaceId = route.params.id as string
const authStore = useAuthStore()
const config = useRuntimeConfig()

const TASK_TYPES = [
  { value: 'CODE', label: '코드', icon: 'heroicons:code-bracket' },
  { value: 'DOCUMENT', label: '문서', icon: 'heroicons:document-text' },
  { value: 'DESIGN', label: '디자인', icon: 'heroicons:paint-brush' },
  { value: 'PLANNING', label: '기획', icon: 'heroicons:light-bulb' },
  { value: 'RESEARCH', label: '리서치', icon: 'heroicons:magnifying-glass' },
  { value: 'OTHER', label: '기타', icon: 'heroicons:ellipsis-horizontal-circle' },
]

const TIERS = [
  { value: 1, label: '일반', cost: 1, desc: '빠른 답변' },
  { value: 2, label: '심화', cost: 10, desc: '더 정확한 분석' },
  { value: 3, label: '전문가', cost: 50, desc: '최고 품질' },
]

interface ChatMessage {
  role: 'USER' | 'ASSISTANT'
  content: string
  modelUsed?: string
  isStreaming?: boolean
}

const selectedTaskType = ref('CODE')
const selectedTier = ref(1)
const inputContent = ref('')
const messages = ref<ChatMessage[]>([])
const conversationId = ref<string | null>(null)
const isSending = ref(false)
const hasStarted = ref(false)
const messagesEl = ref<HTMLDivElement | null>(null)

const userCredit = computed(() => authStore.currentUser?.credit ?? 0)
const userPlan = computed(() => authStore.currentUser?.plan ?? 'FREE')
const selectedTierData = computed(() => TIERS.find(t => t.value === selectedTier.value)!)

function scrollToBottom() {
  nextTick(() => {
    if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  })
}

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
  scrollToBottom()

  const streamingIdx = messages.value.length
  messages.value.push({ role: 'ASSISTANT', content: '', isStreaming: true })
  scrollToBottom()

  const endpoint = conversationId.value
    ? `${config.public.apiBaseUrl}/ai-mentor/conversations/${conversationId.value}/messages/stream`
    : `${config.public.apiBaseUrl}/ai-mentor/messages/stream`

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authStore.accessToken}`,
      },
      body: JSON.stringify({
        content: text,
        taskType: selectedTaskType.value,
        tier: selectedTier.value,
      }),
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

        if (data.type === 'start') conversationId.value = data.conversationId
        if (data.type === 'token') {
          messages.value[streamingIdx].content += data.text
          scrollToBottom()
        }
        if (data.type === 'done') {
          messages.value[streamingIdx].isStreaming = false
          messages.value[streamingIdx].modelUsed = data.model
          if (authStore.currentUser) authStore.currentUser.credit -= data.creditsUsed
        }
        if (data.type === 'error') throw new Error(data.message)
      }
    }
  }
  catch (e: unknown) {
    messages.value.splice(streamingIdx, 1)
    messages.value.pop()
    inputContent.value = text
    hasStarted.value = messages.value.length > 0
    alert((e as Error).message || '전송에 실패했습니다.')
  }
  finally { isSending.value = false }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendMessage()
}

function resetChat() {
  messages.value = []
  conversationId.value = null
  inputContent.value = ''
  hasStarted.value = false
  selectedTier.value = 1
  selectedTaskType.value = 'CODE'
}
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-120px)] max-w-3xl mx-auto">
    <!-- 헤더 -->
    <div class="flex items-center justify-between mb-4 flex-shrink-0">
      <div>
        <h2 class="text-xl font-bold text-foreground flex items-center gap-2">
          <Icon icon="heroicons:sparkles" class="w-5 h-5 text-violet-500" />
          FLOWIT AI
        </h2>
        <p class="text-xs text-muted-foreground mt-0.5">코드, 설계, 문서 등 다양한 질문을 AI에게 물어보세요</p>
      </div>
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-1 text-sm text-muted-foreground">
          <Icon icon="heroicons:bolt" class="w-4 h-4 text-amber-500" />
          {{ userCredit }}cr
        </div>
        <button
          v-if="hasStarted"
          class="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded-md hover:bg-accent transition-colors"
          @click="resetChat"
        >
          <Icon icon="heroicons:plus" class="w-3.5 h-3.5" />
          새 대화
        </button>
      </div>
    </div>

    <!-- 설정 (대화 시작 전) -->
    <div v-if="!hasStarted" class="mb-4 space-y-3 flex-shrink-0">
      <!-- 질문 유형 -->
      <div>
        <p class="text-xs font-medium text-muted-foreground mb-1.5">질문 유형</p>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="tt in TASK_TYPES"
            :key="tt.value"
            class="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors"
            :class="selectedTaskType === tt.value
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border text-muted-foreground hover:border-primary/50'"
            @click="selectedTaskType = tt.value"
          >
            <Icon :icon="tt.icon" class="w-3.5 h-3.5" />
            {{ tt.label }}
          </button>
        </div>
      </div>
      <!-- 답변 품질 -->
      <div>
        <p class="text-xs font-medium text-muted-foreground mb-1.5">답변 품질</p>
        <div class="flex gap-2">
          <button
            v-for="tier in TIERS"
            :key="tier.value"
            class="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-colors relative"
            :class="[
              selectedTier === tier.value
                ? 'border-primary bg-primary/10 text-primary font-medium'
                : 'border-border text-muted-foreground hover:border-primary/50',
              (tier.value > 1 && userPlan === 'FREE') ? 'opacity-50 cursor-not-allowed' : '',
            ]"
            :disabled="tier.value > 1 && userPlan === 'FREE'"
            @click="tier.value > 1 && userPlan === 'FREE' ? null : selectedTier = tier.value"
          >
            <Icon
              v-if="tier.value > 1 && userPlan === 'FREE'"
              icon="heroicons:lock-closed"
              class="w-3 h-3 absolute top-1 right-1 text-muted-foreground"
            />
            <span>{{ tier.label }}</span>
            <span
              class="text-xs px-1.5 py-0.5 rounded-full"
              :class="userCredit >= tier.cost ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-muted text-muted-foreground'"
            >
              {{ tier.cost }}cr
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- 메시지 목록 -->
    <div
      v-if="hasStarted"
      ref="messagesEl"
      class="flex-1 overflow-y-auto space-y-4 mb-4 pr-1"
    >
      <div
        v-for="(msg, i) in messages"
        :key="i"
        class="flex gap-3"
        :class="msg.role === 'USER' ? 'flex-row-reverse' : ''"
      >
        <div
          class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium"
          :class="msg.role === 'USER' ? 'bg-primary text-primary-foreground' : 'bg-violet-100 dark:bg-violet-900/30'"
        >
          <Icon v-if="msg.role === 'ASSISTANT'" icon="heroicons:sparkles" class="w-4 h-4 text-violet-600 dark:text-violet-400" />
          <span v-else>나</span>
        </div>
        <div
          class="max-w-[80%] rounded-xl px-4 py-3 text-sm"
          :class="msg.role === 'USER' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'"
        >
          <template v-if="msg.role === 'ASSISTANT'">
            <p v-if="msg.isStreaming" class="whitespace-pre-wrap">{{ msg.content }}<span class="animate-pulse">▋</span></p>
            <ClientOnly v-else>
              <MarkdownViewer :content="msg.content" class="prose prose-sm dark:prose-invert max-w-none" />
            </ClientOnly>
          </template>
          <p v-else class="whitespace-pre-wrap">{{ msg.content }}</p>
        </div>
      </div>
    </div>

    <!-- 빈 상태 (대화 전) -->
    <div v-else class="flex-1 flex flex-col items-center justify-center text-center">
      <div class="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-3">
        <Icon icon="heroicons:sparkles" class="w-7 h-7 text-violet-500" />
      </div>
      <p class="text-sm font-medium text-foreground mb-1">무엇이든 물어보세요</p>
      <p class="text-xs text-muted-foreground">Cmd+Enter로 전송</p>
    </div>

    <!-- 입력창 -->
    <div class="mt-auto flex-shrink-0">
      <div class="border border-border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-ring bg-background">
        <textarea
          v-model="inputContent"
          :placeholder="hasStarted ? '추가 질문을 입력하세요...' : '막히는 부분을 자세히 설명해주세요...'"
          rows="3"
          class="w-full px-4 py-3 text-sm bg-transparent resize-none focus:outline-none"
          :disabled="isSending"
          @keydown="handleKeydown"
        />
        <div class="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/30">
          <span class="text-xs text-muted-foreground">
            Cmd+Enter 전송 · 소요: <span class="font-medium text-foreground">{{ selectedTierData.cost }}cr</span>
          </span>
          <Button size="sm" :disabled="!inputContent.trim() || isSending" @click="sendMessage">
            <Icon v-if="isSending" icon="heroicons:arrow-path" class="w-4 h-4 mr-1.5 animate-spin" />
            <Icon v-else icon="heroicons:paper-airplane" class="w-4 h-4 mr-1.5" />
            전송
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
