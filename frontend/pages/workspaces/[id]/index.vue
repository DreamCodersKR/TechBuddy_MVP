<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'

definePageMeta({ layout: 'workspace', middleware: 'auth' })
useHead({ title: '칸반 보드 - FLOWIT' })

const route = useRoute()
const workspaceId = route.params.id as string
const { get: authGet, post: authPost, patch: authPatch } = useAuthFetch()

// ─── 타입 ────────────────────────────────────────────────
type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'HELP' | 'DONE'
type TaskPriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'

interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  dueDate: string | null
  helpReason: string | null
  assignee: { id: string, name: string, nickname: string | null, avatarUrl: string | null } | null
  createdBy: { id: string, name: string, nickname: string | null }
  sprint: { id: string, name: string } | null
}

interface Member {
  role: string
  user: { id: string, name: string, nickname: string | null, avatarUrl: string | null }
}

// ─── 상태 ────────────────────────────────────────────────
const tasks = ref<Task[]>([])
const members = ref<Member[]>([])
const loading = ref(true)

const COLUMNS: { status: TaskStatus, label: string, color: string }[] = [
  { status: 'TODO', label: '할 일', color: 'border-t-slate-400' },
  { status: 'IN_PROGRESS', label: '진행 중', color: 'border-t-blue-500' },
  { status: 'REVIEW', label: '리뷰', color: 'border-t-yellow-500' },
  { status: 'HELP', label: '🆘 도움 필요', color: 'border-t-red-500' },
  { status: 'DONE', label: '완료', color: 'border-t-green-500' },
]

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  URGENT: 'text-red-500',
  HIGH: 'text-orange-500',
  MEDIUM: 'text-blue-500',
  LOW: 'text-slate-400',
}

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  URGENT: '긴급',
  HIGH: '높음',
  MEDIUM: '보통',
  LOW: '낮음',
}

function columnTasks(status: TaskStatus) {
  return tasks.value.filter(t => t.status === status)
}

// ─── 데이터 로드 ─────────────────────────────────────────
async function loadData() {
  loading.value = true
  try {
    const [taskRes, memberRes] = await Promise.all([
      authGet<Task[]>(`/workspaces/${workspaceId}/tasks`),
      authGet<Member[]>(`/workspaces/${workspaceId}/members`),
    ])
    tasks.value = taskRes
    members.value = memberRes
  }
  catch { tasks.value = [] }
  finally { loading.value = false }
}

// ─── 태스크 생성 모달 ────────────────────────────────────
const showCreateModal = ref(false)
const createStatus = ref<TaskStatus>('TODO')
const createForm = reactive({
  title: '',
  description: '',
  priority: 'MEDIUM' as TaskPriority,
  assigneeId: '',
  dueDate: '',
})
const isCreating = ref(false)

function openCreateModal(status: TaskStatus = 'TODO') {
  createStatus.value = status
  createForm.title = ''
  createForm.description = ''
  createForm.priority = 'MEDIUM'
  createForm.assigneeId = ''
  createForm.dueDate = ''
  showCreateModal.value = true
}

async function handleCreate() {
  if (!createForm.title.trim()) return
  isCreating.value = true
  try {
    const body: Record<string, unknown> = {
      title: createForm.title.trim(),
      status: createStatus.value,
      priority: createForm.priority,
    }
    if (createForm.description.trim()) body.description = createForm.description.trim()
    if (createForm.assigneeId) body.assigneeId = createForm.assigneeId
    if (createForm.dueDate) body.dueDate = createForm.dueDate

    const created = await authPost<Task>(`/workspaces/${workspaceId}/tasks`, body)
    tasks.value.push(created)
    showCreateModal.value = false
  }
  catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    alert(err?.data?.message || '태스크 생성에 실패했습니다.')
  }
  finally { isCreating.value = false }
}

// ─── HELP 액션 모달 ──────────────────────────────────────
const helpModalTask = ref<Task | null>(null)

// ─── 태스크 상태 변경 ────────────────────────────────────
async function moveTask(task: Task, newStatus: TaskStatus) {
  const prev = task.status
  task.status = newStatus
  try {
    await authPatch(`/workspaces/${workspaceId}/tasks/${task.id}`, { status: newStatus })
    if (newStatus === 'HELP') helpModalTask.value = task
  }
  catch { task.status = prev }
}

// ─── 태스크 상세 모달 ────────────────────────────────────
const selectedTask = ref<Task | null>(null)

function openTaskDetail(task: Task) {
  selectedTask.value = { ...task }
}

async function handleTaskUpdate() {
  if (!selectedTask.value) return
  try {
    const updated = await authPatch<Task>(
      `/workspaces/${workspaceId}/tasks/${selectedTask.value.id}`,
      {
        title: selectedTask.value.title,
        description: selectedTask.value.description,
        status: selectedTask.value.status,
        priority: selectedTask.value.priority,
        assigneeId: selectedTask.value.assignee?.id || null,
        dueDate: selectedTask.value.dueDate,
      },
    )
    const idx = tasks.value.findIndex(t => t.id === updated.id)
    if (idx !== -1) tasks.value[idx] = updated
    selectedTask.value = null
    if (updated.status === 'HELP') helpModalTask.value = updated
  }
  catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    alert(err?.data?.message || '수정에 실패했습니다.')
  }
}

onMounted(() => { loadData() })
</script>

<template>
  <div>
    <!-- 헤더 -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-bold text-foreground">
          칸반 보드
        </h2>
        <p class="text-sm text-muted-foreground mt-0.5">
          태스크를 드래그하거나 상태를 변경하세요
        </p>
      </div>
      <Button @click="openCreateModal()">
        <Icon
          icon="heroicons:plus"
          class="w-4 h-4 mr-2"
        />
        태스크 추가
      </Button>
    </div>

    <!-- 로딩 -->
    <div
      v-if="loading"
      class="flex gap-4 overflow-x-auto pb-4"
    >
      <div
        v-for="n in 5"
        :key="n"
        class="flex-shrink-0 w-64 bg-muted/30 rounded-xl p-3 space-y-2"
      >
        <div class="h-4 bg-muted animate-pulse rounded w-1/2 mb-3" />
        <div
          v-for="m in 2"
          :key="m"
          class="h-20 bg-muted animate-pulse rounded-lg"
        />
      </div>
    </div>

    <!-- 칸반 -->
    <div
      v-else
      class="flex gap-4 overflow-x-auto pb-6 items-start"
    >
      <div
        v-for="col in COLUMNS"
        :key="col.status"
        class="flex-shrink-0 w-64"
      >
        <!-- 컬럼 헤더 -->
        <div
          class="border border-border rounded-xl overflow-hidden"
          :class="col.status === 'HELP' ? 'ring-1 ring-red-500/30' : ''"
        >
          <div
            class="px-3 py-2.5 flex items-center justify-between border-b border-border bg-card"
            :class="`border-t-4 ${col.color}`"
          >
            <div class="flex items-center gap-2">
              <span class="text-sm font-semibold text-foreground">{{ col.label }}</span>
              <span class="text-xs bg-muted text-muted-foreground rounded-full px-1.5 py-0.5">
                {{ columnTasks(col.status).length }}
              </span>
            </div>
            <button
              class="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              @click="openCreateModal(col.status)"
            >
              <Icon
                icon="heroicons:plus"
                class="w-4 h-4"
              />
            </button>
          </div>

          <!-- 태스크 카드들 -->
          <div class="p-2 space-y-2 min-h-[8rem] bg-muted/10">
            <div
              v-for="task in columnTasks(col.status)"
              :key="task.id"
              class="bg-card border border-border rounded-lg p-3 cursor-pointer hover:shadow-sm transition-all hover:border-primary/30"
              @click="openTaskDetail(task)"
            >
              <!-- 우선순위 + 제목 -->
              <div class="flex items-start gap-1.5 mb-2">
                <Icon
                  icon="heroicons:flag"
                  class="w-3.5 h-3.5 flex-shrink-0 mt-0.5"
                  :class="PRIORITY_COLOR[task.priority]"
                />
                <p class="text-sm font-medium text-foreground line-clamp-2 leading-tight">
                  {{ task.title }}
                </p>
              </div>

              <!-- HELP 이유 -->
              <p
                v-if="task.helpReason"
                class="text-xs text-red-500 mb-2 line-clamp-1"
              >
                {{ task.helpReason }}
              </p>

              <!-- 하단: 마감일 + 담당자 -->
              <div class="flex items-center justify-between mt-2">
                <span
                  v-if="task.dueDate"
                  class="text-xs text-muted-foreground flex items-center gap-1"
                >
                  <Icon
                    icon="heroicons:calendar"
                    class="w-3 h-3"
                  />
                  {{ useRelativeTime(task.dueDate) }}
                </span>
                <span v-else />
                <div
                  v-if="task.assignee"
                  class="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium overflow-hidden"
                  :title="task.assignee.nickname ?? task.assignee.name"
                >
                  <img
                    v-if="task.assignee.avatarUrl"
                    :src="task.assignee.avatarUrl"
                    class="h-full w-full object-cover"
                  >
                  <span v-else>{{ (task.assignee.nickname ?? task.assignee.name).slice(0, 1) }}</span>
                </div>
              </div>
            </div>

            <!-- 빈 컬럼 -->
            <div
              v-if="columnTasks(col.status).length === 0"
              class="flex items-center justify-center h-16 text-xs text-muted-foreground"
            >
              태스크 없음
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 태스크 생성 모달 -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      @click.self="showCreateModal = false"
    >
      <div class="bg-card border border-border rounded-xl w-full max-w-md p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-foreground">
            새 태스크
          </h3>
          <button
            class="text-muted-foreground hover:text-foreground"
            @click="showCreateModal = false"
          >
            <Icon
              icon="heroicons:x-mark"
              class="w-5 h-5"
            />
          </button>
        </div>

        <div class="space-y-3">
          <div>
            <input
              v-model="createForm.title"
              placeholder="태스크 제목 *"
              class="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              @keydown.enter="handleCreate"
            >
          </div>

          <div>
            <textarea
              v-model="createForm.description"
              placeholder="설명 (선택)"
              rows="3"
              class="w-full px-3 py-2 text-sm border border-border rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs text-muted-foreground mb-1 block">상태</label>
              <select
                v-model="createStatus"
                class="w-full h-9 px-2 text-sm border border-border rounded-md bg-background focus:outline-none"
              >
                <option
                  v-for="col in COLUMNS"
                  :key="col.status"
                  :value="col.status"
                >
                  {{ col.label }}
                </option>
              </select>
            </div>
            <div>
              <label class="text-xs text-muted-foreground mb-1 block">우선순위</label>
              <select
                v-model="createForm.priority"
                class="w-full h-9 px-2 text-sm border border-border rounded-md bg-background focus:outline-none"
              >
                <option
                  v-for="(label, val) in PRIORITY_LABEL"
                  :key="val"
                  :value="val"
                >
                  {{ label }}
                </option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs text-muted-foreground mb-1 block">담당자</label>
              <select
                v-model="createForm.assigneeId"
                class="w-full h-9 px-2 text-sm border border-border rounded-md bg-background focus:outline-none"
              >
                <option value="">
                  미배정
                </option>
                <option
                  v-for="m in members"
                  :key="m.user.id"
                  :value="m.user.id"
                >
                  {{ m.user.nickname ?? m.user.name }}
                </option>
              </select>
            </div>
            <div>
              <label class="text-xs text-muted-foreground mb-1 block">마감일</label>
              <input
                v-model="createForm.dueDate"
                type="date"
                class="w-full h-9 px-2 text-sm border border-border rounded-md bg-background focus:outline-none"
              >
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-2">
          <Button
            variant="outline"
            @click="showCreateModal = false"
          >
            취소
          </Button>
          <Button
            :disabled="!createForm.title.trim() || isCreating"
            @click="handleCreate"
          >
            <Icon
              v-if="isCreating"
              icon="heroicons:arrow-path"
              class="w-4 h-4 mr-1 animate-spin"
            />
            생성
          </Button>
        </div>
      </div>
    </div>

    <!-- 태스크 상세/수정 모달 -->
    <div
      v-if="selectedTask"
      class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      @click.self="selectedTask = null"
    >
      <div class="bg-card border border-border rounded-xl w-full max-w-lg p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-foreground">
            태스크 상세
          </h3>
          <button
            class="text-muted-foreground hover:text-foreground"
            @click="selectedTask = null"
          >
            <Icon
              icon="heroicons:x-mark"
              class="w-5 h-5"
            />
          </button>
        </div>

        <div class="space-y-3">
          <input
            v-model="selectedTask.title"
            class="w-full px-3 py-2 text-sm font-medium border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
          <textarea
            v-model="selectedTask.description"
            placeholder="설명 추가..."
            rows="4"
            class="w-full px-3 py-2 text-sm border border-border rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs text-muted-foreground mb-1 block">상태</label>
              <select
                v-model="selectedTask.status"
                class="w-full h-9 px-2 text-sm border border-border rounded-md bg-background focus:outline-none"
              >
                <option
                  v-for="col in COLUMNS"
                  :key="col.status"
                  :value="col.status"
                >
                  {{ col.label }}
                </option>
              </select>
            </div>
            <div>
              <label class="text-xs text-muted-foreground mb-1 block">우선순위</label>
              <select
                v-model="selectedTask.priority"
                class="w-full h-9 px-2 text-sm border border-border rounded-md bg-background focus:outline-none"
              >
                <option
                  v-for="(label, val) in PRIORITY_LABEL"
                  :key="val"
                  :value="val"
                >
                  {{ label }}
                </option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs text-muted-foreground mb-1 block">담당자</label>
              <select
                :value="selectedTask.assignee?.id ?? ''"
                class="w-full h-9 px-2 text-sm border border-border rounded-md bg-background focus:outline-none"
                @change="selectedTask!.assignee = members.find(m => m.user.id === ($event.target as HTMLSelectElement).value)?.user as Task['assignee'] ?? null"
              >
                <option value="">
                  미배정
                </option>
                <option
                  v-for="m in members"
                  :key="m.user.id"
                  :value="m.user.id"
                >
                  {{ m.user.nickname ?? m.user.name }}
                </option>
              </select>
            </div>
            <div>
              <label class="text-xs text-muted-foreground mb-1 block">마감일</label>
              <input
                :value="selectedTask.dueDate ? selectedTask.dueDate.slice(0, 10) : ''"
                type="date"
                class="w-full h-9 px-2 text-sm border border-border rounded-md bg-background focus:outline-none"
                @change="selectedTask!.dueDate = ($event.target as HTMLInputElement).value || null"
              >
            </div>
          </div>

          <div
            v-if="selectedTask.status === 'HELP'"
            class="space-y-1"
          >
            <label class="text-xs text-muted-foreground block">도움 요청 사유</label>
            <input
              v-model="selectedTask.helpReason"
              placeholder="어떤 부분이 막히나요?"
              class="w-full px-3 py-2 text-sm border border-red-300 rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-red-400"
            >
          </div>
        </div>

        <div class="flex justify-end gap-2">
          <Button
            variant="outline"
            @click="selectedTask = null"
          >
            취소
          </Button>
          <Button @click="handleTaskUpdate">
            저장
          </Button>
        </div>
      </div>
    </div>

    <!-- HELP 액션 모달 -->
    <WorkspaceHelpActionModal
      v-if="helpModalTask"
      :task="helpModalTask"
      @close="helpModalTask = null"
    />
  </div>
</template>
