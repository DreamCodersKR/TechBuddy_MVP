<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'
import MarkdownViewer from '@/components/post/MarkdownViewer.client.vue'

definePageMeta({ layout: 'default', middleware: 'auth' })
useHead({ title: 'FLOWIT AI - FLOWIT' })

const route = useRoute()
const authStore = useAuthStore()
const config = useRuntimeConfig()

// ─── query param pre-fill ─────────────────────────────────
const taskId = route.query.taskId as string | undefined
const prefillTitle = route.query.title as string | undefined
const prefillDesc = route.query.description as string | undefined
const prefillTaskType = (route.query.taskType as string | undefined) || 'CODE'
const prefillDirect = route.query.prefill as string | undefined // from ai-mentor index quick-start
const workspaceId = route.query.workspaceId as string | undefined

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
  { value: 1, label: '일반', cost: 1, desc: '빠른 답변' },
  { value: 2, label: '심화', cost: 10, desc: '더 정확한 분석' },
  { value: 3, label: '전문가', cost: 50, desc: '최고 품질 답변' },
]

// ─── 폼 상태 ─────────────────────────────────────────────
const selectedTaskType = ref(prefillTaskType)
const selectedTier = ref(1)
const content = ref(
  prefillDirect
    ? prefillDirect
    : prefillTitle
      ? `${prefillTitle}${prefillDesc ? `\n\n${prefillDesc}` : ''}\n\n어떤 부분에서 막히셨나요?`
      : '',
)

interface ChatMessage {
  role: 'USER' | 'ASSISTANT'
  content: string
  modelUsed?: string
  isStreaming?: boolean
}

const isSending = ref(false)
const messages = ref<ChatMessage[]>([])
const conversationId = ref<string | null>(null)
const inputContent = ref(content.value)
const hasStarted = ref(false)

const userCredit = computed(() => authStore.currentUser?.credit ?? 0)
const selectedTierData = computed(() => TIERS.find(t => t.value === selectedTier.value)!)

const userPlan = computed(() => authStore.currentUser?.plan ?? 'FREE')

// ─── Task 컨텍스트 선택 ───────────────────────────────────
const { get: authGet } = useAuthFetch()

interface WorkspaceTask {
  id: string
  title: string
  status: string
  issueNumber: number | null
}

const workspaceTasks = ref<WorkspaceTask[]>([])
const selectedContext = ref<{ type: string; id: string; label: string } | null>(null)
const showTaskPicker = ref(false)
const taskSearch = ref('')

const filteredTasks = computed(() => {
  if (!taskSearch.value.trim()) return workspaceTasks.value
  const q = taskSearch.value.toLowerCase()
  return workspaceTasks.value.filter(t =>
    t.title.toLowerCase().includes(q) || String(t.issueNumber).includes(q),
  )
})

async function loadWorkspaceTasks() {
  if (!workspaceId) return
  try {
    workspaceTasks.value = await authGet<WorkspaceTask[]>(`/workspaces/${workspaceId}/tasks`)
  }
  catch { workspaceTasks.value = [] }
}

function selectTask(task: WorkspaceTask) {
  selectedContext.value = {
    type: 'TASK',
    id: task.id,
    label: `#${task.issueNumber ?? ''} ${task.title}`,
  }
  showTaskPicker.value = false
  taskSearch.value = ''
}

function clearContext() {
  selectedContext.value = null
}

onMounted(() => { loadWorkspaceTasks() })

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

  // 스트리밍 AI 메시지 placeholder
  const streamingIdx = messages.value.length
  messages.value.push({ role: 'ASSISTANT', content: '', isStreaming: true })

  const endpoint = conversationId.value
    ? `${config.public.apiBaseUrl}/ai-mentor/conversations/${conversationId.value}/messages/stream`
    : `${config.public.apiBaseUrl}/ai-mentor/messages/stream`

  const body: Record<string, unknown> = {
    content: text,
    taskType: selectedTaskType.value,
    tier: selectedTier.value,
  }
  if (taskId) body.taskId = taskId
  if (selectedContext.value) {
    body.contextType = selectedContext.value.type
    body.contextId = selectedContext.value.id
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
        }
        if (data.type === 'done') {
          messages.value[streamingIdx].isStreaming = false
          messages.value[streamingIdx].modelUsed = data.model
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
    messages.value.splice(streamingIdx, 1) // 스트리밍 메시지 제거
    messages.value.pop() // USER 메시지 제거
    inputContent.value = text
    hasStarted.value = messages.value.length > 0
    alert((e as Error).message || '전송에 실패했습니다.')
  }
  finally { isSending.value = false }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendMessage()
}

// Task picker 외부 클릭 닫기
function handleOutsideTaskPicker(e: MouseEvent) {
  if (showTaskPicker.value) {
    const target = e.target as HTMLElement
    if (!target.closest('[data-task-picker]')) showTaskPicker.value = false
  }
}
onMounted(() => { document.addEventListener('click', handleOutsideTaskPicker) })
onUnmounted(() => { document.removeEventListener('click', handleOutsideTaskPicker) })
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
          FLOWIT AI
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
            class="flex flex-col items-center p-3 rounded-lg border transition-colors relative"
            :class="[
              selectedTier === tier.value
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50',
              ((tier.value > 1 && userPlan === 'FREE') || (tier.value > 2 && userPlan === 'PRO')) ? 'opacity-50 cursor-not-allowed' : '',
            ]"
            :disabled="(tier.value > 1 && userPlan === 'FREE') || (tier.value > 2 && userPlan === 'PRO')"
            @click="((tier.value > 1 && userPlan === 'FREE') || (tier.value > 2 && userPlan === 'PRO')) ? null : selectedTier = tier.value"
          >
            <Icon
              v-if="(tier.value > 1 && userPlan === 'FREE') || (tier.value > 2 && userPlan === 'PRO')"
              icon="heroicons:lock-closed"
              class="w-3 h-3 absolute top-2 right-2 text-muted-foreground"
            />
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
          <template v-if="msg.role === 'ASSISTANT'">
            <!-- 스트리밍 중: plain text + 커서 -->
            <p v-if="msg.isStreaming" class="whitespace-pre-wrap">{{ msg.content }}<span class="animate-pulse">▋</span></p>
            <!-- 완료: 마크다운 렌더링 -->
            <ClientOnly v-else>
              <MarkdownViewer :content="msg.content" class="prose prose-sm dark:prose-invert max-w-none" />
            </ClientOnly>
            <p v-if="msg.modelUsed && !msg.isStreaming" class="text-xs opacity-60 mt-1">
              {{ msg.modelUsed }}
            </p>
          </template>
          <p v-else class="whitespace-pre-wrap">{{ msg.content }}</p>
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
      <!-- 컨텍스트 뱃지 -->
      <div v-if="selectedContext" class="mb-2 flex items-center gap-2">
        <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 text-sm">
          <Icon icon="heroicons:link" class="w-3.5 h-3.5 text-violet-500" />
          <span class="text-violet-700 dark:text-violet-300 truncate max-w-[300px]">{{ selectedContext.label }}</span>
          <button class="ml-1 text-violet-400 hover:text-violet-600" @click="clearContext">
            <Icon icon="heroicons:x-mark" class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div class="border border-border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-ring bg-background">
        <textarea
          v-model="inputContent"
          :placeholder="hasStarted ? '추가 질문을 입력하세요...' : '막히는 부분을 자세히 설명해주세요...'"
          rows="4"
          class="w-full px-4 py-3 text-sm bg-transparent resize-none focus:outline-none"
          @keydown="handleKeydown"
        />
        <div class="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/30">
          <div class="flex items-center gap-3">
            <!-- Task 연결 버튼 (워크스페이스 context가 있을 때만) -->
            <div v-if="workspaceId && !hasStarted" class="relative" data-task-picker>
              <button
                class="flex items-center gap-1 text-xs text-muted-foreground hover:text-violet-600 transition-colors"
                @click.stop="showTaskPicker = !showTaskPicker"
              >
                <Icon icon="heroicons:link" class="w-3.5 h-3.5" />
                Task 연결
              </button>
              <!-- Task 선택 드롭다운 -->
              <div
                v-if="showTaskPicker"
                class="absolute bottom-full left-0 mb-2 w-72 bg-popover border border-border rounded-xl shadow-lg z-50 overflow-hidden"
              >
                <div class="p-2 border-b border-border">
                  <input
                    v-model="taskSearch"
                    type="text"
                    placeholder="Task 검색..."
                    class="w-full px-3 py-1.5 text-xs bg-muted rounded-lg border-0 outline-none focus:ring-1 focus:ring-ring"
                  >
                </div>
                <div class="max-h-48 overflow-y-auto">
                  <button
                    v-for="task in filteredTasks"
                    :key="task.id"
                    class="w-full flex items-center gap-2 px-3 py-2 text-left text-xs hover:bg-accent transition-colors"
                    @click="selectTask(task)"
                  >
                    <span
                      class="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium"
                      :class="{
                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400': task.status === 'TODO',
                        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400': task.status === 'IN_PROGRESS',
                        'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400': task.status === 'REVIEW',
                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400': task.status === 'HELP',
                        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400': task.status === 'DONE',
                      }"
                    >{{ task.status }}</span>
                    <span class="truncate text-foreground">#{{ task.issueNumber }} {{ task.title }}</span>
                  </button>
                  <p v-if="filteredTasks.length === 0" class="px-3 py-4 text-xs text-muted-foreground text-center">
                    Task가 없습니다
                  </p>
                </div>
              </div>
            </div>
            <span class="text-xs text-muted-foreground">
              Cmd+Enter로 전송 · 소요 크레딧: <span class="font-medium text-foreground">{{ selectedTierData.cost }}cr</span>
            </span>
          </div>
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
