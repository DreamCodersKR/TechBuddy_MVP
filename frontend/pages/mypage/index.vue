<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

definePageMeta({ layout: 'default', middleware: 'auth' })
useHead({ title: '마이페이지 - FLOWIT' })

const authStore = useAuthStore()
const { get: authGet } = useAuthFetch()

interface Badge {
  id: string
  badge: string
  earnedAt: string
}

const badges = ref<Badge[]>([])
const badgesLoading = ref(true)
const heatmap = ref<Record<string, number>>({})

async function loadBadges() {
  try {
    badges.value = await authGet<Badge[]>('/badges/mine')
  }
  catch { badges.value = [] }
  finally { badgesLoading.value = false }
}

async function loadHeatmap() {
  try {
    heatmap.value = await authGet<Record<string, number>>(
      `/users/me/activity-heatmap?year=${new Date().getFullYear()}`
    )
  } catch { heatmap.value = {} }
}

onMounted(() => { loadBadges(); loadHeatmap() })

const user = computed(() => authStore.currentUser)
const userInitials = computed(() => {
  if (!user.value?.nickname) return 'U'
  return user.value.nickname.slice(0, 2).toUpperCase()
})

const xp = computed(() => (user.value as any)?.xp ?? 0)
const level = computed(() => (user.value as any)?.level ?? 1)
const credit = computed(() => (user.value as any)?.credit ?? 0)
const plan = computed(() => (user.value as any)?.plan ?? 'FREE')

// 레벨업 XP 계산 (레벨 * 100)
const xpForNextLevel = computed(() => level.value * 100)
const xpProgress = computed(() => Math.min(100, (xp.value % xpForNextLevel.value) / xpForNextLevel.value * 100))

const BADGE_META: Record<string, { label: string; icon: string; color: string }> = {
  NEW_MEMBER: { label: '신규 회원', icon: 'heroicons:star', color: 'text-yellow-500' },
  ACTIVITY: { label: '활동가', icon: 'heroicons:fire', color: 'text-orange-500' },
  SUBSCRIBER: { label: '구독자', icon: 'heroicons:heart', color: 'text-pink-500' },
  LOYALTY: { label: '충성 회원', icon: 'heroicons:trophy', color: 'text-purple-500' },
  ORGANIZATION: { label: '조직 멤버', icon: 'heroicons:building-office', color: 'text-blue-500' },
}
</script>

<template>
  <div class="max-w-2xl mx-auto py-8 px-4">
    <!-- 프로필 카드 -->
    <div class="bg-card border border-border rounded-xl p-6 mb-6">
      <div class="flex items-start gap-4">
        <Avatar class="h-16 w-16 shrink-0 overflow-hidden">
          <AvatarImage :src="user?.avatarUrl ?? undefined" :alt="user?.nickname ?? undefined" />
          <AvatarFallback class="text-lg">{{ userInitials }}</AvatarFallback>
        </Avatar>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <h1 class="text-xl font-bold text-foreground truncate">
              {{ user?.nickname || user?.name }}
            </h1>
            <span class="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
              Lv.{{ level }}
            </span>
            <span
              v-if="plan !== 'FREE'"
              class="px-2 py-0.5 text-xs font-medium rounded-full"
              :class="plan === 'PRO' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'"
            >
              {{ plan }}
            </span>
          </div>
          <p class="text-sm text-muted-foreground">{{ user?.email }}</p>
          <p v-if="user?.bio" class="text-sm text-foreground mt-1">{{ user.bio }}</p>
          <div v-if="user?.techStack?.length" class="flex flex-wrap gap-1 mt-2">
            <span
              v-for="tech in user.techStack"
              :key="tech"
              class="px-2 py-0.5 text-xs bg-muted rounded-md"
            >
              {{ tech }}
            </span>
          </div>
        </div>
        <NuxtLink to="/settings">
          <Button variant="outline" size="sm">
            <Icon icon="heroicons:pencil" class="w-4 h-4 mr-1" />
            편집
          </Button>
        </NuxtLink>
      </div>

      <!-- XP 바 -->
      <div class="mt-4">
        <div class="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>XP {{ xp }}</span>
          <span>다음 레벨까지 {{ xpForNextLevel - (xp % xpForNextLevel) }} XP</span>
        </div>
        <div class="h-2 bg-muted rounded-full overflow-hidden">
          <div
            class="h-full bg-primary rounded-full transition-all"
            :style="{ width: `${xpProgress}%` }"
          />
        </div>
      </div>
    </div>

    <!-- 크레딧 + 링크 카드 -->
    <div class="grid grid-cols-2 gap-3 mb-6">
      <NuxtLink
        to="/mypage/credits"
        class="bg-card border border-border rounded-xl p-4 hover:bg-accent/50 transition-colors"
      >
        <div class="flex items-center gap-2 text-muted-foreground mb-1">
          <Icon icon="heroicons:currency-dollar" class="w-4 h-4" />
          <span class="text-xs">크레딧 잔액</span>
        </div>
        <p class="text-2xl font-bold text-foreground">{{ credit.toLocaleString() }}</p>
        <p class="text-xs text-muted-foreground mt-1">내역 보기 →</p>
      </NuxtLink>
      <NuxtLink
        to="/mypage/posts"
        class="bg-card border border-border rounded-xl p-4 hover:bg-accent/50 transition-colors"
      >
        <div class="flex items-center gap-2 text-muted-foreground mb-1">
          <Icon icon="heroicons:document-text" class="w-4 h-4" />
          <span class="text-xs">내 게시글</span>
        </div>
        <p class="text-2xl font-bold text-foreground">-</p>
        <p class="text-xs text-muted-foreground mt-1">보러 가기 →</p>
      </NuxtLink>
    </div>

    <!-- 뱃지 -->
    <div class="bg-card border border-border rounded-xl p-6 mb-6">
      <h2 class="text-sm font-semibold text-foreground mb-4">보유 뱃지</h2>
      <div v-if="badgesLoading" class="flex gap-3">
        <div v-for="n in 3" :key="n" class="h-10 w-10 rounded-full bg-muted animate-pulse" />
      </div>
      <div v-else-if="badges.length > 0" class="flex flex-wrap gap-3">
        <div v-for="b in badges" :key="b.id" class="flex flex-col items-center gap-1">
          <div class="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
            <Icon
              :icon="BADGE_META[b.badge]?.icon ?? 'heroicons:star'"
              class="w-5 h-5"
              :class="BADGE_META[b.badge]?.color ?? 'text-muted-foreground'"
            />
          </div>
          <span class="text-xs text-muted-foreground">{{ BADGE_META[b.badge]?.label ?? b.badge }}</span>
        </div>
      </div>
      <p v-else class="text-sm text-muted-foreground">아직 획득한 뱃지가 없습니다.</p>
    </div>

    <!-- ===== M10 게이미피케이션 섹션 ===== -->
    <!-- 스트릭 + 퀘스트 (2열 그리드) -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <GamificationStreakCard />
      <GamificationDailyQuestWidget />
    </div>

    <!-- 활동 히트맵 -->
    <div class="bg-card border border-border rounded-xl p-6 mb-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-sm font-semibold flex items-center gap-1.5">
          활동 기록
          <span class="relative group">
            <Icon icon="heroicons:information-circle" class="w-3.5 h-3.5 text-muted-foreground cursor-help" />
            <span class="absolute left-0 bottom-full mb-2 hidden group-hover:block w-48 px-3 py-2 text-xs text-popover-foreground bg-popover border border-border rounded-lg shadow-lg z-10 font-normal leading-relaxed">
              TIL 작성, Task 완료, 게시글 작성, 댓글 작성, AI 멘토링 이용 기록을 합산합니다.
            </span>
          </span>
        </h2>
        <NuxtLink to="/workspaces" class="text-xs text-primary hover:underline">워크스페이스 →</NuxtLink>
      </div>
      <GamificationActivityHeatmap :heatmap="heatmap" />
    </div>

    <!-- 친구 초대 배너 -->
    <NuxtLink
      to="/mypage/referral"
      class="flex items-center justify-between bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20 rounded-xl p-4 hover:opacity-80 transition-opacity"
    >
      <div>
        <p class="font-semibold text-sm">🎁 친구 초대 보상</p>
        <p class="text-xs text-muted-foreground mt-0.5">초대 시 +20cr, 피초대자 +20cr</p>
      </div>
      <Icon icon="heroicons:chevron-right" class="w-5 h-5 text-muted-foreground" />
    </NuxtLink>
  </div>
</template>
