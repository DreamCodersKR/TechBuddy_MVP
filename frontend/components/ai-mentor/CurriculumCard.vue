<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'

interface CurriculumItem {
  title: string
  reason: string
}

interface CurriculumData {
  id: string
  items: CurriculumItem[]
  generatedAt: string
}

const emit = defineEmits<{
  startChat: [topic: string]
}>()

const { get: authGet, post: authPost } = useAuthFetch()

const data = ref<CurriculumData | null>(null)
const loading = ref(true)
const regenerating = ref(false)
const error = ref(false)

async function fetchCurriculum() {
  loading.value = true
  error.value = false
  try {
    data.value = await authGet<CurriculumData>('/ai-mentor/curriculum')
  }
  catch {
    error.value = true
    data.value = null
  }
  finally {
    loading.value = false
  }
}

async function regenerate() {
  if (regenerating.value) return
  regenerating.value = true
  error.value = false
  try {
    data.value = await authPost<CurriculumData>('/ai-mentor/curriculum/regenerate')
  }
  catch {
    error.value = true
  }
  finally {
    regenerating.value = false
  }
}

function handleItemClick(item: CurriculumItem) {
  emit('startChat', item.title)
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(() => {
  fetchCurriculum()
})
</script>

<template>
  <div class="border border-border rounded-xl bg-card overflow-hidden">
    <!-- 헤더 -->
    <div class="flex items-center justify-between px-5 py-4 border-b border-border">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
          <Icon icon="heroicons:academic-cap" class="w-4.5 h-4.5 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h3 class="text-sm font-semibold text-foreground">
            이번 주 추천 학습
          </h3>
          <p v-if="data?.generatedAt" class="text-[11px] text-muted-foreground mt-0.5">
            {{ formatDate(data.generatedAt) }} 기준
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        :disabled="regenerating || loading"
        class="text-xs text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400"
        @click="regenerate"
      >
        <Icon
          icon="heroicons:arrow-path"
          class="w-3.5 h-3.5 mr-1"
          :class="regenerating ? 'animate-spin' : ''"
        />
        새로고침
      </Button>
    </div>

    <!-- 로딩 상태 -->
    <div v-if="loading" class="px-5 py-3 space-y-3">
      <div
        v-for="n in 5"
        :key="n"
        class="flex items-start gap-3 py-2"
      >
        <div class="w-6 h-6 rounded-full bg-muted animate-pulse flex-shrink-0 mt-0.5" />
        <div class="flex-1 space-y-1.5">
          <div class="h-4 bg-muted animate-pulse rounded w-3/4" />
          <div class="h-3 bg-muted animate-pulse rounded w-full" />
        </div>
      </div>
    </div>

    <!-- 에러 상태 -->
    <div v-else-if="error" class="px-5 py-8 text-center">
      <Icon icon="heroicons:exclamation-triangle" class="w-8 h-8 text-muted-foreground mx-auto mb-2" />
      <p class="text-sm text-muted-foreground mb-3">
        추천 학습을 불러올 수 없습니다
      </p>
      <Button variant="outline" size="sm" @click="fetchCurriculum">
        다시 시도
      </Button>
    </div>

    <!-- 빈 상태 -->
    <div v-else-if="!data || data.items.length === 0" class="px-5 py-8 text-center">
      <Icon icon="heroicons:academic-cap" class="w-8 h-8 text-muted-foreground mx-auto mb-2" />
      <p class="text-sm text-muted-foreground mb-1">
        아직 추천 학습이 없어요
      </p>
      <p class="text-xs text-muted-foreground mb-3">
        새로고침을 눌러 AI 추천을 받아보세요
      </p>
      <Button variant="outline" size="sm" @click="regenerate" :disabled="regenerating">
        <Icon
          icon="heroicons:sparkles"
          class="w-3.5 h-3.5 mr-1"
          :class="regenerating ? 'animate-spin' : ''"
        />
        추천 받기
      </Button>
    </div>

    <!-- 추천 목록 -->
    <div v-else class="divide-y divide-border">
      <button
        v-for="(item, idx) in data.items"
        :key="idx"
        class="w-full flex items-start gap-3 px-5 py-3.5 text-left hover:bg-muted/50 transition-colors cursor-pointer group"
        @click="handleItemClick(item)"
      >
        <!-- 번호 뱃지 -->
        <span class="flex-shrink-0 w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-xs font-semibold text-violet-600 dark:text-violet-400 mt-0.5">
          {{ idx + 1 }}
        </span>
        <!-- 내용 -->
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
            {{ item.title }}
          </p>
          <p class="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {{ item.reason }}
          </p>
        </div>
        <!-- 화살표 -->
        <Icon
          icon="heroicons:chat-bubble-left-ellipsis"
          class="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1"
        />
      </button>
    </div>

    <!-- 하단 안내 -->
    <div v-if="data && data.items.length > 0" class="px-5 py-2.5 bg-muted/30 border-t border-border">
      <p class="text-[11px] text-muted-foreground text-center">
        클릭하면 해당 주제로 AI 멘토와 대화를 시작합니다
      </p>
    </div>
  </div>
</template>
