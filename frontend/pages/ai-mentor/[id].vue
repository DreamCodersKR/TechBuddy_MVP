<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'
import MarkdownViewer from '@/components/post/MarkdownViewer.client.vue'

definePageMeta({ layout: 'default', middleware: 'auth' })
useHead({ title: 'AI 멘토 대화 - FLOWIT' })

const route = useRoute()
const conversationId = route.params.id as string
const authStore = useAuthStore()
const { get: authGet, post: authPost } = useAuthFetch()

interface Message {
  id: string
  role: 'USER' | 'ASSISTANT'
  content: string
  modelUsed: string
  taskType: string
  creditsUsed: number
  createdAt: string
}

interface Conversation {
  id: string
  title: string
  messages: Message[]
}

const conversation = ref<Conversation | null>(null)
const loading = ref(true)
const inputContent = ref('')
const isSending = ref(false)

const userCredit = computed(() => authStore.currentUser?.credit ?? 0)

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

  // 낙관적 업데이트
  conversation.value.messages.push({
    id: 'temp',
    role: 'USER',
    content: text,
    modelUsed: '',
    taskType: 'CODE',
    creditsUsed: 0,
    createdAt: new Date().toISOString(),
  })

  try {
    const res = await authPost<{ conversationId: string, model: string, creditsUsed: number }>(
      `/ai-mentor/conversations/${conversationId}/messages`,
      { content: text, taskType: 'CODE', tier: 1 },
    )
    // 최신 대화 재로드
    await loadConversation()
    if (authStore.currentUser) {
      authStore.currentUser.credit -= res.creditsUsed
    }
  }
  catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    conversation.value.messages.pop()
    inputContent.value = text
    alert(err?.data?.message || '전송에 실패했습니다.')
  }
  finally { isSending.value = false }
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
        @click="navigateTo('/ai-mentor')"
      >
        <Icon icon="heroicons:arrow-left" class="w-5 h-5 text-muted-foreground" />
      </button>
      <h1 class="text-lg font-bold text-foreground truncate flex-1">
        {{ conversation?.title || 'AI 멘토 대화' }}
      </h1>
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
          <ClientOnly>
            <MarkdownViewer v-if="msg.role === 'ASSISTANT'" :content="msg.content" class="prose prose-sm dark:prose-invert max-w-none" />
            <p v-else class="whitespace-pre-wrap">{{ msg.content }}</p>
          </ClientOnly>
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
        <div class="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/30">
          <span class="text-xs text-muted-foreground">Enter 전송 · Shift+Enter 줄바꿈</span>
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
