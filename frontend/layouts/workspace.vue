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
  const items = [
    {
      label: '대시보드',
      icon: 'heroicons:chart-bar',
      to: `/workspaces/${workspaceId.value}/dashboard`,
    },
    {
      label: '칸반 보드',
      icon: 'heroicons:view-columns',
      to: `/workspaces/${workspaceId.value}`,
      exact: true,
    },
    {
      label: '태스크 목록',
      icon: 'heroicons:list-bullet',
      to: `/workspaces/${workspaceId.value}/tasks`,
    },
    {
      label: '스프린트',
      icon: 'heroicons:bolt',
      to: `/workspaces/${workspaceId.value}/sprints`,
    },
    ...(isStudy ? [{
      label: 'TIL',
      icon: 'heroicons:pencil-square',
      to: `/workspaces/${workspaceId.value}/til`,
    }] : []),
    {
      label: '멤버',
      icon: 'heroicons:users',
      to: `/workspaces/${workspaceId.value}/members`,
    },
    {
      label: '산출문서',
      icon: 'heroicons:folder-open',
      to: `/workspaces/${workspaceId.value}/documents`,
    },
    {
      label: '설정',
      icon: 'heroicons:cog-6-tooth',
      to: `/workspaces/${workspaceId.value}/settings`,
    },
  ]
  return items
})

const myTasksItem = { label: '내 Task', icon: 'heroicons:clipboard-document-check', to: '/workspaces/my-tasks' }

const aiMentorItem = { label: 'AI 멘토', icon: 'heroicons:sparkles', to: '/ai-mentor' }

function isActive(item: (typeof sidebarItems.value)[0]) {
  if (item.exact) return route.path === item.to
  return route.path.startsWith(item.to)
}

const isSidebarCollapsed = ref(false)

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
          <p class="text-xs font-semibold text-foreground truncate">
            {{ workspace.name }}
          </p>
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

      <!-- Bottom: 내 Task + AI 멘토 + User Profile -->
      <div class="absolute bottom-0 left-0 right-0 border-t border-border">
        <!-- 내 Task -->
        <div class="px-3 pt-3">
          <NuxtLink
            :to="myTasksItem.to"
            class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors w-full"
            :class="$route.path === myTasksItem.to ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'"
          >
            <Icon :icon="myTasksItem.icon" class="h-4 w-4 flex-shrink-0" />
            <span v-if="!isSidebarCollapsed">{{ myTasksItem.label }}</span>
          </NuxtLink>
        </div>
        <!-- AI 멘토 -->
        <div class="p-3 border-b border-border">
          <NuxtLink
            :to="aiMentorItem.to"
            class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors w-full"
            :class="$route.path.startsWith('/ai-mentor') ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-medium' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'"
          >
            <Icon :icon="aiMentorItem.icon" class="h-4 w-4 flex-shrink-0 text-violet-500" />
            <span v-if="!isSidebarCollapsed">{{ aiMentorItem.label }}</span>
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
