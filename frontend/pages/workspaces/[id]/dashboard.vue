<script setup lang="ts">
import { Icon } from '@iconify/vue'

definePageMeta({ layout: 'workspace', middleware: 'auth' })
useHead({ title: '대시보드 - FLOWIT' })

const route = useRoute()
const workspaceId = route.params.id as string
const { get: authGet } = useAuthFetch()

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'HELP' | 'DONE'
type TaskPriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'

interface Task {
  id: string
  title: string
  status: TaskStatus
  priority: TaskPriority
  dueDate: string | null
  assignee: { id: string, name: string, nickname: string | null, avatarUrl: string | null } | null
  createdBy: { id: string, name: string, nickname: string | null }
}

interface Member {
  role: string
  user: { id: string, name: string, nickname: string | null, avatarUrl: string | null }
}

interface TilItem {
  id: string
  title: string
  date: string
  author: { id: string, name: string, nickname: string | null, avatarUrl: string | null }
}

interface Assignment {
  id: string
  title: string
  dueDate: string | null
  submissions: { userId: string, status: string, submittedAt: string }[]
}

interface StudyWeek {
  id: string
  weekNumber: number
  title: string
  startDate: string | null
  endDate: string | null
  assignments: Assignment[]
}

const workspaceType = ref<'PROJECT' | 'STUDY' | null>(null)
const tasks = ref<Task[]>([])
const members = ref<Member[]>([])
const recentTils = ref<TilItem[]>([])
const studyWeeks = ref<StudyWeek[]>([])
const loading = ref(true)

async function loadData() {
  loading.value = true
  try {
    const ws = await authGet<{ id: string, type: string }>(`/workspaces/${workspaceId}`)
    workspaceType.value = ws.type as 'PROJECT' | 'STUDY'

    if (ws.type === 'PROJECT') {
      const [taskRes, memberRes] = await Promise.all([
        authGet<Task[]>(`/workspaces/${workspaceId}/tasks`),
        authGet<Member[]>(`/workspaces/${workspaceId}/members`),
      ])
      tasks.value = taskRes
      members.value = memberRes
    }
    else {
      const [memberRes, tilRes, weeksRes] = await Promise.all([
        authGet<Member[]>(`/workspaces/${workspaceId}/members`),
        authGet<{ items: TilItem[] }>(`/tils?workspaceId=${workspaceId}&limit=30`).catch(() => ({ items: [] })),
        authGet<StudyWeek[]>(`/workspaces/${workspaceId}/study/weeks`).catch(() => []),
      ])
      members.value = memberRes
      recentTils.value = tilRes.items ?? []
      studyWeeks.value = weeksRes ?? []
    }
  }
  catch {}
  finally { loading.value = false }
}

// ─── PROJECT 전용 computed ────────────────────────────────
const stats = computed(() => {
  const total = tasks.value.length
  const byStatus = {
    TODO: tasks.value.filter(t => t.status === 'TODO').length,
    IN_PROGRESS: tasks.value.filter(t => t.status === 'IN_PROGRESS').length,
    REVIEW: tasks.value.filter(t => t.status === 'REVIEW').length,
    HELP: tasks.value.filter(t => t.status === 'HELP').length,
    DONE: tasks.value.filter(t => t.status === 'DONE').length,
  }
  const progress = total > 0 ? Math.round((byStatus.DONE / total) * 100) : 0
  return { total, byStatus, progress }
})

const helpTasks = computed(() => tasks.value.filter(t => t.status === 'HELP'))

const memberStats = computed(() =>
  members.value.map((m) => {
    const myTasks = tasks.value.filter(t => t.assignee?.id === m.user.id)
    const done = myTasks.filter(t => t.status === 'DONE').length
    return { member: m, total: myTasks.length, done }
  }),
)

const dueSoonTasks = computed(() => {
  const now = Date.now()
  const limit = 7 * 24 * 60 * 60 * 1000
  return tasks.value
    .filter((t) => {
      if (!t.dueDate || t.status === 'DONE') return false
      const diff = new Date(t.dueDate).getTime() - now
      return diff >= 0 && diff <= limit
    })
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
})

function dueDaysLabel(dueDate: string) {
  const diff = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'D-Day'
  return `D-${diff}`
}

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  URGENT: 'text-red-500',
  HIGH: 'text-orange-500',
  MEDIUM: 'text-blue-500',
  LOW: 'text-slate-400',
}

// ─── STUDY 전용 computed ──────────────────────────────────
function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const studyStats = computed(() => {
  const today = todayStr()

  // 오늘 TIL 작성자 수
  const todayTilAuthors = new Set(
    recentTils.value
      .filter(t => t.date.slice(0, 10) === today)
      .map(t => t.author.id),
  )

  // 현재 진행 주차 (오늘 날짜가 startDate~endDate 사이)
  const now = Date.now()
  const currentWeek = studyWeeks.value.find((w) => {
    if (!w.startDate || !w.endDate) return false
    return new Date(w.startDate).getTime() <= now && now <= new Date(w.endDate).getTime()
  }) ?? studyWeeks.value[studyWeeks.value.length - 1] ?? null

  // 최근 주차 과제 제출률
  let submissionRate = 0
  let submissionLabel = '-'
  if (currentWeek && currentWeek.assignments.length > 0 && members.value.length > 0) {
    const totalExpected = currentWeek.assignments.length * members.value.length
    const totalSubmitted = currentWeek.assignments.reduce((acc, a) => acc + a.submissions.length, 0)
    submissionRate = Math.round((totalSubmitted / totalExpected) * 100)
    submissionLabel = `${submissionRate}%`
  }

  return {
    memberCount: members.value.length,
    todayTilCount: todayTilAuthors.size,
    totalWeeks: studyWeeks.value.length,
    currentWeek,
    submissionRate,
    submissionLabel,
  }
})

// 이번 주 과제별 제출 현황
const currentWeekAssignments = computed(() => {
  const w = studyStats.value.currentWeek
  if (!w) return []
  return w.assignments.map((a) => {
    const submittedCount = a.submissions.length
    const totalMembers = members.value.length
    const rate = totalMembers > 0 ? Math.round((submittedCount / totalMembers) * 100) : 0
    return { ...a, submittedCount, totalMembers, rate }
  })
})

const studyQuickLinks = computed(() => [
  { label: '커리큘럼', icon: 'heroicons:academic-cap', to: `/workspaces/${workspaceId}/study/curriculum` },
  { label: '과제 현황', icon: 'heroicons:clipboard-document-check', to: `/workspaces/${workspaceId}/study/submissions` },
  { label: 'TIL', icon: 'heroicons:pencil-square', to: `/workspaces/${workspaceId}/til` },
  { label: '자료 모음', icon: 'heroicons:folder-open', to: `/workspaces/${workspaceId}/study/resources` },
  { label: '벌금 관리', icon: 'heroicons:banknotes', to: `/workspaces/${workspaceId}/study/penalty` },
  { label: '멤버', icon: 'heroicons:users', to: `/workspaces/${workspaceId}/members` },
])

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
}

onMounted(() => { loadData() })
</script>

<template>
  <div class="space-y-6">
    <h2 class="text-xl font-bold text-foreground">대시보드</h2>

    <!-- 로딩 -->
    <template v-if="loading">
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div v-for="n in 4" :key="n" class="border border-border rounded-xl p-4 space-y-2">
          <div class="h-3 bg-muted animate-pulse rounded w-1/2" />
          <div class="h-7 bg-muted animate-pulse rounded w-1/3" />
        </div>
      </div>
    </template>

    <!-- ── PROJECT 대시보드 ───────────────────────────────── -->
    <template v-else-if="workspaceType === 'PROJECT'">
      <!-- 통계 카드 -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div class="border border-border rounded-xl p-4 bg-card">
          <p class="text-xs text-muted-foreground mb-1">전체 태스크</p>
          <p class="text-2xl font-bold text-foreground">{{ stats.total }}</p>
        </div>
        <div class="border border-border rounded-xl p-4 bg-card">
          <p class="text-xs text-muted-foreground mb-1">진행 중</p>
          <p class="text-2xl font-bold text-blue-500">{{ stats.byStatus.IN_PROGRESS }}</p>
        </div>
        <div class="border border-border rounded-xl p-4 bg-card">
          <p class="text-xs text-muted-foreground mb-1">완료</p>
          <p class="text-2xl font-bold text-green-500">{{ stats.byStatus.DONE }}</p>
        </div>
        <div
          class="border border-border rounded-xl p-4 bg-card"
          :class="stats.byStatus.HELP > 0 ? 'ring-1 ring-red-500/40' : ''"
        >
          <p class="text-xs text-muted-foreground mb-1">도움 필요</p>
          <p class="text-2xl font-bold" :class="stats.byStatus.HELP > 0 ? 'text-red-500' : 'text-foreground'">
            {{ stats.byStatus.HELP }}
          </p>
        </div>
      </div>

      <!-- 진행률 바 -->
      <div class="border border-border rounded-xl p-5 bg-card">
        <div class="flex items-center justify-between mb-3">
          <p class="text-sm font-semibold text-foreground">전체 진행률</p>
          <p class="text-sm font-bold text-foreground">{{ stats.progress }}%</p>
        </div>
        <div class="w-full h-3 bg-muted rounded-full overflow-hidden">
          <div class="h-full bg-primary rounded-full transition-all duration-500" :style="{ width: `${stats.progress}%` }" />
        </div>
        <div class="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <span>할 일 {{ stats.byStatus.TODO }}</span>
          <span>진행 {{ stats.byStatus.IN_PROGRESS }}</span>
          <span>리뷰 {{ stats.byStatus.REVIEW }}</span>
          <span>완료 {{ stats.byStatus.DONE }}</span>
        </div>
      </div>

      <div class="grid sm:grid-cols-2 gap-4">
        <!-- HELP 태스크 -->
        <div class="border border-border rounded-xl p-5 bg-card">
          <div class="flex items-center gap-2 mb-4">
            <Icon icon="heroicons:exclamation-triangle" class="w-4 h-4 text-red-500" />
            <p class="text-sm font-semibold text-foreground">도움 요청 태스크</p>
            <span class="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-1.5 py-0.5 rounded-full">
              {{ helpTasks.length }}
            </span>
          </div>
          <div v-if="helpTasks.length === 0" class="text-xs text-muted-foreground py-4 text-center">도움 요청이 없습니다 🎉</div>
          <div v-else class="space-y-2">
            <div
              v-for="task in helpTasks.slice(0, 5)"
              :key="task.id"
              class="flex items-start gap-2 p-2 rounded-lg hover:bg-accent/30 transition-colors cursor-pointer"
              @click="navigateTo(`/workspaces/${workspaceId}`)"
            >
              <Icon icon="heroicons:flag" class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" :class="PRIORITY_COLOR[task.priority]" />
              <div class="min-w-0">
                <p class="text-xs font-medium text-foreground line-clamp-1">{{ task.title }}</p>
                <p v-if="task.assignee" class="text-xs text-muted-foreground">{{ task.assignee.nickname ?? task.assignee.name }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 팀 멤버 -->
        <div class="border border-border rounded-xl p-5 bg-card">
          <div class="flex items-center justify-between mb-4">
            <p class="text-sm font-semibold text-foreground">팀 멤버</p>
            <span class="text-xs text-muted-foreground">{{ members.length }}명</span>
          </div>
          <div class="space-y-2">
            <div v-for="m in members" :key="m.user.id" class="flex items-center gap-2">
              <div class="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium overflow-hidden flex-shrink-0">
                <img v-if="m.user.avatarUrl" :src="m.user.avatarUrl" class="h-full w-full object-cover">
                <span v-else>{{ (m.user.nickname ?? m.user.name).slice(0, 1) }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-medium text-foreground truncate">{{ m.user.nickname ?? m.user.name }}</p>
              </div>
              <span class="text-xs text-muted-foreground flex-shrink-0">
                {{ m.role === 'ADMIN' ? '관리자' : m.role === 'MENTOR' ? '멘토' : '멤버' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 멤버별 태스크 배분 -->
      <div class="border border-border rounded-xl p-5 bg-card">
        <div class="flex items-center gap-2 mb-4">
          <Icon icon="heroicons:user-group" class="w-4 h-4 text-muted-foreground" />
          <p class="text-sm font-semibold text-foreground">멤버별 태스크 배분</p>
        </div>
        <div v-if="memberStats.length === 0" class="text-xs text-muted-foreground py-4 text-center">멤버가 없습니다</div>
        <div v-else class="space-y-3">
          <div v-for="ms in memberStats" :key="ms.member.user.id" class="flex items-center gap-3">
            <div class="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium overflow-hidden flex-shrink-0">
              <img v-if="ms.member.user.avatarUrl" :src="ms.member.user.avatarUrl" class="h-full w-full object-cover">
              <span v-else>{{ (ms.member.user.nickname ?? ms.member.user.name).slice(0, 1) }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between mb-1">
                <p class="text-xs font-medium text-foreground truncate">{{ ms.member.user.nickname ?? ms.member.user.name }}</p>
                <span class="text-xs text-muted-foreground flex-shrink-0 ml-2">{{ ms.done }}/{{ ms.total }}</span>
              </div>
              <div class="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  class="h-full bg-primary rounded-full transition-all duration-500"
                  :style="{ width: ms.total > 0 ? `${Math.round(ms.done / ms.total * 100)}%` : '0%' }"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 마감 임박 태스크 -->
      <div class="border border-border rounded-xl p-5 bg-card">
        <div class="flex items-center gap-2 mb-4">
          <Icon icon="heroicons:clock" class="w-4 h-4 text-amber-500" />
          <p class="text-sm font-semibold text-foreground">마감 임박 태스크</p>
          <span class="text-xs text-muted-foreground">(7일 이내)</span>
        </div>
        <div v-if="dueSoonTasks.length === 0" class="text-xs text-muted-foreground py-4 text-center">마감 임박 태스크가 없습니다 ✅</div>
        <div v-else class="space-y-2">
          <div
            v-for="task in dueSoonTasks"
            :key="task.id"
            class="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/30 transition-colors cursor-pointer"
            @click="navigateTo(`/workspaces/${workspaceId}`)"
          >
            <span
              class="text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0"
              :class="dueDaysLabel(task.dueDate!) === 'D-Day'
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'"
            >
              {{ dueDaysLabel(task.dueDate!) }}
            </span>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium text-foreground line-clamp-1">{{ task.title }}</p>
              <p v-if="task.assignee" class="text-xs text-muted-foreground">{{ task.assignee.nickname ?? task.assignee.name }}</p>
            </div>
            <Icon icon="heroicons:flag" class="w-3.5 h-3.5 flex-shrink-0" :class="PRIORITY_COLOR[task.priority]" />
          </div>
        </div>
      </div>
    </template>

    <!-- ── STUDY 대시보드 ─────────────────────────────────── -->
    <template v-else-if="workspaceType === 'STUDY'">
      <!-- 지표 카드 4개 -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <!-- 멤버 수 -->
        <div class="border border-border rounded-xl p-4 bg-card">
          <div class="flex items-center gap-1.5 mb-2">
            <Icon icon="heroicons:users" class="w-4 h-4 text-muted-foreground" />
            <p class="text-xs text-muted-foreground">멤버</p>
          </div>
          <p class="text-2xl font-bold text-foreground">{{ studyStats.memberCount }}<span class="text-sm font-normal text-muted-foreground ml-1">명</span></p>
        </div>

        <!-- 오늘 TIL 작성자 -->
        <div
          class="border border-border rounded-xl p-4 bg-card"
          :class="studyStats.todayTilCount === studyStats.memberCount && studyStats.memberCount > 0 ? 'ring-1 ring-green-500/40' : ''"
        >
          <div class="flex items-center gap-1.5 mb-2">
            <Icon icon="heroicons:pencil-square" class="w-4 h-4 text-muted-foreground" />
            <p class="text-xs text-muted-foreground">오늘 TIL</p>
          </div>
          <p class="text-2xl font-bold" :class="studyStats.todayTilCount > 0 ? 'text-green-500' : 'text-foreground'">
            {{ studyStats.todayTilCount }}
            <span class="text-sm font-normal text-muted-foreground">/{{ studyStats.memberCount }}명</span>
          </p>
        </div>

        <!-- 총 주차 -->
        <div class="border border-border rounded-xl p-4 bg-card">
          <div class="flex items-center gap-1.5 mb-2">
            <Icon icon="heroicons:academic-cap" class="w-4 h-4 text-muted-foreground" />
            <p class="text-xs text-muted-foreground">총 주차</p>
          </div>
          <p class="text-2xl font-bold text-foreground">
            {{ studyStats.totalWeeks }}<span class="text-sm font-normal text-muted-foreground ml-1">주</span>
          </p>
          <p v-if="studyStats.currentWeek" class="text-xs text-primary mt-1">
            현재 {{ studyStats.currentWeek.weekNumber }}주차 진행 중
          </p>
        </div>

        <!-- 이번 주 제출률 -->
        <div class="border border-border rounded-xl p-4 bg-card">
          <div class="flex items-center gap-1.5 mb-2">
            <Icon icon="heroicons:clipboard-document-check" class="w-4 h-4 text-muted-foreground" />
            <p class="text-xs text-muted-foreground">이번 주 제출률</p>
          </div>
          <p
            class="text-2xl font-bold"
            :class="studyStats.submissionRate >= 80 ? 'text-green-500' : studyStats.submissionRate >= 50 ? 'text-amber-500' : 'text-foreground'"
          >
            {{ studyStats.submissionLabel }}
          </p>
        </div>
      </div>

      <!-- 이번 주 과제 현황 -->
      <div v-if="studyStats.currentWeek" class="border border-border rounded-xl p-5 bg-card">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <Icon icon="heroicons:clipboard-document-list" class="w-4 h-4 text-muted-foreground" />
            <p class="text-sm font-semibold text-foreground">
              {{ studyStats.currentWeek.weekNumber }}주차 과제 현황
            </p>
            <span class="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {{ studyStats.currentWeek.title }}
            </span>
          </div>
          <NuxtLink
            :to="`/workspaces/${workspaceId}/study/submissions`"
            class="text-xs text-primary hover:underline"
          >
            전체 보기
          </NuxtLink>
        </div>
        <div v-if="currentWeekAssignments.length === 0" class="text-xs text-muted-foreground py-3 text-center">
          등록된 과제가 없습니다
        </div>
        <div v-else class="space-y-3">
          <div v-for="a in currentWeekAssignments" :key="a.id">
            <div class="flex items-center justify-between mb-1">
              <p class="text-xs font-medium text-foreground truncate flex-1 mr-2">{{ a.title }}</p>
              <span class="text-xs text-muted-foreground flex-shrink-0">
                {{ a.submittedCount }}/{{ a.totalMembers }}명 제출
              </span>
            </div>
            <div class="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-500"
                :class="a.rate >= 80 ? 'bg-green-500' : a.rate >= 50 ? 'bg-amber-500' : 'bg-primary'"
                :style="{ width: `${a.rate}%` }"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="grid sm:grid-cols-2 gap-4">
        <!-- 팀 멤버 -->
        <div class="border border-border rounded-xl p-5 bg-card">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <Icon icon="heroicons:users" class="w-4 h-4 text-muted-foreground" />
              <p class="text-sm font-semibold text-foreground">팀 멤버</p>
            </div>
            <span class="text-xs text-muted-foreground">{{ members.length }}명</span>
          </div>
          <div class="space-y-2">
            <div v-for="m in members" :key="m.user.id" class="flex items-center gap-2">
              <div class="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium overflow-hidden flex-shrink-0">
                <img v-if="m.user.avatarUrl" :src="m.user.avatarUrl" class="h-full w-full object-cover">
                <span v-else>{{ (m.user.nickname ?? m.user.name).slice(0, 1) }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-medium text-foreground truncate">{{ m.user.nickname ?? m.user.name }}</p>
              </div>
              <span class="text-xs text-muted-foreground flex-shrink-0">
                {{ m.role === 'ADMIN' ? '관리자' : m.role === 'MENTOR' ? '멘토' : '멤버' }}
              </span>
            </div>
          </div>
        </div>

        <!-- 최근 TIL -->
        <div class="border border-border rounded-xl p-5 bg-card">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <Icon icon="heroicons:pencil-square" class="w-4 h-4 text-muted-foreground" />
              <p class="text-sm font-semibold text-foreground">최근 TIL</p>
            </div>
            <NuxtLink :to="`/workspaces/${workspaceId}/til`" class="text-xs text-primary hover:underline">
              전체 보기
            </NuxtLink>
          </div>
          <div v-if="recentTils.length === 0" class="text-xs text-muted-foreground py-4 text-center">
            아직 작성된 TIL이 없습니다
          </div>
          <div v-else class="space-y-2">
            <NuxtLink
              v-for="til in recentTils.slice(0, 5)"
              :key="til.id"
              :to="`/workspaces/${workspaceId}/til/${til.id}`"
              class="flex items-start gap-2 p-2 rounded-lg hover:bg-accent/30 transition-colors"
            >
              <div class="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium overflow-hidden flex-shrink-0 mt-0.5">
                <img v-if="til.author.avatarUrl" :src="til.author.avatarUrl" class="h-full w-full object-cover">
                <span v-else>{{ (til.author.nickname ?? til.author.name).slice(0, 1) }}</span>
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-xs font-medium text-foreground line-clamp-1">{{ til.title }}</p>
                <p class="text-xs text-muted-foreground">
                  {{ til.author.nickname ?? til.author.name }} · {{ formatDate(til.date) }}
                </p>
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- 빠른 이동 -->
      <div>
        <p class="text-sm font-semibold text-foreground mb-3">빠른 이동</p>
        <div class="grid grid-cols-3 sm:grid-cols-6 gap-3">
          <NuxtLink
            v-for="link in studyQuickLinks"
            :key="link.to"
            :to="link.to"
            class="flex flex-col items-center gap-2 p-3 border border-border rounded-xl bg-card hover:border-primary/40 hover:bg-accent/30 transition-colors"
          >
            <div class="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon :icon="link.icon" class="w-5 h-5 text-primary" />
            </div>
            <span class="text-xs font-medium text-foreground">{{ link.label }}</span>
          </NuxtLink>
        </div>
      </div>
    </template>
  </div>
</template>
