<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'

definePageMeta({ layout: 'default', middleware: 'auth' })
useHead({ title: '내 Task - FLOWIT' })

const { get: authGet } = useAuthFetch()

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
  project: { id: string, name: string, type: string }
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

const tasks = ref<Task[]>([])
const loading = ref(true)
const filterStatus = ref<TaskStatus | ''>('')
const searchQuery = ref('')

async function loadTasks() {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (filterStatus.value) params.set('status', filterStatus.value)
    tasks.value = await authGet<Task[]>(`/users/me/tasks?${params}`)
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

// 워크스페이스별 그룹핑
const groupedTasks = computed(() => {
  const groups = new Map<string, { project: Task['project'], tasks: Task[] }>()
  for (const task of filtered.value) {
    const pid = task.project.id
    if (!groups.has(pid)) groups.set(pid, { project: task.project, tasks: [] })
    groups.get(pid)!.tasks.push(task)
  }
  return [...groups.values()]
})

onMounted(() => { loadTasks() })
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- 헤더 -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-foreground">
          내 Task
        </h1>
        <p class="text-sm text-muted-foreground mt-1">
          전체 워크스페이스에서 나에게 할당된 태스크
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        @click="navigateTo('/workspaces')"
      >
        <Icon
          icon="heroicons:folder"
          class="w-4 h-4 mr-2"
        />
        워크스페이스 목록
      </Button>
    </div>

    <!-- 필터 -->
    <div class="flex items-center gap-3 mb-6 flex-wrap">
      <input
        v-model="searchQuery"
        placeholder="태스크 검색..."
        class="h-9 px-3 text-sm border border-border rounded-md bg-background w-48 focus:outline-none focus:ring-2 focus:ring-ring"
      >
      <div class="flex gap-1 flex-wrap">
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
    <template v-if="loading">
      <div
        v-for="n in 3"
        :key="n"
        class="mb-6"
      >
        <div class="h-5 w-40 bg-muted animate-pulse rounded mb-3" />
        <div class="border border-border rounded-xl overflow-hidden">
          <div
            v-for="m in 3"
            :key="m"
            class="border-b border-border last:border-0 p-3 flex items-center gap-3"
          >
            <div class="h-4 w-4 bg-muted animate-pulse rounded" />
            <div class="flex-1 h-4 bg-muted animate-pulse rounded w-1/3" />
            <div class="h-5 w-16 bg-muted animate-pulse rounded-full" />
          </div>
        </div>
      </div>
    </template>

    <!-- 태스크 목록 (워크스페이스별 그룹) -->
    <template v-else-if="groupedTasks.length > 0">
      <div
        v-for="group in groupedTasks"
        :key="group.project.id"
        class="mb-8"
      >
        <!-- 워크스페이스 헤더 -->
        <div class="flex items-center gap-2 mb-3">
          <span
            class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
            :class="group.project.type === 'PROJECT'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
              : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'"
          >
            {{ group.project.type === 'PROJECT' ? '프로젝트' : '스터디' }}
          </span>
          <NuxtLink
            :to="`/workspaces/${group.project.id}`"
            class="text-sm font-semibold text-foreground hover:text-primary transition-colors"
          >
            {{ group.project.name }}
          </NuxtLink>
          <span class="text-xs text-muted-foreground">{{ group.tasks.length }}개</span>
        </div>

        <!-- 테이블 -->
        <div class="border border-border rounded-xl overflow-hidden">
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
                  마감일
                </th>
                <th class="w-8" />
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="task in group.tasks"
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
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
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
                  <NuxtLink
                    :to="`/workspaces/${group.project.id}`"
                    class="p-1 text-muted-foreground hover:text-primary transition-colors inline-flex"
                    title="워크스페이스로 이동"
                  >
                    <Icon
                      icon="heroicons:arrow-top-right-on-square"
                      class="w-3.5 h-3.5"
                    />
                  </NuxtLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- 빈 상태 -->
    <div
      v-else
      class="flex flex-col items-center justify-center py-20 text-center border border-border rounded-xl"
    >
      <Icon
        icon="heroicons:clipboard-document-check"
        class="w-10 h-10 text-muted-foreground mb-3"
      />
      <p class="text-sm font-medium text-foreground">
        {{ filterStatus ? `'${STATUS_LABEL[filterStatus as TaskStatus]}' 태스크가 없습니다` : '할당된 태스크가 없습니다' }}
      </p>
      <p class="text-xs text-muted-foreground mt-1">
        워크스페이스에서 태스크를 배정받으면 여기에 표시됩니다
      </p>
    </div>
  </div>
</template>
