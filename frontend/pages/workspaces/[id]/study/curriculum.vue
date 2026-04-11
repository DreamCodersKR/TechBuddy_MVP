<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { toast } from 'vue-sonner'
import { formatDateShort } from '@/utils/formatters'

definePageMeta({ layout: 'workspace' })

const route = useRoute()
const { get: authGet, post: authPost, patch: authPatch, delete: authDel } = useAuthFetch()
const authStore = useAuthStore()

const workspaceId = computed(() => route.params.id as string)

// ─── 타입 ─────────────────────────────────────────────────────────────────

interface Submission {
  userId: string
  status: string
  submittedAt: string
}

interface Assignment {
  id: string
  title: string
  description: string | null
  dueDate: string | null
  submissions: Submission[]
}

interface StudyWeek {
  id: string
  weekNumber: number
  title: string
  goal: string | null
  startDate: string | null
  endDate: string | null
  assignments: Assignment[]
}

// ─── 상태 ─────────────────────────────────────────────────────────────────

const weeks = ref<StudyWeek[]>([])
const loading = ref(true)
const expandedWeeks = ref<Set<string>>(new Set())

// 워크스페이스 멤버 수 (제출률 계산)
const memberCount = ref(1)

// ADMIN 여부
const isAdmin = ref(false)

// 주차 생성 모달
const showWeekModal = ref(false)
const editingWeek = ref<StudyWeek | null>(null)
const weekForm = ref({ weekNumber: 1, title: '', goal: '', startDate: '', endDate: '' })
const weekLoading = ref(false)

// 과제 생성 모달
const showAssignModal = ref(false)
const assignWeekId = ref('')
const editingAssignment = ref<Assignment | null>(null)
const assignForm = ref({ title: '', description: '', dueDate: '' })
const assignLoading = ref(false)

// 과제 제출 모달
const showSubmitModal = ref(false)
const submitAssignmentId = ref('')
const submitForm = ref({ proofUrl: '', content: '' })
const submitLoading = ref(false)
const mySubmissions = ref<Map<string, Submission>>(new Map())

// ─── 데이터 로드 ──────────────────────────────────────────────────────────

async function loadWeeks() {
  loading.value = true
  try {
    const [weeksData, memberData] = await Promise.all([
      authGet<StudyWeek[]>(`/workspaces/${workspaceId.value}/study/weeks`),
      authGet<any>(`/workspaces/${workspaceId.value}/members`),
    ])
    weeks.value = weeksData
    memberCount.value = memberData?.length ?? 1

    // 내 제출 현황 집계
    const myId = (authStore.currentUser as any)?.id
    const submissionMap = new Map<string, Submission>()
    for (const week of weeksData) {
      for (const assign of week.assignments) {
        const mine = assign.submissions.find((s) => s.userId === myId)
        if (mine) submissionMap.set(assign.id, mine)
      }
    }
    mySubmissions.value = submissionMap

    // ADMIN 여부
    const me = memberData?.find((m: any) => m.userId === myId)
    isAdmin.value = me?.role === 'ADMIN'

    // 첫 주차 자동 펼치기
    if (weeksData.length > 0) expandedWeeks.value.add(weeksData[0].id)
  }
  finally { loading.value = false }
}

onMounted(loadWeeks)

// ─── 주차 CRUD ───────────────────────────────────────────────────────────

function openCreateWeek() {
  editingWeek.value = null
  weekForm.value = {
    weekNumber: (weeks.value.length + 1),
    title: '',
    goal: '',
    startDate: '',
    endDate: '',
  }
  showWeekModal.value = true
}

function openEditWeek(week: StudyWeek) {
  editingWeek.value = week
  weekForm.value = {
    weekNumber: week.weekNumber,
    title: week.title,
    goal: week.goal ?? '',
    startDate: week.startDate ? week.startDate.slice(0, 10) : '',
    endDate: week.endDate ? week.endDate.slice(0, 10) : '',
  }
  showWeekModal.value = true
}

async function saveWeek() {
  weekLoading.value = true
  try {
    const payload = {
      weekNumber: weekForm.value.weekNumber,
      title: weekForm.value.title,
      goal: weekForm.value.goal || undefined,
      startDate: weekForm.value.startDate ? new Date(weekForm.value.startDate).toISOString() : undefined,
      endDate: weekForm.value.endDate ? new Date(weekForm.value.endDate).toISOString() : undefined,
    }
    if (editingWeek.value) {
      await authPatch(`/workspaces/${workspaceId.value}/study/weeks/${editingWeek.value.id}`, payload)
    }
    else {
      const created = await authPost<StudyWeek>(`/workspaces/${workspaceId.value}/study/weeks`, payload)
      expandedWeeks.value.add(created.id)
    }
    showWeekModal.value = false
    await loadWeeks()
  }
  catch (e: unknown) { const err = e as { data?: { message?: string } }; toast.error(err?.data?.message || '저장 실패') }
  finally { weekLoading.value = false }
}

async function deleteWeek(week: StudyWeek) {
  if (!confirm(`"${week.title}" 주차와 모든 과제를 삭제하시겠습니까?`)) return
  await authDel(`/workspaces/${workspaceId.value}/study/weeks/${week.id}`)
  await loadWeeks()
}

// ─── 과제 CRUD ───────────────────────────────────────────────────────────

function openCreateAssign(weekId: string) {
  assignWeekId.value = weekId
  editingAssignment.value = null
  assignForm.value = { title: '', description: '', dueDate: '' }
  showAssignModal.value = true
}

function openEditAssign(weekId: string, assign: Assignment) {
  assignWeekId.value = weekId
  editingAssignment.value = assign
  assignForm.value = {
    title: assign.title,
    description: assign.description ?? '',
    dueDate: assign.dueDate ? assign.dueDate.slice(0, 10) : '',
  }
  showAssignModal.value = true
}

async function saveAssignment() {
  assignLoading.value = true
  try {
    const payload = {
      title: assignForm.value.title,
      description: assignForm.value.description || undefined,
      dueDate: assignForm.value.dueDate ? new Date(assignForm.value.dueDate).toISOString() : undefined,
    }
    if (editingAssignment.value) {
      await authPatch(`/workspaces/${workspaceId.value}/study/assignments/${editingAssignment.value.id}`, payload)
    }
    else {
      await authPost(`/workspaces/${workspaceId.value}/study/weeks/${assignWeekId.value}/assignments`, payload)
    }
    showAssignModal.value = false
    await loadWeeks()
  }
  catch (e: unknown) { const err = e as { data?: { message?: string } }; toast.error(err?.data?.message || '저장 실패') }
  finally { assignLoading.value = false }
}

async function deleteAssignment(assignId: string) {
  if (!confirm('과제를 삭제하시겠습니까?')) return
  await authDel(`/workspaces/${workspaceId.value}/study/assignments/${assignId}`)
  await loadWeeks()
}

// ─── 과제 제출 ───────────────────────────────────────────────────────────

function openSubmit(assignId: string) {
  submitAssignmentId.value = assignId
  const existing = mySubmissions.value.get(assignId)
  submitForm.value = {
    proofUrl: '',
    content: existing?.status ? '' : '',
  }
  showSubmitModal.value = true
}

async function submitAssignment() {
  submitLoading.value = true
  try {
    await authPost(
      `/workspaces/${workspaceId.value}/study/assignments/${submitAssignmentId.value}/submissions/mine`,
      {
        proofUrl: submitForm.value.proofUrl || undefined,
        content: submitForm.value.content || undefined,
      },
    )
    showSubmitModal.value = false
    await loadWeeks()
  }
  catch (e: unknown) { const err = e as { data?: { message?: string } }; toast.error(err?.data?.message || '제출 실패') }
  finally { submitLoading.value = false }
}

// ─── 유틸 ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null) {
  if (!dateStr) return ''
  return formatDateShort(dateStr)
}

function toggleWeek(id: string) {
  if (expandedWeeks.value.has(id)) expandedWeeks.value.delete(id)
  else expandedWeeks.value.add(id)
}

function submissionRate(assign: Assignment) {
  return `${assign.submissions.length}/${memberCount.value}`
}

function isOverdue(dueDate: string | null) {
  if (!dueDate) return false
  return new Date(dueDate) < new Date()
}
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <!-- 헤더 -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-xl font-bold text-foreground">커리큘럼</h1>
        <p class="text-sm text-muted-foreground mt-0.5">주차별 학습 목표와 과제를 관리합니다</p>
      </div>
      <button
        v-if="isAdmin"
        class="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition"
        @click="openCreateWeek"
      >
        <Icon icon="heroicons:plus" class="w-4 h-4" />
        주차 추가
      </button>
    </div>

    <!-- 로딩 -->
    <div v-if="loading" class="flex justify-center py-16">
      <Icon icon="heroicons:arrow-path" class="w-6 h-6 animate-spin text-muted-foreground" />
    </div>

    <!-- 빈 상태 -->
    <div
      v-else-if="weeks.length === 0"
      class="flex flex-col items-center justify-center py-20 text-center"
    >
      <Icon icon="heroicons:academic-cap" class="w-12 h-12 text-muted-foreground opacity-30 mb-3" />
      <p class="text-sm font-medium text-muted-foreground">아직 주차가 없습니다</p>
      <p v-if="isAdmin" class="text-xs text-muted-foreground mt-1">
        위의 "주차 추가" 버튼으로 커리큘럼을 시작하세요
      </p>
    </div>

    <!-- 주차 목록 -->
    <div v-else class="space-y-3">
      <div
        v-for="week in weeks"
        :key="week.id"
        class="border border-border rounded-xl bg-card overflow-hidden"
      >
        <!-- 주차 헤더 -->
        <div
          class="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-accent/30 transition-colors select-none"
          @click="toggleWeek(week.id)"
        >
          <div class="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
            <span class="text-xs font-bold text-primary">{{ week.weekNumber }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-sm font-semibold text-foreground truncate">{{ week.title }}</h3>
            <div class="flex items-center gap-2 mt-0.5">
              <span v-if="week.startDate || week.endDate" class="text-xs text-muted-foreground">
                {{ formatDate(week.startDate) }}{{ week.endDate ? ' ~ ' + formatDate(week.endDate) : '' }}
              </span>
              <span class="text-xs text-muted-foreground">
                과제 {{ week.assignments.length }}개
              </span>
            </div>
          </div>

          <!-- ADMIN 액션 -->
          <div v-if="isAdmin" class="flex items-center gap-1 flex-shrink-0" @click.stop>
            <button
              class="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title="주차 편집"
              @click="openEditWeek(week)"
            >
              <Icon icon="heroicons:pencil" class="w-3.5 h-3.5" />
            </button>
            <button
              class="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="주차 삭제"
              @click="deleteWeek(week)"
            >
              <Icon icon="heroicons:trash" class="w-3.5 h-3.5" />
            </button>
          </div>

          <Icon
            :icon="expandedWeeks.has(week.id) ? 'heroicons:chevron-up' : 'heroicons:chevron-down'"
            class="w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform"
          />
        </div>

        <!-- 펼쳐진 내용 -->
        <div v-if="expandedWeeks.has(week.id)" class="border-t border-border">
          <!-- 학습 목표 -->
          <div v-if="week.goal" class="px-4 py-3 bg-muted/20">
            <p class="text-xs text-muted-foreground font-medium mb-1">학습 목표</p>
            <p class="text-sm text-foreground">{{ week.goal }}</p>
          </div>

          <!-- 과제 목록 -->
          <div class="divide-y divide-border">
            <div
              v-for="assign in week.assignments"
              :key="assign.id"
              class="px-4 py-3 flex items-start gap-3"
            >
              <!-- 제출 상태 아이콘 -->
              <div class="flex-shrink-0 mt-0.5">
                <div
                  v-if="mySubmissions.has(assign.id)"
                  class="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
                >
                  <Icon icon="heroicons:check" class="w-3 h-3 text-green-600 dark:text-green-400" />
                </div>
                <div
                  v-else
                  class="w-5 h-5 rounded-full border-2 border-dashed"
                  :class="isOverdue(assign.dueDate) ? 'border-destructive' : 'border-muted-foreground/30'"
                />
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-foreground leading-snug">{{ assign.title }}</p>
                    <p v-if="assign.description" class="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {{ assign.description }}
                    </p>
                    <div class="flex items-center gap-2 mt-1">
                      <span
                        v-if="assign.dueDate"
                        class="text-xs"
                        :class="isOverdue(assign.dueDate) ? 'text-destructive' : 'text-muted-foreground'"
                      >
                        마감: {{ formatDate(assign.dueDate) }}
                      </span>
                      <span class="text-xs text-muted-foreground">
                        제출 {{ submissionRate(assign) }}
                      </span>
                    </div>
                  </div>

                  <div class="flex items-center gap-1 flex-shrink-0">
                    <!-- 제출 버튼 -->
                    <button
                      class="px-2.5 py-1 text-xs rounded-md transition-colors"
                      :class="mySubmissions.has(assign.id)
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200'
                        : 'bg-primary/10 text-primary hover:bg-primary/20'"
                      @click="openSubmit(assign.id)"
                    >
                      {{ mySubmissions.has(assign.id) ? '수정' : '제출' }}
                    </button>

                    <!-- ADMIN 과제 편집/삭제 -->
                    <template v-if="isAdmin">
                      <button
                        class="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        @click="openEditAssign(week.id, assign)"
                      >
                        <Icon icon="heroicons:pencil" class="w-3 h-3" />
                      </button>
                      <button
                        class="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        @click="deleteAssignment(assign.id)"
                      >
                        <Icon icon="heroicons:trash" class="w-3 h-3" />
                      </button>
                    </template>
                  </div>
                </div>
              </div>
            </div>

            <!-- 과제 추가 버튼 (ADMIN) -->
            <div v-if="isAdmin" class="px-4 py-2.5">
              <button
                class="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                @click="openCreateAssign(week.id)"
              >
                <Icon icon="heroicons:plus" class="w-3.5 h-3.5" />
                과제 추가
              </button>
            </div>

            <!-- 과제 없음 -->
            <div v-if="week.assignments.length === 0 && !isAdmin" class="px-4 py-4 text-center">
              <p class="text-xs text-muted-foreground">아직 과제가 없습니다</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ── 주차 생성/수정 모달 ──────────────────────────────────────────────── -->
  <Teleport to="body">
    <div
      v-if="showWeekModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      @click.self="showWeekModal = false"
    >
      <div class="bg-card border border-border rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div class="flex items-center justify-between mb-5">
          <h3 class="text-base font-semibold">{{ editingWeek ? '주차 수정' : '주차 추가' }}</h3>
          <button class="text-muted-foreground hover:text-foreground" @click="showWeekModal = false">
            <Icon icon="heroicons:x-mark" class="w-5 h-5" />
          </button>
        </div>

        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-muted-foreground mb-1.5">주차 번호</label>
              <input
                v-model.number="weekForm.weekNumber"
                type="number"
                min="1"
                class="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-muted-foreground mb-1.5">제목 <span class="text-destructive">*</span></label>
              <input
                v-model="weekForm.title"
                type="text"
                placeholder="예: 1주차: TypeScript 기초"
                class="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-muted-foreground mb-1.5">학습 목표</label>
            <textarea
              v-model="weekForm.goal"
              rows="2"
              placeholder="이번 주차에 달성할 목표를 적어주세요"
              class="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-muted-foreground mb-1.5">시작일</label>
              <input
                v-model="weekForm.startDate"
                type="date"
                class="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-muted-foreground mb-1.5">종료일</label>
              <input
                v-model="weekForm.endDate"
                type="date"
                class="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-6">
          <button
            class="px-4 py-2 text-sm border border-border rounded-lg hover:bg-accent transition"
            @click="showWeekModal = false"
          >
            취소
          </button>
          <button
            :disabled="!weekForm.title.trim() || weekLoading"
            class="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition"
            @click="saveWeek"
          >
            {{ weekLoading ? '저장 중...' : '저장' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- ── 과제 생성/수정 모달 ──────────────────────────────────────────────── -->
  <Teleport to="body">
    <div
      v-if="showAssignModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      @click.self="showAssignModal = false"
    >
      <div class="bg-card border border-border rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div class="flex items-center justify-between mb-5">
          <h3 class="text-base font-semibold">{{ editingAssignment ? '과제 수정' : '과제 추가' }}</h3>
          <button class="text-muted-foreground hover:text-foreground" @click="showAssignModal = false">
            <Icon icon="heroicons:x-mark" class="w-5 h-5" />
          </button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-muted-foreground mb-1.5">과제 제목 <span class="text-destructive">*</span></label>
            <input
              v-model="assignForm.title"
              type="text"
              placeholder="과제 내용을 간단히 작성하세요"
              class="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-muted-foreground mb-1.5">상세 설명</label>
            <textarea
              v-model="assignForm.description"
              rows="3"
              placeholder="과제에 대한 추가 설명 (선택사항)"
              class="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-muted-foreground mb-1.5">제출 마감일</label>
            <input
              v-model="assignForm.dueDate"
              type="date"
              class="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-6">
          <button
            class="px-4 py-2 text-sm border border-border rounded-lg hover:bg-accent transition"
            @click="showAssignModal = false"
          >
            취소
          </button>
          <button
            :disabled="!assignForm.title.trim() || assignLoading"
            class="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition"
            @click="saveAssignment"
          >
            {{ assignLoading ? '저장 중...' : '저장' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- ── 과제 제출 모달 ────────────────────────────────────────────────────── -->
  <Teleport to="body">
    <div
      v-if="showSubmitModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      @click.self="showSubmitModal = false"
    >
      <div class="bg-card border border-border rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div class="flex items-center justify-between mb-5">
          <h3 class="text-base font-semibold">과제 제출</h3>
          <button class="text-muted-foreground hover:text-foreground" @click="showSubmitModal = false">
            <Icon icon="heroicons:x-mark" class="w-5 h-5" />
          </button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-muted-foreground mb-1.5">증거 링크 (PR, 블로그, GitHub 등)</label>
            <input
              v-model="submitForm.proofUrl"
              type="url"
              placeholder="https://github.com/..."
              class="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-muted-foreground mb-1.5">인증 내용 (선택)</label>
            <textarea
              v-model="submitForm.content"
              rows="3"
              placeholder="학습 내용을 간단히 정리해보세요"
              class="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-6">
          <button
            class="px-4 py-2 text-sm border border-border rounded-lg hover:bg-accent transition"
            @click="showSubmitModal = false"
          >
            취소
          </button>
          <button
            :disabled="(!submitForm.proofUrl && !submitForm.content) || submitLoading"
            class="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition"
            @click="submitAssignment"
          >
            {{ submitLoading ? '제출 중...' : '제출' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
