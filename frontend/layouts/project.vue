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

// 프로젝트 레이아웃 - 사이드바 + 메인 콘텐츠
// 프로젝트 상세 페이지에서 사용

const route = useRoute()
const authStore = useAuthStore()

// 현재 프로젝트 ID (URL에서 추출)
const projectId = computed(() => route.params.id as string)

// 사이드바 메뉴 아이템
const sidebarItems = computed(() => [
  {
    label: '보드',
    icon: 'heroicons:view-columns',
    to: `/projects/${projectId.value}`,
    exact: true,
  },
  {
    label: '멤버',
    icon: 'heroicons:users',
    to: `/projects/${projectId.value}/members`,
  },
  {
    label: '설정',
    icon: 'heroicons:cog-6-tooth',
    to: `/projects/${projectId.value}/settings`,
  },
])

// 현재 경로가 메뉴 아이템과 일치하는지 확인
function isActive(item: typeof sidebarItems.value[0]) {
  if (item.exact) {
    return route.path === item.to
  }
  return route.path.startsWith(item.to)
}

// 사이드바 접힘 상태
const isSidebarCollapsed = ref(false)

// 사용자 이니셜
const userInitials = computed(() => {
  const user = authStore.currentUser
  if (!user?.nickname) return 'U'
  return user.nickname.slice(0, 2).toUpperCase()
})

// 로그아웃
async function handleLogout() {
  await authStore.logout()
}
</script>

<template>
  <div class="min-h-screen bg-background flex">
    <!-- Sidebar -->
    <aside
      class="fixed left-0 top-0 h-full bg-card border-r border-border transition-all duration-300 z-40"
      :class="isSidebarCollapsed ? 'w-16' : 'w-64'"
    >
      <!-- Logo -->
      <div class="h-14 flex items-center px-4 border-b border-border">
        <NuxtLink to="/" class="flex items-center gap-2">
          <div class="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <Icon icon="heroicons:square-3-stack-3d" class="h-5 w-5 text-primary-foreground" />
          </div>
          <span v-if="!isSidebarCollapsed" class="font-bold">FLOWIT</span>
        </NuxtLink>
      </div>

      <!-- Back to Projects -->
      <div class="p-3 border-b border-border">
        <NuxtLink
          to="/projects"
          class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <Icon icon="heroicons:arrow-left" class="h-4 w-4" />
          <span v-if="!isSidebarCollapsed">프로젝트 목록</span>
        </NuxtLink>
      </div>

      <!-- Main Menu -->
      <nav class="p-3 space-y-1">
        <NuxtLink
          v-for="item in sidebarItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
          :class="isActive(item) ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'"
        >
          <Icon :icon="item.icon" class="h-5 w-5 flex-shrink-0" />
          <span v-if="!isSidebarCollapsed">{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <!-- Bottom: User Profile -->
      <div class="absolute bottom-0 left-0 right-0 p-3 border-t border-border">
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <button
              class="flex items-center gap-3 px-3 py-2 rounded-lg w-full hover:bg-accent transition-colors"
            >
              <Avatar class="h-8 w-8">
                <AvatarImage :src="authStore.currentUser?.profileImage" :alt="authStore.currentUser?.nickname" />
                <AvatarFallback>{{ userInitials }}</AvatarFallback>
              </Avatar>
              <span v-if="!isSidebarCollapsed" class="text-sm font-medium truncate">
                {{ authStore.currentUser?.nickname }}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" class="w-56">
            <DropdownMenuItem as-child>
              <NuxtLink to="/mypage" class="cursor-pointer">
                <Icon icon="heroicons:user" class="mr-2 h-4 w-4" />
                마이페이지
              </NuxtLink>
            </DropdownMenuItem>
            <DropdownMenuItem as-child>
              <NuxtLink to="/settings" class="cursor-pointer">
                <Icon icon="heroicons:cog-6-tooth" class="mr-2 h-4 w-4" />
                설정
              </NuxtLink>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem class="cursor-pointer text-destructive" @click="handleLogout">
              <Icon icon="heroicons:arrow-right-on-rectangle" class="mr-2 h-4 w-4" />
              로그아웃
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div
      class="flex-1 transition-all duration-300"
      :class="isSidebarCollapsed ? 'ml-16' : 'ml-64'"
    >
      <!-- Top Bar -->
      <header class="h-14 bg-card/50 backdrop-blur-md border-b border-border flex items-center justify-between px-6 sticky top-0 z-30">
        <!-- Left: Toggle -->
        <div class="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            @click="isSidebarCollapsed = !isSidebarCollapsed"
          >
            <Icon icon="heroicons:bars-3" class="h-5 w-5" />
          </Button>
        </div>

        <!-- Right: Actions -->
        <div class="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Icon icon="heroicons:bell" class="h-5 w-5" />
          </Button>
        </div>
      </header>

      <!-- Page Content -->
      <main class="p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
