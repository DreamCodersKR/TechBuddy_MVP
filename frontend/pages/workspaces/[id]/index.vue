<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'
import { VueDraggableNext as Draggable } from 'vue-draggable-next'

definePageMeta({ layout: 'workspace', middleware: 'auth' })
useHead({ title: '칸반 보드 - FLOWIT' })

const route = useRoute()
const workspaceId = route.params.id as string
const { get: authGet, post: authPost, patch: authPatch, delete: authDel } = useAuthFetch()
const authStore = useAuthStore()

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
  issueNumber: number | null
  position: number
  assignee: { id: string, name: string, nickname: string | null, avatarUrl: string | null } | null
  createdBy: { id: string, name: string, nickname: string | null }
  sprint: { id: string, name: string } | null
  project: { id: string, issuePrefix: string | null }
  tags: string[]
}

interface Member {
  role: string
  user: { id: string, name: string, nickname: string | null, avatarUrl: string | null }
}

interface Sprint {
  id: string
  name: string
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED'
}

interface TaskComment {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  author: { id: string, name: string, nickname: string | null, avatarUrl: string | null }
}

// ─── 상태 ────────────────────────────────────────────────
const tasks = ref<Task[]>([])
const members = ref<Member[]>([])
const sprints = ref<Sprint[]>([])
const loading = ref(true)

// 드래그용 안정적 컬럼 배열 (vue-draggable-next가 참조를 유지할 수 있도록)
const boardColumns = ref<Record<TaskStatus, Task[]>>({
  TODO: [], IN_PROGRESS: [], REVIEW: [], HELP: [], DONE: [],
})

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

// ─── 필터 ────────────────────────────────────────────────
const searchQuery = ref('')
const myTasksOnly = ref(false)
const filterPriority = ref<TaskPriority | ''>('')

const currentUserId = computed(() => (authStore.currentUser as any)?.id ?? '')

// boardColumns 재구성 (필터 적용 후 안정적 참조 유지)
function refreshBoard() {
  const map: Record<TaskStatus, Task[]> = { TODO: [], IN_PROGRESS: [], REVIEW: [], HELP: [], DONE: [] }
  tasks.value.forEach((t) => {
    if (searchQuery.value.trim() && !t.title.toLowerCase().includes(searchQuery.value.toLowerCase())) return
    if (myTasksOnly.value && t.assignee?.id !== currentUserId.value) return
    if (filterPriority.value && t.priority !== filterPriority.value) return
    map[t.status].push(t)
  })
  ;(Object.keys(map) as TaskStatus[]).forEach(s => map[s].sort((a, b) => a.position - b.position))
  // 기존 배열 참조를 유지하면서 내용만 교체 (vue-draggable-next 호환)
  ;(Object.keys(map) as TaskStatus[]).forEach((s) => {
    boardColumns.value[s].splice(0, boardColumns.value[s].length, ...map[s])
  })
}

watch([tasks, searchQuery, myTasksOnly, filterPriority], refreshBoard)

const hasFilter = computed(() => searchQuery.value.trim() || myTasksOnly.value || filterPriority.value)

function clearFilters() {
  searchQuery.value = ''
  myTasksOnly.value = false
  filterPriority.value = ''
}

// ─── 데이터 로드 ─────────────────────────────────────────
async function loadData() {
  loading.value = true
  try {
    const [taskRes, memberRes, sprintRes] = await Promise.all([
      authGet<Task[]>(`/workspaces/${workspaceId}/tasks`),
      authGet<Member[]>(`/workspaces/${workspaceId}/members`),
      authGet<Sprint[]>(`/workspaces/${workspaceId}/sprints`),
    ])
    tasks.value = taskRes
    members.value = memberRes
    sprints.value = sprintRes
    refreshBoard()
  }
  catch { tasks.value = [] }
  finally { loading.value = false }
}

// ─── 드래그앤드롭 ────────────────────────────────────────
async function onColumnChange(colStatus: TaskStatus, evt: any) {
  // 다른 컬럼으로 이동
  if (evt.added) {
    const task: Task = evt.added.element
    const newIndex: number = evt.added.newIndex
    const prevStatus = task.status
    const idx = tasks.value.findIndex(t => t.id === task.id)
    if (idx === -1) return

    tasks.value[idx].status = colStatus

    try {
      const colTasks = tasks.value
        .filter(t => t.status === colStatus)
        .sort((a, b) => a.position - b.position)
      const withoutTask = colTasks.filter(t => t.id !== task.id)
      withoutTask.splice(newIndex, 0, colTasks.find(t => t.id === task.id)!)
      const updates = withoutTask.map((t, i) => ({ id: t.id, position: (i + 1) * 10, status: colStatus }))
      updates.forEach((u) => {
        const ti = tasks.value.findIndex(t => t.id === u.id)
        if (ti !== -1) tasks.value[ti].position = u.position
      })
      await authPatch(`/workspaces/${workspaceId}/tasks/reorder`, { updates })
      if (colStatus === 'HELP') helpModalTask.value = tasks.value[idx]
    }
    catch {
      tasks.value[idx].status = prevStatus
    }
  }

  // 같은 컬럼 내 순서 변경
  if (evt.moved) {
    const { oldIndex, newIndex } = evt.moved
    if (oldIndex === newIndex) return

    // boardColumns 배열을 직접 사용 (이미 splice로 vue-draggable-next가 순서 변경 완료)
    const colTasks = boardColumns.value[colStatus]
    const updates = colTasks.map((t, i) => ({ id: t.id, position: (i + 1) * 10, status: colStatus }))
    updates.forEach((u) => {
      const ti = tasks.value.findIndex(t => t.id === u.id)
      if (ti !== -1) tasks.value[ti].position = u.position
    })

    try {
      await authPatch(`/workspaces/${workspaceId}/tasks/reorder`, { updates })
    }
    catch {
      await loadData()
    }
  }
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
  sprintId: '',
  tags: [] as string[],
})
const createTagInput = ref('')
const isCreating = ref(false)

function openCreateModal(status: TaskStatus = 'TODO') {
  createStatus.value = status
  createForm.title = ''
  createForm.description = ''
  createForm.priority = 'MEDIUM'
  createForm.assigneeId = ''
  createForm.dueDate = ''
  createForm.sprintId = ''
  createForm.tags = []
  createTagInput.value = ''
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
    if (createForm.sprintId) body.sprintId = createForm.sprintId
    if (createForm.tags.length > 0) body.tags = createForm.tags

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

// ─── 태스크 상세 모달 ────────────────────────────────────
const selectedTask = ref<Task | null>(null)
const editSprintId = ref('')
const editTags = ref<string[]>([])
const editTagInput = ref('')

function openTaskDetail(task: Task) {
  selectedTask.value = { ...task }
  editSprintId.value = task.sprint?.id ?? ''
  editTags.value = [...(task.tags ?? [])]
  editTagInput.value = ''
}

function addCreateTag() {
  const val = createTagInput.value.trim().replace(/,/g, '')
  if (val && !createForm.tags.includes(val)) createForm.tags.push(val)
  createTagInput.value = ''
}

function removeCreateTag(tag: string) {
  createForm.tags = createForm.tags.filter(t => t !== tag)
}

function addEditTag() {
  const val = editTagInput.value.trim().replace(/,/g, '')
  if (val && !editTags.value.includes(val)) editTags.value.push(val)
  editTagInput.value = ''
}

function removeEditTag(tag: string) {
  editTags.value = editTags.value.filter(t => t !== tag)
}

// ─── 태스크 코멘트 ────────────────────────────────────────
const comments = ref<TaskComment[]>([])
const newComment = ref('')
const editingCommentId = ref<string | null>(null)
const editingContent = ref('')
const isSubmittingComment = ref(false)

watch(selectedTask, (task) => {
  if (task) {
    comments.value = []
    newComment.value = ''
    editingCommentId.value = null
    loadComments()
  }
})

async function loadComments() {
  if (!selectedTask.value) return
  try {
    comments.value = await authGet<TaskComment[]>(
      `/workspaces/${workspaceId}/tasks/${selectedTask.value.id}/comments`,
    )
  }
  catch { comments.value = [] }
}

async function submitComment() {
  if (!newComment.value.trim() || !selectedTask.value) return
  isSubmittingComment.value = true
  try {
    const comment = await authPost<TaskComment>(
      `/workspaces/${workspaceId}/tasks/${selectedTask.value.id}/comments`,
      { content: newComment.value.trim() },
    )
    comments.value.push(comment)
    newComment.value = ''
  }
  catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    alert(err?.data?.message || '코멘트 작성에 실패했습니다.')
  }
  finally { isSubmittingComment.value = false }
}

function startEditComment(comment: TaskComment) {
  editingCommentId.value = comment.id
  editingContent.value = comment.content
}

async function saveEditComment(commentId: string) {
  if (!editingContent.value.trim() || !selectedTask.value) return
  try {
    const updated = await authPatch<TaskComment>(
      `/workspaces/${workspaceId}/tasks/${selectedTask.value.id}/comments/${commentId}`,
      { content: editingContent.value.trim() },
    )
    const idx = comments.value.findIndex(c => c.id === commentId)
    if (idx !== -1) comments.value[idx] = updated
    editingCommentId.value = null
  }
  catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    alert(err?.data?.message || '코멘트 수정에 실패했습니다.')
  }
}

async function removeComment(commentId: string) {
  if (!selectedTask.value) return
  try {
    await authDel(`/workspaces/${workspaceId}/tasks/${selectedTask.value.id}/comments/${commentId}`)
    comments.value = comments.value.filter(c => c.id !== commentId)
  }
  catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    alert(err?.data?.message || '코멘트 삭제에 실패했습니다.')
  }
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
        helpReason: selectedTask.value.helpReason,
        sprintId: editSprintId.value || null,
        tags: editTags.value,
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

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    if (selectedTask.value) selectedTask.value = null
    else if (showCreateModal.value) showCreateModal.value = false
  }
}

onMounted(() => {
  loadData()
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div>
    <!-- 헤더 -->
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-xl font-bold text-foreground">
          칸반 보드
        </h2>
        <p class="text-sm text-muted-foreground mt-0.5">
          태스크를 드래그하거나 상태를 변경하세요
        </p>
      </div>
      <Button @click="openCreateModal()">
        <Icon icon="heroicons:plus" class="w-4 h-4 mr-2" />
        태스크 추가
      </Button>
    </div>

    <!-- 필터 바 -->
    <div class="flex items-center gap-2 mb-5 flex-wrap">
      <input
        v-model="searchQuery"
        placeholder="태스크 검색..."
        class="h-8 px-3 text-sm border border-border rounded-md bg-background w-44 focus:outline-none focus:ring-2 focus:ring-ring"
      >
      <button
        class="h-8 px-3 text-xs rounded-md border transition-colors"
        :class="myTasksOnly
          ? 'bg-primary text-primary-foreground border-primary'
          : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground'"
        @click="myTasksOnly = !myTasksOnly"
      >
        나만 보기
      </button>
      <select
        v-model="filterPriority"
        class="h-8 px-2 text-xs border border-border rounded-md bg-background focus:outline-none"
      >
        <option value="">
          모든 우선순위
        </option>
        <option
          v-for="(label, val) in PRIORITY_LABEL"
          :key="val"
          :value="val"
        >
          {{ label }}
        </option>
      </select>
      <button
        v-if="hasFilter"
        class="h-8 px-3 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
        @click="clearFilters"
      >
        <Icon icon="heroicons:x-mark" class="w-3.5 h-3.5" />
        필터 초기화
      </button>
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
                {{ boardColumns[col.status].length }}
              </span>
            </div>
            <button
              class="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              @click="openCreateModal(col.status)"
            >
              <Icon icon="heroicons:plus" class="w-4 h-4" />
            </button>
          </div>

          <!-- 태스크 카드들 (드래그앤드롭) -->
          <Draggable
            :list="boardColumns[col.status]"
            :group="{ name: 'tasks' }"
            ghost-class="opacity-40"
            drag-class="rotate-1 shadow-xl"
            class="p-2 space-y-2 min-h-[8rem] bg-muted/10 block"
            @change="onColumnChange(col.status, $event)"
          >
            <div
              v-for="task in boardColumns[col.status]"
              :key="task.id"
              class="bg-card border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing hover:shadow-sm transition-all hover:border-primary/30"
              @click="openTaskDetail(task)"
            >
              <!-- 이슈 번호 -->
              <span
                v-if="task.project?.issuePrefix && task.issueNumber"
                class="block text-xs text-muted-foreground font-mono mb-1"
              >
                {{ task.project.issuePrefix }}-{{ String(task.issueNumber).padStart(3, '0') }}
              </span>

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

              <!-- 스프린트 뱃지 -->
              <span
                v-if="task.sprint"
                class="inline-block text-xs bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded px-1.5 py-0.5 mb-1.5"
              >
                {{ task.sprint.name }}
              </span>

              <!-- 태그 칩 -->
              <div
                v-if="task.tags?.length"
                class="flex flex-wrap gap-1 mb-1.5"
              >
                <span
                  v-for="tag in task.tags.slice(0, 2)"
                  :key="tag"
                  class="inline-block text-xs bg-muted text-muted-foreground rounded px-1.5 py-0.5"
                >
                  #{{ tag }}
                </span>
                <span
                  v-if="task.tags.length > 2"
                  class="text-xs text-muted-foreground"
                >+{{ task.tags.length - 2 }}</span>
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
                  <Icon icon="heroicons:calendar" class="w-3 h-3" />
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
              v-if="boardColumns[col.status].length === 0"
              class="flex items-center justify-center h-16 text-xs text-muted-foreground"
            >
              태스크 없음
            </div>
          </Draggable>
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
            <Icon icon="heroicons:x-mark" class="w-5 h-5" />
          </button>
        </div>

        <div class="space-y-3">
          <input
            v-model="createForm.title"
            placeholder="태스크 제목 *"
            class="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            @keydown.enter="handleCreate"
          >
          <textarea
            v-model="createForm.description"
            placeholder="설명 (선택)"
            rows="3"
            class="w-full px-3 py-2 text-sm border border-border rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
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
          <div>
            <label class="text-xs text-muted-foreground mb-1 block">스프린트</label>
            <select
              v-model="createForm.sprintId"
              class="w-full h-9 px-2 text-sm border border-border rounded-md bg-background focus:outline-none"
            >
              <option value="">
                미배정
              </option>
              <option
                v-for="s in sprints"
                :key="s.id"
                :value="s.id"
              >
                {{ s.name }}
              </option>
            </select>
          </div>
          <div>
            <label class="text-xs text-muted-foreground mb-1 block">태그</label>
            <div class="flex flex-wrap gap-1 mb-1.5">
              <span
                v-for="tag in createForm.tags"
                :key="tag"
                class="inline-flex items-center gap-1 text-xs bg-muted text-muted-foreground rounded px-1.5 py-0.5"
              >
                #{{ tag }}
                <button class="hover:text-foreground" @click="removeCreateTag(tag)">
                  <Icon icon="heroicons:x-mark" class="w-3 h-3" />
                </button>
              </span>
            </div>
            <input
              v-model="createTagInput"
              placeholder="태그 입력 후 Enter"
              class="w-full h-9 px-2 text-sm border border-border rounded-md bg-background focus:outline-none"
              @keydown.enter.prevent="addCreateTag"
              @keydown.comma.prevent="addCreateTag"
            >
          </div>
        </div>

        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="showCreateModal = false">
            취소
          </Button>
          <Button :disabled="!createForm.title.trim() || isCreating" @click="handleCreate">
            <Icon v-if="isCreating" icon="heroicons:arrow-path" class="w-4 h-4 mr-1 animate-spin" />
            생성
          </Button>
        </div>
      </div>
    </div>

    <!-- 태스크 상세 슬라이드 패널 -->
    <div
      v-if="selectedTask"
      class="fixed right-0 top-14 h-[calc(100vh-56px)] w-[520px] bg-card border-l border-border z-50 flex flex-col shadow-2xl"
    >
      <!-- 패널 헤더 -->
      <div class="flex items-center justify-between px-5 py-3.5 border-b border-border flex-shrink-0">
        <div class="flex items-center gap-2 min-w-0">
          <span
            v-if="selectedTask.project?.issuePrefix && selectedTask.issueNumber"
            class="text-xs text-muted-foreground font-mono flex-shrink-0 bg-muted px-1.5 py-0.5 rounded"
          >
            {{ selectedTask.project.issuePrefix }}-{{ String(selectedTask.issueNumber).padStart(3, '0') }}
          </span>
          <span class="text-sm font-semibold text-foreground truncate">태스크 상세</span>
        </div>
        <button
          class="text-muted-foreground hover:text-foreground flex-shrink-0 ml-2"
          @click="selectedTask = null"
        >
          <Icon icon="heroicons:x-mark" class="w-5 h-5" />
        </button>
      </div>

      <!-- 패널 본문 (스크롤) -->
      <div class="flex-1 overflow-y-auto p-5 space-y-4">
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
        <div>
          <label class="text-xs text-muted-foreground mb-1 block">스프린트</label>
          <select
            v-model="editSprintId"
            class="w-full h-9 px-2 text-sm border border-border rounded-md bg-background focus:outline-none"
          >
            <option value="">
              미배정
            </option>
            <option
              v-for="s in sprints"
              :key="s.id"
              :value="s.id"
            >
              {{ s.name }}
            </option>
          </select>
        </div>
        <div>
          <label class="text-xs text-muted-foreground mb-1 block">태그</label>
          <div class="flex flex-wrap gap-1 mb-1.5">
            <span
              v-for="tag in editTags"
              :key="tag"
              class="inline-flex items-center gap-1 text-xs bg-muted text-muted-foreground rounded px-1.5 py-0.5"
            >
              #{{ tag }}
              <button class="hover:text-foreground" @click="removeEditTag(tag)">
                <Icon icon="heroicons:x-mark" class="w-3 h-3" />
              </button>
            </span>
          </div>
          <input
            v-model="editTagInput"
            placeholder="태그 입력 후 Enter"
            class="w-full h-9 px-2 text-sm border border-border rounded-md bg-background focus:outline-none"
            @keydown.enter.prevent="addEditTag"
            @keydown.comma.prevent="addEditTag"
          >
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

        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="selectedTask = null">
            취소
          </Button>
          <Button @click="handleTaskUpdate">
            저장
          </Button>
        </div>

        <!-- 코멘트 섹션 -->
        <div class="border-t border-border pt-4 space-y-3">
          <h4 class="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Icon icon="heroicons:chat-bubble-left-ellipsis" class="w-4 h-4" />
            코멘트
            <span class="text-xs font-normal text-muted-foreground">({{ comments.length }})</span>
          </h4>

          <!-- 코멘트 목록 -->
          <div
            v-if="comments.length > 0"
            class="space-y-3 max-h-64 overflow-y-auto pr-1"
          >
            <div
              v-for="comment in comments"
              :key="comment.id"
              class="flex gap-2.5"
            >
              <div class="h-7 w-7 rounded-full bg-muted flex-shrink-0 flex items-center justify-center text-xs font-medium overflow-hidden mt-0.5">
                <img
                  v-if="comment.author.avatarUrl"
                  :src="comment.author.avatarUrl"
                  class="h-full w-full object-cover"
                >
                <span v-else>{{ (comment.author.nickname ?? comment.author.name).slice(0, 1) }}</span>
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-0.5">
                  <span class="text-xs font-medium text-foreground">{{ comment.author.nickname ?? comment.author.name }}</span>
                  <span class="text-xs text-muted-foreground">{{ useRelativeTime(comment.createdAt) }}</span>
                </div>

                <div
                  v-if="editingCommentId === comment.id"
                  class="space-y-1.5"
                >
                  <textarea
                    v-model="editingContent"
                    rows="2"
                    class="w-full px-2.5 py-1.5 text-xs border border-border rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    @keydown.enter.ctrl="saveEditComment(comment.id)"
                    @keydown.esc="editingCommentId = null"
                  />
                  <div class="flex gap-1.5">
                    <button
                      class="text-xs px-2 py-0.5 bg-primary text-primary-foreground rounded hover:opacity-90"
                      @click="saveEditComment(comment.id)"
                    >
                      저장
                    </button>
                    <button
                      class="text-xs px-2 py-0.5 border border-border rounded text-muted-foreground hover:text-foreground"
                      @click="editingCommentId = null"
                    >
                      취소
                    </button>
                  </div>
                </div>

                <div v-else>
                  <p class="text-xs text-foreground whitespace-pre-wrap break-words">
                    {{ comment.content }}
                  </p>
                  <div
                    v-if="comment.author.id === currentUserId"
                    class="flex gap-2 mt-0.5"
                  >
                    <button
                      class="text-xs text-muted-foreground hover:text-foreground"
                      @click="startEditComment(comment)"
                    >
                      수정
                    </button>
                    <button
                      class="text-xs text-muted-foreground hover:text-red-500"
                      @click="removeComment(comment.id)"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p
            v-else
            class="text-xs text-muted-foreground"
          >
            아직 코멘트가 없습니다.
          </p>

          <!-- 코멘트 작성 -->
          <div class="flex gap-2 items-start">
            <div class="h-7 w-7 rounded-full bg-muted flex-shrink-0 flex items-center justify-center text-xs font-medium overflow-hidden mt-0.5">
              <img
                v-if="(authStore.currentUser as any)?.avatarUrl"
                :src="(authStore.currentUser as any).avatarUrl"
                class="h-full w-full object-cover"
              >
              <span v-else>{{ ((authStore.currentUser as any)?.nickname ?? (authStore.currentUser as any)?.name ?? '?').slice(0, 1) }}</span>
            </div>
            <div class="flex-1 space-y-1.5">
              <textarea
                v-model="newComment"
                placeholder="코멘트 작성... (Ctrl+Enter로 제출)"
                rows="2"
                class="w-full px-2.5 py-1.5 text-xs border border-border rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                @keydown.enter.ctrl="submitComment"
              />
              <div class="flex justify-end">
                <button
                  :disabled="!newComment.trim() || isSubmittingComment"
                  class="text-xs px-3 py-1 bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                  @click="submitComment"
                >
                  <Icon v-if="isSubmittingComment" icon="heroicons:arrow-path" class="w-3 h-3 animate-spin" />
                  작성
                </button>
              </div>
            </div>
          </div>
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
