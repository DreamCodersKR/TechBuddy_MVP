<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const route = useRoute()
const authStore = useAuthStore()
const { get: authGet } = useAuthFetch()

const workspaceId = computed(() => route.params.id as string)

// 워크스페이스 이름 로드
interface WorkspaceBasic { id: string, name: string, type: string }
const workspace = ref<WorkspaceBasic | null>(null)

watch(workspaceId, async (id) => {
  if (!id) return
  try {
    workspace.value = await authGet<WorkspaceBasic>(`/workspaces/${id}`)
  }
  catch { workspace.value = null }
}, { immediate: true })

const sidebarItems = computed(() => {
  const isStudy = workspace.value?.type === 'STUDY'
  const base = `/workspaces/${workspaceId.value}`
  const items = [
    {
      label: '대시보드',
      icon: 'heroicons:chart-bar',
      to: `${base}/dashboard`,
    },
    // ── PROJECT 전용 ──────────────────────────
    ...(!isStudy ? [
      {
        label: '칸반 보드',
        icon: 'heroicons:view-columns',
        to: base,
        exact: true,
      },
      {
        label: '태스크 목록',
        icon: 'heroicons:list-bullet',
        to: `${base}/tasks`,
      },
      {
        label: '스프린트',
        icon: 'heroicons:bolt',
        to: `${base}/sprints`,
      },
    ] : []),
    // ── STUDY 전용 ────────────────────────────
    ...(isStudy ? [
      {
        label: '커리큘럼',
        icon: 'heroicons:academic-cap',
        to: `${base}/study/curriculum`,
      },
      {
        label: '과제 현황',
        icon: 'heroicons:clipboard-document-check',
        to: `${base}/study/submissions`,
      },
      {
        label: '자료 모음',
        icon: 'heroicons:folder-open',
        to: `${base}/study/resources`,
      },
      {
        label: '벌금 관리',
        icon: 'heroicons:banknotes',
        to: `${base}/study/penalty`,
      },
      {
        label: 'TIL',
        icon: 'heroicons:pencil-square',
        to: `${base}/til`,
      },
    ] : []),
    // ── 공통 ──────────────────────────────────
    {
      label: '멤버',
      icon: 'heroicons:users',
      to: `${base}/members`,
    },
    ...(!isStudy ? [
      {
        label: '산출문서',
        icon: 'heroicons:folder-open',
        to: `${base}/documents`,
      },
    ] : []),
    {
      label: '설정',
      icon: 'heroicons:cog-6-tooth',
      to: `${base}/settings`,
    },
  ]
  return items
})

const myTasksItem = { label: '내 Task', icon: 'heroicons:clipboard-document-check', to: '/workspaces/my-tasks' }


function isActive(item: (typeof sidebarItems.value)[0]) {
  if (item.exact) return route.path === item.to
  return route.path.startsWith(item.to)
}

const isSidebarCollapsed = ref(false)

// Verified Project 상태
const isVerified = ref(false)
watch(workspaceId, async (id) => {
  if (!id) return
  try {
    const result = await authGet<boolean>(`/portfolio/verified/${id}`)
    isVerified.value = result
  }
  catch { isVerified.value = false }
}, { immediate: true })

const userInitials = computed(() => {
  const user = authStore.currentUser
  if (!user?.nickname) return 'U'
  return user.nickname.slice(0, 2).toUpperCase()
})

async function handleLogout() {
  await authStore.logout()
}
</script>

<template>
  <div class="min-h-screen bg-background flex">
    <!-- Sidebar -->
    <aside
      class="fixed left-0 top-0 h-full bg-card border-r border-border transition-all duration-300 z-40"
      :class="isSidebarCollapsed ? 'w-16' : 'w-56'"
    >
      <!-- Logo -->
      <div class="h-14 flex items-center px-4 border-b border-border">
        <NuxtLink
          to="/"
          class="flex items-center gap-2 min-w-0"
        >
          <div class="flex h-8 w-8 items-center justify-center rounded-md bg-primary flex-shrink-0">
            <Icon
              icon="heroicons:square-3-stack-3d"
              class="h-5 w-5 text-primary-foreground"
            />
          </div>
          <span
            v-if="!isSidebarCollapsed"
            class="font-bold text-sm truncate"
          >FLOWIT</span>
        </NuxtLink>
      </div>

      <!-- Back + Workspace Name -->
      <div class="p-3 border-b border-border">
        <NuxtLink
          to="/workspaces"
          class="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <Icon
            icon="heroicons:arrow-left"
            class="h-4 w-4 flex-shrink-0"
          />
          <span v-if="!isSidebarCollapsed">워크스페이스 목록</span>
        </NuxtLink>
        <div
          v-if="!isSidebarCollapsed && workspace"
          class="mt-2 px-2"
        >
          <div class="flex items-center gap-1.5">
            <p class="text-xs font-semibold text-foreground truncate">
              {{ workspace.name }}
            </p>
            <span
              v-if="isVerified && workspace?.type !== 'STUDY'"
              class="flex-shrink-0 flex items-center gap-0.5 text-[10px] px-1 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
            >
              <Icon icon="heroicons:check-badge" class="w-3 h-3" />
              Verified
            </span>
          </div>
          <span class="text-xs text-muted-foreground">
            {{ workspace.type === 'PROJECT' ? '프로젝트' : '스터디' }}
          </span>
        </div>
      </div>

      <!-- Main Menu -->
      <nav class="p-3 space-y-0.5">
        <NuxtLink
          v-for="item in sidebarItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
          :class="isActive(item) ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'"
        >
          <Icon
            :icon="item.icon"
            class="h-4 w-4 flex-shrink-0"
          />
          <span v-if="!isSidebarCollapsed">{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <!-- Bottom: 내 Task(PROJECT) + User Profile -->
      <div class="absolute bottom-0 left-0 right-0 border-t border-border">
        <!-- 내 Task: PROJECT 전용 -->
        <div v-if="workspace?.type !== 'STUDY'" class="px-3 pt-3">
          <NuxtLink
            :to="myTasksItem.to"
            class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors w-full"
            :class="$route.path === myTasksItem.to ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'"
          >
            <Icon :icon="myTasksItem.icon" class="h-4 w-4 flex-shrink-0" />
            <span v-if="!isSidebarCollapsed">{{ myTasksItem.label }}</span>
          </NuxtLink>
        </div>
      <div class="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <button class="flex items-center gap-3 px-3 py-2 rounded-lg w-full hover:bg-accent transition-colors">
              <Avatar class="h-7 w-7 flex-shrink-0">
                <AvatarImage
                  :src="authStore.currentUser?.profileImage"
                  :alt="authStore.currentUser?.nickname"
                />
                <AvatarFallback class="text-xs">
                  {{ userInitials }}
                </AvatarFallback>
              </Avatar>
              <span
                v-if="!isSidebarCollapsed"
                class="text-sm font-medium truncate"
              >
                {{ authStore.currentUser?.nickname }}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            class="w-48"
          >
            <DropdownMenuItem as-child>
              <NuxtLink
                to="/mypage"
                class="cursor-pointer"
              >
                <Icon
                  icon="heroicons:user"
                  class="mr-2 h-4 w-4"
                />
                마이페이지
              </NuxtLink>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              class="cursor-pointer text-destructive"
              @click="handleLogout"
            >
              <Icon
                icon="heroicons:arrow-right-on-rectangle"
                class="mr-2 h-4 w-4"
              />
              로그아웃
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div
      class="flex-1 transition-all duration-300"
      :class="isSidebarCollapsed ? 'ml-16' : 'ml-56'"
    >
      <!-- Top Bar -->
      <header class="h-14 bg-card/50 backdrop-blur-md border-b border-border flex items-center justify-between px-6 sticky top-0 z-30">
        <div class="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            @click="isSidebarCollapsed = !isSidebarCollapsed"
          >
            <Icon
              icon="heroicons:bars-3"
              class="h-5 w-5"
            />
          </Button>
        </div>
        <div class="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
          >
            <Icon
              icon="heroicons:bell"
              class="h-5 w-5"
            />
          </Button>
        </div>
      </header>

      <main class="p-6 overflow-x-auto">
        <slot />
      </main>
    </div>
  </div>
</template>
