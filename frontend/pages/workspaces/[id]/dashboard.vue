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

const tasks = ref<Task[]>([])
const members = ref<Member[]>([])
const loading = ref(true)

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
  catch {}
  finally { loading.value = false }
}

// ─── 통계 ─────────────────────────────────────────────────
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

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  URGENT: 'text-red-500',
  HIGH: 'text-orange-500',
  MEDIUM: 'text-blue-500',
  LOW: 'text-slate-400',
}

onMounted(() => { loadData() })
</script>

<template>
  <div class="space-y-6">
    <h2 class="text-xl font-bold text-foreground">
      대시보드
    </h2>

    <!-- 로딩 -->
    <template v-if="loading">
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          v-for="n in 4"
          :key="n"
          class="border border-border rounded-xl p-4 space-y-2"
        >
          <div class="h-3 bg-muted animate-pulse rounded w-1/2" />
          <div class="h-7 bg-muted animate-pulse rounded w-1/3" />
        </div>
      </div>
    </template>

    <template v-else>
      <!-- 통계 카드 -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div class="border border-border rounded-xl p-4 bg-card">
          <p class="text-xs text-muted-foreground mb-1">
            전체 태스크
          </p>
          <p class="text-2xl font-bold text-foreground">
            {{ stats.total }}
          </p>
        </div>
        <div class="border border-border rounded-xl p-4 bg-card">
          <p class="text-xs text-muted-foreground mb-1">
            진행 중
          </p>
          <p class="text-2xl font-bold text-blue-500">
            {{ stats.byStatus.IN_PROGRESS }}
          </p>
        </div>
        <div class="border border-border rounded-xl p-4 bg-card">
          <p class="text-xs text-muted-foreground mb-1">
            완료
          </p>
          <p class="text-2xl font-bold text-green-500">
            {{ stats.byStatus.DONE }}
          </p>
        </div>
        <div
          class="border border-border rounded-xl p-4 bg-card"
          :class="stats.byStatus.HELP > 0 ? 'ring-1 ring-red-500/40' : ''"
        >
          <p class="text-xs text-muted-foreground mb-1">
            도움 필요
          </p>
          <p
            class="text-2xl font-bold"
            :class="stats.byStatus.HELP > 0 ? 'text-red-500' : 'text-foreground'"
          >
            {{ stats.byStatus.HELP }}
          </p>
        </div>
      </div>

      <!-- 진행률 바 -->
      <div class="border border-border rounded-xl p-5 bg-card">
        <div class="flex items-center justify-between mb-3">
          <p class="text-sm font-semibold text-foreground">
            전체 진행률
          </p>
          <p class="text-sm font-bold text-foreground">
            {{ stats.progress }}%
          </p>
        </div>
        <div class="w-full h-3 bg-muted rounded-full overflow-hidden">
          <div
            class="h-full bg-primary rounded-full transition-all duration-500"
            :style="{ width: `${stats.progress}%` }"
          />
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
            <Icon
              icon="heroicons:exclamation-triangle"
              class="w-4 h-4 text-red-500"
            />
            <p class="text-sm font-semibold text-foreground">
              도움 요청 태스크
            </p>
            <span class="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-1.5 py-0.5 rounded-full">
              {{ helpTasks.length }}
            </span>
          </div>

          <div
            v-if="helpTasks.length === 0"
            class="text-xs text-muted-foreground py-4 text-center"
          >
            도움 요청이 없습니다 🎉
          </div>
          <div
            v-else
            class="space-y-2"
          >
            <div
              v-for="task in helpTasks.slice(0, 5)"
              :key="task.id"
              class="flex items-start gap-2 p-2 rounded-lg hover:bg-accent/30 transition-colors cursor-pointer"
              @click="navigateTo(`/workspaces/${workspaceId}`)"
            >
              <Icon
                icon="heroicons:flag"
                class="w-3.5 h-3.5 flex-shrink-0 mt-0.5"
                :class="PRIORITY_COLOR[task.priority]"
              />
              <div class="min-w-0">
                <p class="text-xs font-medium text-foreground line-clamp-1">
                  {{ task.title }}
                </p>
                <p
                  v-if="task.assignee"
                  class="text-xs text-muted-foreground"
                >
                  {{ task.assignee.nickname ?? task.assignee.name }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- 멤버 목록 -->
        <div class="border border-border rounded-xl p-5 bg-card">
          <div class="flex items-center justify-between mb-4">
            <p class="text-sm font-semibold text-foreground">
              팀 멤버
            </p>
            <span class="text-xs text-muted-foreground">{{ members.length }}명</span>
          </div>
          <div class="space-y-2">
            <div
              v-for="m in members"
              :key="m.user.id"
              class="flex items-center gap-2"
            >
              <div class="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium overflow-hidden flex-shrink-0">
                <img
                  v-if="m.user.avatarUrl"
                  :src="m.user.avatarUrl"
                  class="h-full w-full object-cover"
                >
                <span v-else>{{ (m.user.nickname ?? m.user.name).slice(0, 1) }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-medium text-foreground truncate">
                  {{ m.user.nickname ?? m.user.name }}
                </p>
              </div>
              <span class="text-xs text-muted-foreground flex-shrink-0">
                {{ m.role === 'ADMIN' ? '관리자' : m.role === 'MENTOR' ? '멘토' : '멤버' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
