<script setup lang="ts">
import { Icon } from '@iconify/vue'

// 앱 레이아웃 - 사이드바 + 메인 콘텐츠
// 로그인 후 진입하는 모든 앱 페이지에서 사용

const route = useRoute()

// 사이드바 메뉴 아이템
const menuItems = [
  {
    label: '홈',
    icon: 'heroicons:home',
    to: '/app',
    exact: true,
  },
  {
    label: '커뮤니티',
    icon: 'heroicons:chat-bubble-left-right',
    to: '/app/community',
    children: [
      { label: '자유게시판', to: '/app/community?board=free' },
      { label: '프로젝트 구인', to: '/app/community?board=project' },
      { label: '취업/진로', to: '/app/community?board=career' },
    ],
  },
  {
    label: '프로젝트',
    icon: 'heroicons:folder',
    to: '/app/projects',
  },
  {
    label: '멘토링',
    icon: 'heroicons:academic-cap',
    to: '/app/mentoring',
    badge: 'Coming Soon',
    disabled: true,
  },
]

const bottomMenuItems = [
  {
    label: '설정',
    icon: 'heroicons:cog-6-tooth',
    to: '/app/settings',
  },
]

// 현재 경로가 메뉴 아이템과 일치하는지 확인
function isActive(item: typeof menuItems[0]) {
  if (item.exact) {
    return route.path === item.to
  }
  return route.path.startsWith(item.to)
}

// 커뮤니티 확장 상태
const isCommunityExpanded = ref(true)

// 사이드바 접힘 상태
const isSidebarCollapsed = ref(false)
</script>

<template>
  <div class="min-h-screen bg-background text-foreground flex">
    <!-- Sidebar -->
    <aside
      class="fixed left-0 top-0 h-full bg-card border-r border-border transition-all duration-300 z-40"
      :class="isSidebarCollapsed ? 'w-16' : 'w-64'"
    >
      <!-- Logo -->
      <div class="h-16 flex items-center px-4 border-b border-border">
        <NuxtLink to="/app" class="flex items-center gap-2">
          <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-bold text-sm text-primary-foreground">
            FL
          </div>
          <span v-if="!isSidebarCollapsed" class="font-semibold">FLOWIT</span>
        </NuxtLink>
      </div>

      <!-- Main Menu -->
      <nav class="p-3 space-y-1">
        <template v-for="item in menuItems" :key="item.to">
          <!-- 일반 메뉴 아이템 -->
          <template v-if="!item.children">
            <NuxtLink
              v-if="!item.disabled"
              :to="item.to"
              class="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
              :class="isActive(item) ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'"
            >
              <Icon :icon="item.icon" class="w-5 h-5 flex-shrink-0" />
              <span v-if="!isSidebarCollapsed">{{ item.label }}</span>
              <span
                v-if="item.badge && !isSidebarCollapsed"
                class="ml-auto text-xs px-2 py-0.5 bg-muted rounded text-muted-foreground"
              >
                {{ item.badge }}
              </span>
            </NuxtLink>
            <div
              v-else
              class="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground/50 cursor-not-allowed"
            >
              <Icon :icon="item.icon" class="w-5 h-5 flex-shrink-0" />
              <span v-if="!isSidebarCollapsed">{{ item.label }}</span>
              <span
                v-if="item.badge && !isSidebarCollapsed"
                class="ml-auto text-xs px-2 py-0.5 bg-muted rounded text-muted-foreground"
              >
                {{ item.badge }}
              </span>
            </div>
          </template>

          <!-- 확장 가능한 메뉴 (커뮤니티) -->
          <template v-else>
            <button
              class="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
              :class="isActive(item) ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'"
              @click="isCommunityExpanded = !isCommunityExpanded"
            >
              <Icon :icon="item.icon" class="w-5 h-5 flex-shrink-0" />
              <span v-if="!isSidebarCollapsed" class="flex-1 text-left">{{ item.label }}</span>
              <Icon
                v-if="!isSidebarCollapsed"
                icon="heroicons:chevron-down"
                class="w-4 h-4 transition-transform"
                :class="isCommunityExpanded ? 'rotate-180' : ''"
              />
            </button>
            <!-- 하위 메뉴 -->
            <div
              v-if="isCommunityExpanded && !isSidebarCollapsed"
              class="ml-4 pl-4 border-l border-border space-y-1 mt-1"
            >
              <NuxtLink
                v-for="child in item.children"
                :key="child.to"
                :to="child.to"
                class="block px-3 py-1.5 rounded-lg text-sm transition-colors"
                :class="route.fullPath === child.to ? 'text-foreground bg-accent' : 'text-muted-foreground hover:text-foreground'"
              >
                {{ child.label }}
              </NuxtLink>
            </div>
          </template>
        </template>
      </nav>

      <!-- Bottom Menu -->
      <div class="absolute bottom-0 left-0 right-0 p-3 border-t border-border">
        <NuxtLink
          v-for="item in bottomMenuItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
          :class="isActive(item) ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'"
        >
          <Icon :icon="item.icon" class="w-5 h-5 flex-shrink-0" />
          <span v-if="!isSidebarCollapsed">{{ item.label }}</span>
        </NuxtLink>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div
      class="flex-1 transition-all duration-300"
      :class="isSidebarCollapsed ? 'ml-16' : 'ml-64'"
    >
      <!-- Top Bar -->
      <header class="h-16 bg-card/50 backdrop-blur-md border-b border-border flex items-center justify-between px-6 sticky top-0 z-30">
        <!-- Left: Toggle & Breadcrumb -->
        <div class="flex items-center gap-4">
          <button
            class="p-2 rounded-lg hover:bg-accent transition-colors"
            @click="isSidebarCollapsed = !isSidebarCollapsed"
          >
            <Icon icon="heroicons:bars-3" class="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <!-- Right: Actions -->
        <div class="flex items-center gap-4">
          <!-- Search -->
          <button class="p-2 rounded-lg hover:bg-accent transition-colors">
            <Icon icon="heroicons:magnifying-glass" class="w-5 h-5 text-muted-foreground" />
          </button>
          <!-- Notifications -->
          <button class="p-2 rounded-lg hover:bg-accent transition-colors relative">
            <Icon icon="heroicons:bell" class="w-5 h-5 text-muted-foreground" />
            <span class="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
          </button>
          <!-- Profile -->
          <button class="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <Icon icon="heroicons:user" class="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </header>

      <!-- Page Content -->
      <main class="p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
