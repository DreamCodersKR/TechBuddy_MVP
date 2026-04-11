<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'
import { toast } from 'vue-sonner'
import { formatDateFull } from '@/utils/formatters'

// SSR 페이지 — layout 없이 독립형
definePageMeta({ layout: false })

const route = useRoute()
const config = useRuntimeConfig()
const nickname = route.params.nickname as string

interface PortfolioUser {
  id: string
  nickname: string
  name: string
  bio: string | null
  avatarUrl: string | null
  level: number
  techStack: string[]
  githubUrl: string | null
  portfolioUrl: string | null
}

interface PortfolioData {
  user: PortfolioUser
  sections: Record<string, boolean>
  stats: { totalTIL: number; streakDays: number; agoraAccepted: number; projectCount: number } | null
  tilGrass: Array<{ date: string; count: number }> | null
  projects: Array<{
    id: string; name: string; description: string | null
    techStack: string[]; isVerified: boolean; memberCount: number; taskCompletedCount: number
  }> | null
  badges: Array<{ badge: string; earnedAt: string }> | null
  recentTILs: Array<{ id: string; title: string; content: string; date: string }> | null
}

const { data, error } = await useAsyncData<PortfolioData>(
  `portfolio-${nickname}`,
  () => $fetch(`${config.public.apiBaseUrl}/portfolio/${nickname}`),
)

// 404 처리
if (error.value || !data.value) {
  throw createError({ statusCode: 404, message: '포트폴리오를 찾을 수 없습니다' })
}

const portfolio = data.value!

// 커피챗 요청 모달
const authStore = useAuthStore()
const coffeeChatOpen = ref(false)

const isOwnProfile = computed(() => {
  return authStore.currentUser?.nickname === portfolio.user.nickname
})

function handleCoffeeChatSuccess() {
  coffeeChatOpen.value = false
  toast.info('커피챗 요청이 전송되었습니다!')
}

// SSR OG 메타태그
useHead({
  title: `${portfolio.user.name ?? portfolio.user.nickname}의 포트폴리오 - FLOWIT`,
  meta: [
    { property: 'og:title', content: `${portfolio.user.name ?? portfolio.user.nickname} | FLOWIT 포트폴리오` },
    {
      property: 'og:description',
      content: portfolio.stats
        ? `TIL ${portfolio.stats.totalTIL}일 · 프로젝트 ${portfolio.stats.projectCount}개 · 아고라 채택 ${portfolio.stats.agoraAccepted}회`
        : `${portfolio.user.nickname}의 FLOWIT 포트폴리오`,
    },
    { property: 'og:image', content: portfolio.user.avatarUrl ?? 'https://flowit.co/og-default.png' },
    { property: 'og:url', content: `https://flowit.co/portfolio/${nickname}` },
    { property: 'og:type', content: 'profile' },
    { name: 'twitter:card', content: 'summary' },
  ],
})

// 잔디 heatmap 변환 (Array → Record)
const heatmapData = computed<Record<string, number>>(() => {
  if (!portfolio.tilGrass) return {}
  return Object.fromEntries(portfolio.tilGrass.map(({ date, count }) => [date, count]))
})

// 뱃지 아이콘 매핑
const BADGE_META: Record<string, { icon: string; label: string; color: string }> = {
  NEW_MEMBER: { icon: 'heroicons:user-plus', label: '신규 멤버', color: 'text-blue-500' },
  ACTIVITY: { icon: 'heroicons:fire', label: '활동가', color: 'text-orange-500' },
  STREAK_7: { icon: 'heroicons:bolt', label: '7일 스트릭', color: 'text-yellow-500' },
}

const formatDate = formatDateFull
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <!-- GNB 대체 간단한 헤더 -->
    <header class="border-b border-border sticky top-0 bg-background/80 backdrop-blur-sm z-10">
      <div class="max-w-3xl mx-auto px-4 h-12 flex items-center justify-between">
        <NuxtLink to="/" class="text-sm font-bold text-primary tracking-tight">FLOWIT</NuxtLink>
        <NuxtLink to="/auth/login" class="text-xs text-muted-foreground hover:text-foreground transition">
          로그인
        </NuxtLink>
      </div>
    </header>

    <main class="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <!-- 프로필 헤더 -->
      <section class="flex items-start gap-5">
        <div class="flex-shrink-0 w-16 h-16 rounded-full bg-muted overflow-hidden flex items-center justify-center border border-border">
          <img v-if="portfolio.user.avatarUrl" :src="portfolio.user.avatarUrl" class="w-full h-full object-cover" />
          <span v-else class="text-xl font-bold text-muted-foreground">
            {{ (portfolio.user.nickname ?? '?').slice(0, 1) }}
          </span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <h1 class="text-xl font-bold text-foreground">{{ portfolio.user.name ?? portfolio.user.nickname }}</h1>
            <span class="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              Lv.{{ portfolio.user.level }}
            </span>
          </div>
          <p v-if="portfolio.user.techStack?.length" class="text-sm text-muted-foreground mt-0.5">
            {{ portfolio.user.techStack.join(' / ') }}
          </p>
          <p v-if="portfolio.user.bio" class="text-sm text-muted-foreground mt-1">
            {{ portfolio.user.bio }}
          </p>
          <div class="flex items-center gap-3 mt-2">
            <a
              v-if="portfolio.user.githubUrl"
              :href="portfolio.user.githubUrl"
              target="_blank"
              class="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
            >
              <Icon icon="mdi:github" class="w-4 h-4" />
              GitHub
            </a>
            <a
              v-if="portfolio.user.portfolioUrl"
              :href="portfolio.user.portfolioUrl"
              target="_blank"
              class="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
            >
              <Icon icon="heroicons:link" class="w-4 h-4" />
              포트폴리오
            </a>
          </div>
          <!-- 커피챗 요청 버튼 (로그인 상태 + 타인 프로필일 때만 표시) -->
          <ClientOnly>
            <Button
              v-if="authStore.isAuthenticated && !isOwnProfile"
              size="sm"
              class="mt-3"
              @click="coffeeChatOpen = true"
            >
              <Icon icon="heroicons:chat-bubble-left-right" class="w-4 h-4 mr-1.5" />
              커피챗 요청
            </Button>
          </ClientOnly>
        </div>
      </section>

      <!-- 활동 요약 -->
      <section v-if="portfolio.sections.stats && portfolio.stats" class="border border-border rounded-xl bg-card p-5">
        <h2 class="text-sm font-semibold text-foreground mb-4 flex items-center gap-1.5">
          <Icon icon="heroicons:chart-bar" class="w-4 h-4 text-primary" />
          활동 요약
        </h2>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div class="text-center">
            <p class="text-2xl font-bold text-foreground">{{ portfolio.stats.totalTIL }}</p>
            <p class="text-xs text-muted-foreground mt-0.5">TIL 작성</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-foreground flex items-center justify-center gap-1">
              {{ portfolio.stats.streakDays }}<span class="text-base">🔥</span>
            </p>
            <p class="text-xs text-muted-foreground mt-0.5">연속 일수</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-foreground">{{ portfolio.stats.agoraAccepted }}</p>
            <p class="text-xs text-muted-foreground mt-0.5">아고라 채택</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-foreground">{{ portfolio.stats.projectCount }}</p>
            <p class="text-xs text-muted-foreground mt-0.5">참여 프로젝트</p>
          </div>
        </div>
      </section>

      <!-- TIL 잔디 -->
      <section v-if="portfolio.sections.grass && portfolio.tilGrass">
        <h2 class="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
          <Icon icon="heroicons:calendar-days" class="w-4 h-4 text-primary" />
          TIL 잔디
        </h2>
        <ActivityHeatmap :heatmap="heatmapData" />
      </section>

      <!-- 프로젝트 -->
      <section v-if="portfolio.sections.projects && portfolio.projects?.length">
        <h2 class="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
          <Icon icon="heroicons:rocket-launch" class="w-4 h-4 text-primary" />
          프로젝트
        </h2>
        <div class="space-y-3">
          <div
            v-for="proj in portfolio.projects"
            :key="proj.id"
            class="border border-border rounded-xl bg-card p-4"
          >
            <div class="flex items-center gap-2 mb-1">
              <p class="text-sm font-semibold text-foreground">{{ proj.name }}</p>
              <span
                v-if="proj.isVerified"
                class="flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
              >
                <Icon icon="heroicons:check-badge" class="w-3 h-3" />
                Verified
              </span>
            </div>
            <p v-if="proj.description" class="text-xs text-muted-foreground">{{ proj.description }}</p>
            <div class="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span class="flex items-center gap-1">
                <Icon icon="heroicons:users" class="w-3.5 h-3.5" />
                {{ proj.memberCount }}명
              </span>
              <span class="flex items-center gap-1">
                <Icon icon="heroicons:check-circle" class="w-3.5 h-3.5" />
                완료 태스크 {{ proj.taskCompletedCount }}개
              </span>
              <div class="flex flex-wrap gap-1 mt-1" v-if="proj.techStack?.length">
                <span
                  v-for="tech in proj.techStack.slice(0, 4)"
                  :key="tech"
                  class="px-1.5 py-0.5 text-[10px] rounded bg-muted"
                >{{ tech }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 뱃지 -->
      <section v-if="portfolio.sections.badges && portfolio.badges?.length">
        <h2 class="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
          <Icon icon="heroicons:trophy" class="w-4 h-4 text-primary" />
          뱃지
        </h2>
        <div class="flex flex-wrap gap-2">
          <div
            v-for="b in portfolio.badges"
            :key="b.badge"
            class="flex items-center gap-2 px-3 py-2 border border-border rounded-lg bg-card"
          >
            <Icon
              :icon="BADGE_META[b.badge]?.icon ?? 'heroicons:star'"
              class="w-4 h-4"
              :class="BADGE_META[b.badge]?.color ?? 'text-muted-foreground'"
            />
            <div>
              <p class="text-xs font-medium text-foreground">{{ BADGE_META[b.badge]?.label ?? b.badge }}</p>
              <p class="text-[10px] text-muted-foreground">{{ formatDate(b.earnedAt) }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 최근 TIL -->
      <section v-if="portfolio.sections.recentTILs && portfolio.recentTILs?.length">
        <h2 class="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
          <Icon icon="heroicons:pencil-square" class="w-4 h-4 text-primary" />
          최근 TIL
        </h2>
        <div class="space-y-2">
          <NuxtLink
            v-for="til in portfolio.recentTILs"
            :key="til.id"
            :to="`/til/${til.id}`"
            class="block border border-border rounded-lg bg-card p-4 hover:bg-accent transition-colors"
          >
            <p class="text-sm font-medium text-foreground">{{ til.title || '(제목 없음)' }}</p>
            <p class="text-xs text-muted-foreground mt-1 line-clamp-2">{{ til.content }}</p>
            <p class="text-xs text-muted-foreground mt-1">{{ formatDate(til.date) }}</p>
          </NuxtLink>
        </div>
      </section>

      <!-- 푸터 -->
      <footer class="text-center py-6 border-t border-border">
        <p class="text-xs text-muted-foreground">
          Powered by
          <NuxtLink to="/" class="text-primary hover:underline font-medium">FLOWIT</NuxtLink>
          · flowit.co
        </p>
      </footer>
    </main>

    <!-- 커피챗 요청 모달 -->
    <ClientOnly>
      <CoffeeChatRequestModal
        v-if="authStore.isAuthenticated && !isOwnProfile"
        :receiver-id="portfolio.user.id"
        :receiver-nickname="portfolio.user.nickname"
        :open="coffeeChatOpen"
        @close="coffeeChatOpen = false"
        @success="handleCoffeeChatSuccess"
      />
    </ClientOnly>
  </div>
</template>
