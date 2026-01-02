<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

const route = useRoute()
const authStore = useAuthStore()

// 메인 메뉴 아이템
const menuItems = [
  { label: '커뮤니티', to: '/community' },
  { label: '프로젝트', to: '/projects' },
]

// 현재 경로가 메뉴 아이템과 일치하는지 확인
function isActive(path: string) {
  // 커뮤니티: /community, /qna, /recruit (메인 페이지 제외)
  if (path === '/community') {
    return route.path.startsWith('/community') || route.path.startsWith('/qna') || route.path.startsWith('/recruit')
  }
  return route.path.startsWith(path)
}

// 검색 쿼리
const searchQuery = ref('')

// 검색 실행
function handleSearch() {
  if (searchQuery.value.trim()) {
    navigateTo(`/search?q=${encodeURIComponent(searchQuery.value)}`)
  }
}

// 로그아웃
async function handleLogout() {
  await authStore.logout()
}

// 모바일 메뉴 열림 상태
const isMobileMenuOpen = ref(false)

// 사용자 이니셜 (아바타 폴백용)
const userInitials = computed(() => {
  const user = authStore.currentUser
  if (!user?.nickname) return 'U'
  return user.nickname.slice(0, 2).toUpperCase()
})
</script>

<template>
  <header class="relative z-50 w-full border-b border-border bg-background">
    <div class="container flex h-14 items-center justify-between">
      <!-- Left: Logo + Menu -->
      <div class="flex items-center gap-6">
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center gap-2">
          <div class="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <Icon icon="heroicons:square-3-stack-3d" class="h-5 w-5 text-primary-foreground" />
          </div>
          <span class="font-bold text-lg">FLOWIT</span>
        </NuxtLink>

        <!-- Desktop Menu -->
        <nav class="hidden md:flex items-center gap-6">
          <NuxtLink
            v-for="item in menuItems"
            :key="item.to"
            :to="item.to"
            class="text-sm font-medium transition-colors hover:text-primary"
            :class="isActive(item.to) ? 'text-foreground' : 'text-muted-foreground'"
          >
            {{ item.label }}
          </NuxtLink>
        </nav>
      </div>

      <!-- Right: Search + Auth -->
      <div class="flex items-center gap-4">
        <!-- Search Bar (Desktop) -->
        <form
          class="hidden md:flex items-center"
          @submit.prevent="handleSearch"
        >
          <div class="relative">
            <Icon
              icon="heroicons:magnifying-glass"
              class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              v-model="searchQuery"
              type="search"
              placeholder="검색어를 입력하세요"
              class="w-64 pl-9 h-9"
            />
          </div>
        </form>

        <!-- Search Button (Mobile) -->
        <Button variant="ghost" size="icon" class="md:hidden">
          <Icon icon="heroicons:magnifying-glass" class="h-5 w-5" />
        </Button>

        <!-- Auth Section -->
        <template v-if="authStore.isAuthenticated">
          <!-- Profile Dropdown -->
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" class="relative h-8 w-8 rounded-full">
                <Avatar class="h-8 w-8">
                  <AvatarImage :src="authStore.currentUser?.avatarUrl ?? undefined" :alt="authStore.currentUser?.nickname ?? undefined" />
                  <AvatarFallback>{{ userInitials }}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent class="w-56" align="end">
              <div class="flex items-center gap-2 p-2">
                <Avatar class="h-8 w-8">
                  <AvatarImage :src="authStore.currentUser?.avatarUrl ?? undefined" :alt="authStore.currentUser?.nickname ?? undefined" />
                  <AvatarFallback>{{ userInitials }}</AvatarFallback>
                </Avatar>
                <div class="flex flex-col space-y-0.5">
                  <p class="text-sm font-medium">{{ authStore.currentUser?.nickname }}</p>
                  <p class="text-xs text-muted-foreground">{{ authStore.currentUser?.email }}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem as-child>
                <NuxtLink to="/mypage" class="cursor-pointer">
                  <Icon icon="heroicons:user" class="mr-2 h-4 w-4" />
                  마이페이지
                </NuxtLink>
              </DropdownMenuItem>
              <DropdownMenuItem as-child>
                <NuxtLink to="/mypage/posts" class="cursor-pointer">
                  <Icon icon="heroicons:document-text" class="mr-2 h-4 w-4" />
                  내 게시글
                </NuxtLink>
              </DropdownMenuItem>
              <DropdownMenuItem as-child>
                <NuxtLink to="/mypage/bookmarks" class="cursor-pointer">
                  <Icon icon="heroicons:bookmark" class="mr-2 h-4 w-4" />
                  북마크
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
        </template>
        <template v-else>
          <NuxtLink to="/auth/login">
            <Button variant="ghost" size="sm">
              로그인
            </Button>
          </NuxtLink>
        </template>

        <!-- Mobile Menu Button -->
        <Sheet v-model:open="isMobileMenuOpen">
          <SheetTrigger as-child>
            <Button variant="ghost" size="icon" class="md:hidden">
              <Icon icon="heroicons:bars-3" class="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" class="w-72">
            <SheetHeader>
              <SheetTitle>메뉴</SheetTitle>
            </SheetHeader>
            <div class="mt-6 flex flex-col gap-4">
              <!-- Mobile Search -->
              <form @submit.prevent="handleSearch">
                <div class="relative">
                  <Icon
                    icon="heroicons:magnifying-glass"
                    class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    v-model="searchQuery"
                    type="search"
                    placeholder="검색어를 입력하세요"
                    class="pl-9"
                  />
                </div>
              </form>

              <!-- Mobile Menu Items -->
              <nav class="flex flex-col gap-2">
                <NuxtLink
                  v-for="item in menuItems"
                  :key="item.to"
                  :to="item.to"
                  class="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
                  :class="isActive(item.to) ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'"
                  @click="isMobileMenuOpen = false"
                >
                  {{ item.label }}
                </NuxtLink>
              </nav>

              <!-- Mobile Auth -->
              <div class="border-t pt-4">
                <template v-if="authStore.isAuthenticated">
                  <div class="flex items-center gap-3 px-3 py-2">
                    <Avatar class="h-10 w-10">
                      <AvatarImage :src="authStore.currentUser?.avatarUrl ?? undefined" :alt="authStore.currentUser?.nickname ?? undefined" />
                      <AvatarFallback>{{ userInitials }}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p class="font-medium">{{ authStore.currentUser?.nickname }}</p>
                      <p class="text-xs text-muted-foreground">{{ authStore.currentUser?.email }}</p>
                    </div>
                  </div>
                  <nav class="mt-2 flex flex-col gap-1">
                    <NuxtLink
                      to="/mypage"
                      class="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
                      @click="isMobileMenuOpen = false"
                    >
                      <Icon icon="heroicons:user" class="h-4 w-4" />
                      마이페이지
                    </NuxtLink>
                    <NuxtLink
                      to="/mypage/posts"
                      class="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
                      @click="isMobileMenuOpen = false"
                    >
                      <Icon icon="heroicons:document-text" class="h-4 w-4" />
                      내 게시글
                    </NuxtLink>
                    <NuxtLink
                      to="/mypage/bookmarks"
                      class="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
                      @click="isMobileMenuOpen = false"
                    >
                      <Icon icon="heroicons:bookmark" class="h-4 w-4" />
                      북마크
                    </NuxtLink>
                    <NuxtLink
                      to="/settings"
                      class="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
                      @click="isMobileMenuOpen = false"
                    >
                      <Icon icon="heroicons:cog-6-tooth" class="h-4 w-4" />
                      설정
                    </NuxtLink>
                    <button
                      class="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-accent w-full text-left"
                      @click="handleLogout"
                    >
                      <Icon icon="heroicons:arrow-right-on-rectangle" class="h-4 w-4" />
                      로그아웃
                    </button>
                  </nav>
                </template>
                <template v-else>
                  <NuxtLink to="/auth/login" @click="isMobileMenuOpen = false">
                    <Button class="w-full">로그인</Button>
                  </NuxtLink>
                </template>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  </header>
</template>
