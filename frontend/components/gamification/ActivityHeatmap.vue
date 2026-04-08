<script setup lang="ts">
const props = defineProps<{
  heatmap: Record<string, number>  // { '2026-04-08': 1, ... }
  year?: number
}>()

const currentYear = props.year ?? new Date().getFullYear()

// 52주 × 7일 그리드 생성
const weeks = computed(() => {
  const startOfYear = new Date(currentYear, 0, 1)
  const gridStart = new Date(startOfYear)
  gridStart.setDate(gridStart.getDate() - gridStart.getDay())

  const result: { date: string; count: number }[][] = []
  let week: { date: string; count: number }[] = []

  for (let i = 0; i < 53 * 7; i++) {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    const key = d.toISOString().split('T')[0]
    const isCurrentYear = d.getFullYear() === currentYear

    week.push({
      date: key,
      count: isCurrentYear ? (props.heatmap[key] ?? 0) : -1,
    })

    if (week.length === 7) {
      result.push(week)
      week = []
    }
  }
  return result
})

// 월 시작 week index → 레이블 Map
const monthMap = computed(() => {
  const map = new Map<number, string>()
  let lastMonth = -1
  weeks.value.forEach((week, i) => {
    const firstDay = week.find(d => d.count !== -1)
    if (!firstDay) return
    const m = new Date(firstDay.date).getMonth()
    if (m !== lastMonth) {
      map.set(i, ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'][m])
      lastMonth = m
    }
  })
  return map
})

function cellColor(count: number): string {
  if (count < 0) return 'bg-transparent'
  if (count === 0) return 'bg-muted dark:bg-zinc-800'
  if (count === 1) return 'bg-green-200 dark:bg-green-900'
  if (count === 2) return 'bg-green-400 dark:bg-green-700'
  return 'bg-green-600 dark:bg-green-500'
}

const tooltip = ref<{ date: string; count: number; x: number; y: number } | null>(null)

function showTooltip(e: MouseEvent, date: string, count: number) {
  if (count < 0) return
  tooltip.value = { date, count, x: (e.currentTarget as HTMLElement).offsetLeft, y: (e.currentTarget as HTMLElement).offsetTop }
}
</script>

<template>
  <div class="overflow-x-auto">
    <div class="inline-flex flex-col" style="min-width: max-content">
      <!-- 월 레이블 행: 그리드와 동일한 flex 구조로 함께 스크롤 -->
      <div class="flex gap-[2px] mb-1" style="padding-left: 18px;">
        <div
          v-for="(week, wi) in weeks"
          :key="wi"
          class="w-3 text-xs text-muted-foreground overflow-visible whitespace-nowrap"
        >
          {{ monthMap.get(wi) ?? '' }}
        </div>
      </div>

      <!-- 그리드 행 -->
      <div class="flex gap-[2px]">
        <!-- 요일 레이블 -->
        <div class="flex flex-col gap-[2px] mr-1 text-xs text-muted-foreground w-3">
          <span class="h-3 leading-3"> </span>
          <span class="h-3 leading-3">월</span>
          <span class="h-3 leading-3"> </span>
          <span class="h-3 leading-3">수</span>
          <span class="h-3 leading-3"> </span>
          <span class="h-3 leading-3">금</span>
          <span class="h-3 leading-3"> </span>
        </div>

        <!-- 주별 컬럼 -->
        <div v-for="(week, wi) in weeks" :key="wi" class="flex flex-col gap-[2px]">
          <div
            v-for="day in week" :key="day.date"
            :class="['w-3 h-3 rounded-sm cursor-pointer transition-opacity hover:opacity-80', cellColor(day.count)]"
            @mouseenter="showTooltip($event, day.date, day.count)"
            @mouseleave="tooltip = null"
          />
        </div>
      </div>
    </div>

    <!-- 범례 -->
    <div class="flex items-center gap-1 mt-2 text-xs text-muted-foreground justify-end">
      <span>적음</span>
      <div class="w-3 h-3 rounded-sm bg-muted dark:bg-zinc-800" />
      <div class="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-900" />
      <div class="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-700" />
      <div class="w-3 h-3 rounded-sm bg-green-600 dark:bg-green-500" />
      <span>많음</span>
    </div>

    <!-- 툴팁 -->
    <div
      v-if="tooltip && tooltip.count >= 0"
      class="absolute z-10 bg-popover border border-border text-popover-foreground text-xs rounded px-2 py-1 pointer-events-none shadow"
      :style="`top: ${tooltip.y - 30}px; left: ${tooltip.x}px`"
    >
      {{ tooltip.date }}: {{ tooltip.count }}회
    </div>
  </div>
</template>
