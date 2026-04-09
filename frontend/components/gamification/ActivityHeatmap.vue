<script setup lang="ts">
const props = defineProps<{
  heatmap: Record<string, number>  // { '2026-04-08': 1, ... }
  year?: number
}>()

const currentYear = props.year ?? new Date().getFullYear()

// ─── 유틸: 타임존 안전 날짜 포맷 ─────────────────────────
// toISOString()은 UTC 변환으로 KST(+9)에서 하루 전날을 반환 → 절대 사용 금지
function fmt(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function addDays(base: Date, n: number): Date {
  const d = new Date(base.getTime())
  d.setDate(d.getDate() + n)
  return d
}

// ─── 그리드 범위 (GitHub 방식) ────────────────────────────
// Jan 1이 속한 주의 일요일(getDay()=0) ~ Dec 31이 속한 주의 토요일(getDay()=6)
const jan1 = new Date(currentYear, 0, 1)
const dec31 = new Date(currentYear, 11, 31)
const gridStart = addDays(jan1, -jan1.getDay())      // 그 주 일요일
const gridEnd   = addDays(dec31, 6 - dec31.getDay()) // 그 주 토요일

// ─── 주 × 요일 그리드 생성 ───────────────────────────────
// weeks[wi][di]:  wi = 주 index, di = 0(일) ~ 6(토)
const weeks = computed(() => {
  const cols: { date: string; count: number }[][] = []
  let cursor = new Date(gridStart.getTime())

  while (cursor <= gridEnd) {
    const week: { date: string; count: number }[] = []
    for (let i = 0; i < 7; i++) {
      const dateStr = fmt(cursor)
      const inYear = cursor.getFullYear() === currentYear
      week.push({
        date: dateStr,
        count: inYear ? (props.heatmap[dateStr] ?? 0) : -1,
      })
      cursor = addDays(cursor, 1)
    }
    cols.push(week)
  }
  return cols
})

// ─── 월 레이블 ────────────────────────────────────────────
// 각 주에서 연도 내 첫 날의 월이 바뀌는 week index에 레이블 배치
const monthMap = computed(() => {
  const map = new Map<number, string>()
  const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']
  let lastMonth = -1
  weeks.value.forEach((week, wi) => {
    const first = week.find(d => d.count !== -1)
    if (!first) return
    const month = parseInt(first.date.split('-')[1]) - 1  // 타임존 안전 월 파싱
    if (month !== lastMonth) {
      map.set(wi, MONTHS[month])
      lastMonth = month
    }
  })
  return map
})

// ─── 셀 색상 ──────────────────────────────────────────────
function cellColor(count: number): string {
  if (count < 0) return 'bg-transparent'
  if (count === 0) return 'bg-muted dark:bg-zinc-800'
  if (count === 1) return 'bg-green-200 dark:bg-green-900'
  if (count === 2) return 'bg-green-400 dark:bg-green-700'
  return 'bg-green-600 dark:bg-green-500'
}

// ─── 툴팁 ────────────────────────────────────────────────
const tooltip = ref<{ date: string; count: number; x: number; y: number } | null>(null)

function showTooltip(e: MouseEvent, date: string, count: number) {
  if (count < 0) return
  const el = e.currentTarget as HTMLElement
  const container = el.closest('.heatmap-root') as HTMLElement | null
  const elRect = el.getBoundingClientRect()
  const containerRect = container?.getBoundingClientRect()
  tooltip.value = {
    date,
    count,
    x: containerRect ? elRect.left - containerRect.left : elRect.left,
    y: containerRect ? elRect.top  - containerRect.top  : elRect.top,
  }
}
</script>

<template>
  <div class="heatmap-root relative overflow-x-auto">
    <div class="inline-flex flex-col" style="min-width: max-content">

      <!-- 월 레이블 행: 그리드와 동일한 flex 구조로 스크롤 동기화 -->
      <div class="flex gap-[2px] mb-1" style="padding-left: 20px;">
        <div
          v-for="(_, wi) in weeks"
          :key="wi"
          class="w-3 text-xs text-muted-foreground overflow-visible whitespace-nowrap"
        >
          {{ monthMap.get(wi) ?? '' }}
        </div>
      </div>

      <!-- 그리드 본체 -->
      <div class="flex gap-[2px]">

        <!-- 요일 레이블: 일(0)~토(6), 월/수/금만 표시 (GitHub 스타일) -->
        <div class="flex flex-col gap-[2px] mr-1 text-xs text-muted-foreground text-right" style="width: 16px;">
          <div class="h-3" />                       <!-- 일 (숨김) -->
          <div class="h-3 leading-3">월</div>       <!-- 월 -->
          <div class="h-3" />                       <!-- 화 (숨김) -->
          <div class="h-3 leading-3">수</div>       <!-- 수 -->
          <div class="h-3" />                       <!-- 목 (숨김) -->
          <div class="h-3 leading-3">금</div>       <!-- 금 -->
          <div class="h-3" />                       <!-- 토 (숨김) -->
        </div>

        <!-- 주별 컬럼 -->
        <div v-for="(week, wi) in weeks" :key="wi" class="flex flex-col gap-[2px]">
          <div
            v-for="day in week"
            :key="day.date"
            :class="[
              'w-3 h-3 rounded-sm transition-opacity',
              day.count >= 0 ? 'cursor-pointer hover:opacity-70' : 'pointer-events-none',
              cellColor(day.count),
            ]"
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
      class="absolute z-10 bg-popover border border-border text-popover-foreground text-xs rounded px-2 py-1 pointer-events-none shadow whitespace-nowrap"
      :style="`top: ${tooltip.y - 32}px; left: ${tooltip.x}px`"
    >
      {{ tooltip.date }}: {{ tooltip.count }}회
    </div>
  </div>
</template>
