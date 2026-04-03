<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'

definePageMeta({ layout: 'workspace', middleware: 'auth' })
useHead({ title: '태스크 목록 - FLOWIT' })

const route = useRoute()
const workspaceId = route.params.id as string
const { get: authGet, patch: authPatch, delete: authDelete } = useAuthFetch()

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'HELP' | 'DONE'
type TaskPriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'

interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  dueDate: string | null
  assignee: { id: string, name: string, nickname: string | null, avatarUrl: string | null } | null
  createdBy: { id: string, name: string, nickname: string | null }
  sprint: { id: string, name: string } | null
}

const STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: '할 일',
  IN_PROGRESS: '진행 중',
  REVIEW: '리뷰',
  HELP: '도움 필요',
  DONE: '완료',
}

const STATUS_COLOR: Record<TaskStatus, string> = {
  TODO: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  REVIEW: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  HELP: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  DONE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}

const PRIORITY_LABEL: Record<TaskPriority, string> = { URGENT: '긴급', HIGH: '높음', MEDIUM: '보통', LOW: '낮음' }
const PRIORITY_COLOR: Record<TaskPriority, string> = {
  URGENT: 'text-red-500',
  HIGH: 'text-orange-500',
  MEDIUM: 'text-blue-500',
  LOW: 'text-slate-400',
}

// ─── 상태 ────────────────────────────────────────────────
const tasks = ref<Task[]>([])
const loading = ref(true)
const filterStatus = ref<TaskStatus | ''>('')
const searchQuery = ref('')

async function loadTasks() {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (filterStatus.value) params.set('status', filterStatus.value)
    tasks.value = await authGet<Task[]>(`/workspaces/${workspaceId}/tasks?${params}`)
  }
  catch { tasks.value = [] }
  finally { loading.value = false }
}

watch(filterStatus, () => loadTasks())

const filtered = computed(() => {
  if (!searchQuery.value.trim()) return tasks.value
  const q = searchQuery.value.toLowerCase()
  return tasks.value.filter(t =>
    t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q),
  )
})

// ─── HELP 액션 모달 ──────────────────────────────────────
const helpModalTask = ref<Task | null>(null)

// ─── 인라인 상태 변경 ────────────────────────────────────
async function changeStatus(task: Task, status: TaskStatus) {
  const prev = task.status
  task.status = status
  try {
    await authPatch(`/workspaces/${workspaceId}/tasks/${task.id}`, { status })
    if (status === 'HELP') helpModalTask.value = task
  }
  catch { task.status = prev }
}

// ─── 삭제 ────────────────────────────────────────────────
async function handleDelete(task: Task) {
  if (!confirm(`'${task.title}' 태스크를 삭제하시겠습니까?`)) return
  try {
    await authDelete(`/workspaces/${workspaceId}/tasks/${task.id}`)
    tasks.value = tasks.value.filter(t => t.id !== task.id)
  }
  catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    alert(err?.data?.message || '삭제에 실패했습니다.')
  }
}

onMounted(() => { loadTasks() })
</script>

<template>
  <div>
    <!-- 헤더 -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-bold text-foreground">
          태스크 목록
        </h2>
        <p class="text-sm text-muted-foreground mt-0.5">
          {{ filtered.length }}개의 태스크
        </p>
      </div>
      <Button @click="navigateTo(`/workspaces/${workspaceId}`)">
        <Icon
          icon="heroicons:view-columns"
          class="w-4 h-4 mr-2"
        />
        칸반 보기
      </Button>
    </div>

    <!-- 필터 -->
    <div class="flex items-center gap-3 mb-4 flex-wrap">
      <input
        v-model="searchQuery"
        placeholder="태스크 검색..."
        class="h-9 px-3 text-sm border border-border rounded-md bg-background w-48 focus:outline-none focus:ring-2 focus:ring-ring"
      >
      <div class="flex gap-1">
        <button
          v-for="(label, status) in { '': '전체', ...STATUS_LABEL }"
          :key="status"
          class="px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors"
          :class="filterStatus === status ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'"
          @click="filterStatus = status as TaskStatus | ''"
        >
          {{ label }}
        </button>
      </div>
    </div>

    <!-- 로딩 -->
    <div
      v-if="loading"
      class="space-y-2"
    >
      <div
        v-for="n in 5"
        :key="n"
        class="border border-border rounded-lg p-3 flex items-center gap-3"
      >
        <div class="h-4 w-4 bg-muted animate-pulse rounded" />
        <div class="flex-1 h-4 bg-muted animate-pulse rounded w-1/3" />
        <div class="h-5 w-16 bg-muted animate-pulse rounded-full" />
      </div>
    </div>

    <!-- 테이블 형태 목록 -->
    <div
      v-else-if="filtered.length > 0"
      class="border border-border rounded-xl overflow-hidden"
    >
      <table class="w-full">
        <thead>
          <tr class="border-b border-border bg-muted/30">
            <th class="text-xs text-muted-foreground font-medium text-left px-4 py-2.5 w-1/2">
              제목
            </th>
            <th class="text-xs text-muted-foreground font-medium text-left px-3 py-2.5">
              상태
            </th>
            <th class="text-xs text-muted-foreground font-medium text-left px-3 py-2.5">
              우선순위
            </th>
            <th class="text-xs text-muted-foreground font-medium text-left px-3 py-2.5">
              담당자
            </th>
            <th class="text-xs text-muted-foreground font-medium text-left px-3 py-2.5">
              마감일
            </th>
            <th class="w-8" />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="task in filtered"
            :key="task.id"
            class="border-b border-border last:border-0 hover:bg-accent/20 transition-colors"
            :class="task.status === 'HELP' ? 'bg-red-50/30 dark:bg-red-900/5' : ''"
          >
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <Icon
                  icon="heroicons:flag"
                  class="w-3.5 h-3.5 flex-shrink-0"
                  :class="PRIORITY_COLOR[task.priority]"
                />
                <span class="text-sm font-medium text-foreground line-clamp-1">{{ task.title }}</span>
              </div>
              <p
                v-if="task.sprint"
                class="text-xs text-muted-foreground mt-0.5 ml-5"
              >
                {{ task.sprint.name }}
              </p>
            </td>
            <td class="px-3 py-3">
              <select
                :value="task.status"
                class="text-xs border-0 bg-transparent focus:outline-none cursor-pointer"
                @change="changeStatus(task, ($event.target as HTMLSelectElement).value as TaskStatus)"
              >
                <option
                  v-for="(label, s) in STATUS_LABEL"
                  :key="s"
                  :value="s"
                >
                  {{ label }}
                </option>
              </select>
              <span
                class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ml-1"
                :class="STATUS_COLOR[task.status]"
              >
                {{ STATUS_LABEL[task.status] }}
              </span>
            </td>
            <td class="px-3 py-3">
              <span
                class="text-xs font-medium"
                :class="PRIORITY_COLOR[task.priority]"
              >
                {{ PRIORITY_LABEL[task.priority] }}
              </span>
            </td>
            <td class="px-3 py-3">
              <div
                v-if="task.assignee"
                class="flex items-center gap-1.5"
              >
                <div class="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs overflow-hidden">
                  <img
                    v-if="task.assignee.avatarUrl"
                    :src="task.assignee.avatarUrl"
                    class="h-full w-full object-cover"
                  >
                  <span v-else>{{ (task.assignee.nickname ?? task.assignee.name).slice(0, 1) }}</span>
                </div>
                <span class="text-xs text-muted-foreground">{{ task.assignee.nickname ?? task.assignee.name }}</span>
              </div>
              <span
                v-else
                class="text-xs text-muted-foreground"
              >미배정</span>
            </td>
            <td class="px-3 py-3">
              <span
                v-if="task.dueDate"
                class="text-xs text-muted-foreground"
              >
                {{ useRelativeTime(task.dueDate) }}
              </span>
              <span
                v-else
                class="text-xs text-muted-foreground"
              >-</span>
            </td>
            <td class="px-2 py-3">
              <button
                class="p-1 text-muted-foreground hover:text-destructive transition-colors"
                @click="handleDelete(task)"
              >
                <Icon
                  icon="heroicons:trash"
                  class="w-3.5 h-3.5"
                />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 빈 상태 -->
    <div
      v-else
      class="flex flex-col items-center justify-center py-20 text-center border border-border rounded-xl"
    >
      <Icon
        icon="heroicons:clipboard-document-list"
        class="w-10 h-10 text-muted-foreground mb-3"
      />
      <p class="text-sm font-medium text-foreground">
        태스크가 없습니다
      </p>
      <p class="text-xs text-muted-foreground mt-1 mb-4">
        칸반 보드에서 태스크를 추가해보세요
      </p>
      <Button
        variant="outline"
        size="sm"
        @click="navigateTo(`/workspaces/${workspaceId}`)"
      >
        <Icon
          icon="heroicons:view-columns"
          class="w-4 h-4 mr-1"
        />
        칸반 보기
      </Button>
    </div>

    <!-- HELP 액션 모달 -->
    <WorkspaceHelpActionModal
      v-if="helpModalTask"
      :task="helpModalTask"
      @close="helpModalTask = null"
    />
  </div>
</template>
