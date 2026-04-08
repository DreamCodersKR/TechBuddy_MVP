<script setup lang="ts">
import { Icon } from '@iconify/vue'

const route = useRoute()
const authStore = useAuthStore()

const navItems = [
  { label: '대시보드', icon: 'heroicons:chart-bar', path: '/admin' },
  { label: '유저 관리', icon: 'heroicons:users', path: '/admin/users' },
  { label: '문의 처리', icon: 'heroicons:inbox', path: '/admin/inquiries' },
  { label: '신고 처리', icon: 'heroicons:flag', path: '/admin/reports' },
]

function isActive(path: string) {
  if (path === '/admin') return route.path === '/admin'
  return route.path.startsWith(path)
}
</script>

<template>
  <div class="min-h-screen bg-muted/30 flex">
    <!-- 사이드바 -->
    <aside class="w-56 bg-background border-r border-border flex flex-col fixed top-0 left-0 h-full z-30">
      <div class="px-4 py-5 border-b border-border">
        <NuxtLink to="/" class="text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors">FLOWIT</NuxtLink>
        <p class="text-sm font-bold text-foreground mt-0.5">관리자 콘솔</p>
      </div>

      <nav class="flex-1 px-3 py-4 space-y-1">
        <NuxtLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors"
          :class="isActive(item.path)
            ? 'bg-primary/10 text-primary font-medium'
            : 'text-muted-foreground hover:bg-accent hover:text-foreground'"
        >
          <Icon :icon="item.icon" class="w-4 h-4 flex-shrink-0" />
          {{ item.label }}
        </NuxtLink>
      </nav>

      <div class="px-4 py-4 border-t border-border">
        <p class="text-xs text-muted-foreground truncate">{{ authStore.currentUser?.email }}</p>
        <p class="text-xs font-medium text-foreground mt-0.5">{{ authStore.currentUser?.role }}</p>
      </div>
    </aside>

    <!-- 메인 콘텐츠 -->
    <main class="flex-1 ml-56 min-h-screen">
      <div class="px-6 py-6">
        <slot />
      </div>
    </main>
  </div>
</template>
