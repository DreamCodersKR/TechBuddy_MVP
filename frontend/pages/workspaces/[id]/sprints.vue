<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDateShort } from '@/utils/formatters'

definePageMeta({ layout: 'workspace', middleware: 'auth' })
useHead({ title: '스프린트 - FLOWIT' })

const route = useRoute()
const workspaceId = route.params.id as string
const authStore = useAuthStore()
const { get: authGet, post: authPost, patch: authPatch, delete: authDelete } = useAuthFetch()

type SprintStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED'

interface Sprint {
  id: string
  name: string
  goal: string | null
  status: SprintStatus
  startDate: string | null
  endDate: string | null
  createdAt: string
  _count: { tasks: number }
}

const sprints = ref<Sprint[]>([])
const loading = ref(true)
const myRole = ref<'ADMIN' | 'MEMBER' | 'MENTOR'>('MEMBER')

const STATUS_LABEL: Record<SprintStatus, string> = {
  PLANNED: '예정',
  ACTIVE: '진행 중',
  COMPLETED: '완료',
}

const STATUS_COLOR: Record<SprintStatus, string> = {
  PLANNED: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  ACTIVE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}

async function loadData() {
  loading.value = true
  try {
    const [sprintRes, memberRes] = await Promise.all([
      authGet<Sprint[]>(`/workspaces/${workspaceId}/sprints`),
      authGet<{ role: string, user: { id: string } }[]>(`/workspaces/${workspaceId}/members`),
    ])
    sprints.value = sprintRes
    const me = memberRes.find(m => m.user.id === authStore.currentUser?.id)
    if (me) myRole.value = me.role as typeof myRole.value
  }
  catch { sprints.value = [] }
  finally { loading.value = false }
}

// ─── 생성 모달 ────────────────────────────────────────────
const showCreateModal = ref(false)
const createForm = reactive({
  name: '',
  goal: '',
  startDate: '',
  endDate: '',
  status: 'PLANNED' as SprintStatus,
})
const isCreating = ref(false)

function openCreateModal() {
  createForm.name = ''
  createForm.goal = ''
  createForm.startDate = ''
  createForm.endDate = ''
  createForm.status = 'PLANNED'
  showCreateModal.value = true
}

async function handleCreate() {
  if (!createForm.name.trim()) return
  isCreating.value = true
  try {
    const body: Record<string, unknown> = {
      name: createForm.name.trim(),
      status: createForm.status,
    }
    if (createForm.goal.trim()) body.goal = createForm.goal.trim()
    if (createForm.startDate) body.startDate = createForm.startDate
    if (createForm.endDate) body.endDate = createForm.endDate

    const created = await authPost<Sprint>(`/workspaces/${workspaceId}/sprints`, body)
    sprints.value.push(created)
    showCreateModal.value = false
  }
  catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    toast.error(err?.data?.message || '스프린트 생성에 실패했습니다.')
  }
  finally { isCreating.value = false }
}

// ─── 수정 모달 ────────────────────────────────────────────
const editTarget = ref<Sprint | null>(null)
const editForm = reactive({
  name: '',
  goal: '',
  startDate: '',
  endDate: '',
  status: 'PLANNED' as SprintStatus,
})
const isSaving = ref(false)

function openEditModal(sprint: Sprint) {
  editTarget.value = sprint
  editForm.name = sprint.name
  editForm.goal = sprint.goal ?? ''
  editForm.startDate = sprint.startDate ? sprint.startDate.slice(0, 10) : ''
  editForm.endDate = sprint.endDate ? sprint.endDate.slice(0, 10) : ''
  editForm.status = sprint.status
}

async function handleEdit() {
  if (!editTarget.value || !editForm.name.trim()) return
  isSaving.value = true
  try {
    const body: Record<string, unknown> = {
      name: editForm.name.trim(),
      status: editForm.status,
      goal: editForm.goal.trim() || null,
      startDate: editForm.startDate || null,
      endDate: editForm.endDate || null,
    }
    const updated = await authPatch<Sprint>(
      `/workspaces/${workspaceId}/sprints/${editTarget.value.id}`,
      body,
    )
    const idx = sprints.value.findIndex(s => s.id === updated.id)
    if (idx !== -1) sprints.value[idx] = { ...sprints.value[idx], ...updated }
    editTarget.value = null
  }
  catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    toast.error(err?.data?.message || '수정에 실패했습니다.')
  }
  finally { isSaving.value = false }
}

// ─── 삭제 ────────────────────────────────────────────────
async function handleDelete(sprint: Sprint) {
  if (!confirm(`"${sprint.name}"을 삭제할까요? 배정된 태스크의 스프린트 연결이 해제됩니다.`)) return
  try {
    await authDelete(`/workspaces/${workspaceId}/sprints/${sprint.id}`)
    sprints.value = sprints.value.filter(s => s.id !== sprint.id)
  }
  catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    toast.error(err?.data?.message || '삭제에 실패했습니다.')
  }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '-'
  return formatDateShort(dateStr)
}

onMounted(() => { loadData() })
</script>

<template>
  <div>
    <!-- 헤더 -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-bold text-foreground">
          스프린트
        </h2>
        <p class="text-sm text-muted-foreground mt-0.5">
          스프린트를 관리하고 태스크를 배치하세요
        </p>
      </div>
      <Button
        v-if="myRole === 'ADMIN'"
        @click="openCreateModal"
      >
        <Icon
          icon="heroicons:plus"
          class="w-4 h-4 mr-2"
        />
        스프린트 추가
      </Button>
    </div>

    <!-- 로딩 -->
    <div
      v-if="loading"
      class="space-y-3"
    >
      <div
        v-for="n in 3"
        :key="n"
        class="border border-border rounded-xl p-5"
      >
        <div class="h-5 bg-muted animate-pulse rounded w-1/4 mb-2" />
        <div class="h-3 bg-muted animate-pulse rounded w-1/3" />
      </div>
    </div>

    <!-- 스프린트 목록 -->
    <div
      v-else-if="sprints.length > 0"
      class="space-y-3"
    >
      <div
        v-for="sprint in sprints"
        :key="sprint.id"
        class="border border-border rounded-xl p-5 bg-card"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                :class="STATUS_COLOR[sprint.status]"
              >
                {{ STATUS_LABEL[sprint.status] }}
              </span>
              <h3 class="font-semibold text-foreground">
                {{ sprint.name }}
              </h3>
            </div>
            <p
              v-if="sprint.goal"
              class="text-sm text-muted-foreground mb-2 line-clamp-1"
            >
              {{ sprint.goal }}
            </p>
            <div class="flex items-center gap-4 text-xs text-muted-foreground">
              <span class="flex items-center gap-1">
                <Icon icon="heroicons:calendar" class="w-3.5 h-3.5" />
                {{ formatDate(sprint.startDate) }} ~ {{ formatDate(sprint.endDate) }}
              </span>
              <span class="flex items-center gap-1">
                <Icon icon="heroicons:check-circle" class="w-3.5 h-3.5" />
                태스크 {{ sprint._count.tasks }}개
              </span>
            </div>
          </div>
          <div class="flex items-center gap-1 flex-shrink-0">
            <!-- 회고 버튼: 완료된 스프린트에만 표시 -->
            <NuxtLink
              v-if="sprint.status === 'COMPLETED'"
              :to="`/workspaces/${workspaceId}/retrospective/${sprint.id}`"
              class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors"
            >
              <Icon icon="heroicons:light-bulb" class="w-3.5 h-3.5" />
              회고
            </NuxtLink>
            <template v-if="myRole === 'ADMIN'">
              <button
                class="p-1.5 rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                @click="openEditModal(sprint)"
              >
                <Icon icon="heroicons:pencil" class="w-4 h-4" />
              </button>
              <button
                class="p-1.5 rounded text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
                @click="handleDelete(sprint)"
              >
                <Icon icon="heroicons:trash" class="w-4 h-4" />
              </button>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- 빈 상태 -->
    <div
      v-else
      class="flex flex-col items-center justify-center py-20 text-center"
    >
      <Icon
        icon="heroicons:bolt"
        class="w-12 h-12 text-muted-foreground mb-4"
      />
      <h3 class="text-lg font-semibold text-foreground mb-2">
        스프린트가 없어요
      </h3>
      <p class="text-sm text-muted-foreground mb-4">
        스프린트를 만들어 태스크를 묶어 관리해보세요
      </p>
      <Button
        v-if="myRole === 'ADMIN'"
        @click="openCreateModal"
      >
        <Icon icon="heroicons:plus" class="w-4 h-4 mr-2" />
        첫 스프린트 만들기
      </Button>
      <p
        v-else
        class="text-xs text-muted-foreground"
      >
        관리자에게 스프린트 생성을 요청하세요
      </p>
    </div>

    <!-- 생성 모달 -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      @click.self="showCreateModal = false"
    >
      <div class="bg-card border border-border rounded-xl w-full max-w-md p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-foreground">
            새 스프린트
          </h3>
          <button
            class="text-muted-foreground hover:text-foreground"
            @click="showCreateModal = false"
          >
            <Icon icon="heroicons:x-mark" class="w-5 h-5" />
          </button>
        </div>

        <div class="space-y-3">
          <div class="space-y-1">
            <Label>이름 <span class="text-destructive">*</span></Label>
            <Input
              v-model="createForm.name"
              placeholder="예: Sprint 1"
            />
          </div>

          <div class="space-y-1">
            <Label>목표 <span class="text-xs text-muted-foreground">(선택)</span></Label>
            <Input
              v-model="createForm.goal"
              placeholder="이번 스프린트에서 완성할 것"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <Label>시작일</Label>
              <input
                v-model="createForm.startDate"
                type="date"
                class="w-full h-9 px-3 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
            </div>
            <div class="space-y-1">
              <Label>종료일</Label>
              <input
                v-model="createForm.endDate"
                type="date"
                class="w-full h-9 px-3 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
            </div>
          </div>

          <div class="space-y-1">
            <Label>상태</Label>
            <select
              v-model="createForm.status"
              class="w-full h-9 px-3 text-sm border border-border rounded-md bg-background focus:outline-none"
            >
              <option
                v-for="(label, val) in STATUS_LABEL"
                :key="val"
                :value="val"
              >
                {{ label }}
              </option>
            </select>
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
            :disabled="!createForm.name.trim() || isCreating"
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

    <!-- 수정 모달 -->
    <div
      v-if="editTarget"
      class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      @click.self="editTarget = null"
    >
      <div class="bg-card border border-border rounded-xl w-full max-w-md p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-foreground">
            스프린트 수정
          </h3>
          <button
            class="text-muted-foreground hover:text-foreground"
            @click="editTarget = null"
          >
            <Icon icon="heroicons:x-mark" class="w-5 h-5" />
          </button>
        </div>

        <div class="space-y-3">
          <div class="space-y-1">
            <Label>이름 <span class="text-destructive">*</span></Label>
            <Input v-model="editForm.name" />
          </div>

          <div class="space-y-1">
            <Label>목표</Label>
            <Input
              v-model="editForm.goal"
              placeholder="이번 스프린트에서 완성할 것"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <Label>시작일</Label>
              <input
                v-model="editForm.startDate"
                type="date"
                class="w-full h-9 px-3 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
            </div>
            <div class="space-y-1">
              <Label>종료일</Label>
              <input
                v-model="editForm.endDate"
                type="date"
                class="w-full h-9 px-3 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
            </div>
          </div>

          <div class="space-y-1">
            <Label>상태</Label>
            <select
              v-model="editForm.status"
              class="w-full h-9 px-3 text-sm border border-border rounded-md bg-background focus:outline-none"
            >
              <option
                v-for="(label, val) in STATUS_LABEL"
                :key="val"
                :value="val"
              >
                {{ label }}
              </option>
            </select>
          </div>
        </div>

        <div class="flex justify-end gap-2">
          <Button
            variant="outline"
            @click="editTarget = null"
          >
            취소
          </Button>
          <Button
            :disabled="!editForm.name.trim() || isSaving"
            @click="handleEdit"
          >
            <Icon
              v-if="isSaving"
              icon="heroicons:arrow-path"
              class="w-4 h-4 mr-1 animate-spin"
            />
            저장
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
