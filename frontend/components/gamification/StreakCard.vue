<script setup lang="ts">
import { Icon } from '@iconify/vue'

interface StreakInfo {
  currentStreak: number
  longestStreak: number
  lastActiveDate: string | null
}

const { get: authGet } = useAuthFetch()
const streak = ref<StreakInfo | null>(null)

async function loadStreak() {
  try {
    streak.value = await authGet<StreakInfo>('/users/me/streak')
  } catch { streak.value = null }
}

onMounted(() => loadStreak())

// 스트릭 상태에 따른 메시지
const streakMessage = computed(() => {
  const n = streak.value?.currentStreak ?? 0
  if (n === 0) return '오늘 접속해서 스트릭을 시작해보세요!'
  if (n < 3) return '좋은 시작이에요! 계속 이어가세요'
  if (n < 7) return '잘하고 있어요! 7일 달성까지 화이팅'
  if (n < 30) return '대단해요! 꾸준함이 성장의 열쇠예요'
  return '전설의 스트릭! 놀라운 꾸준함이에요 🏆'
})
</script>

<template>
  <div class="bg-card border border-border rounded-xl p-4">
    <div class="flex items-center gap-2 mb-3">
      <span class="text-xl">🔥</span>
      <span class="font-semibold text-sm">연속 출석 스트릭</span>
    </div>

    <div v-if="streak" class="flex items-end gap-4">
      <div>
        <div class="text-3xl font-bold text-orange-500">{{ streak.currentStreak }}<span class="text-base font-normal text-muted-foreground ml-1">일</span></div>
        <div class="text-xs text-muted-foreground mt-0.5">연속 출석</div>
      </div>
      <div class="text-xs text-muted-foreground">
        <div>최장 <span class="font-medium text-foreground">{{ streak.longestStreak }}일</span></div>
      </div>
    </div>
    <div v-else class="h-10 bg-muted rounded animate-pulse" />

    <p class="text-xs text-muted-foreground mt-2">{{ streakMessage }}</p>

    <!-- 스트릭 마일스톤 진행도 -->
    <div v-if="streak" class="flex gap-2 mt-3">
      <div
        v-for="milestone in [3, 7, 30]" :key="milestone"
        class="flex-1 text-center"
      >
        <div
          class="text-xs font-medium mb-0.5"
          :class="streak.currentStreak >= milestone ? 'text-orange-500' : 'text-muted-foreground'"
        >{{ milestone }}일</div>
        <div
          class="h-1 rounded-full"
          :class="streak.currentStreak >= milestone ? 'bg-orange-400' : 'bg-muted'"
        />
        <div class="text-xs text-muted-foreground mt-0.5">
          {{ milestone === 3 ? '+3cr' : milestone === 7 ? '+5cr' : '+30cr' }}
        </div>
      </div>
    </div>
  </div>
</template>
