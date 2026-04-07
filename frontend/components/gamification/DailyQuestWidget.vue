<script setup lang="ts">
import { Icon } from '@iconify/vue'

interface Quest {
  id: string
  title: string
  description: string
  xpReward: number
  creditReward: number
  completed: boolean
  completedAt: string | null
}

const { get: authGet } = useAuthFetch()
const quests = ref<Quest[]>([])
const loading = ref(true)

async function loadQuests() {
  try {
    quests.value = await authGet<Quest[]>('/quests/daily')
  } catch { quests.value = [] }
  finally { loading.value = false }
}

onMounted(() => loadQuests())

const completed = computed(() => quests.value.filter(q => q.completed).length)
const total = computed(() => quests.value.length)
const progress = computed(() => total.value ? Math.round(completed.value / total.value * 100) : 0)
</script>

<template>
  <div class="bg-card border border-border rounded-xl p-4">
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <Icon icon="heroicons:bolt" class="w-4 h-4 text-yellow-500" />
        <span class="font-semibold text-sm">오늘의 퀘스트</span>
      </div>
      <span class="text-xs text-muted-foreground">{{ completed }}/{{ total }} 완료</span>
    </div>

    <!-- 전체 진행 바 -->
    <div class="w-full bg-muted rounded-full h-1.5 mb-3">
      <div
        class="bg-yellow-400 h-1.5 rounded-full transition-all"
        :style="`width: ${progress}%`"
      />
    </div>

    <!-- 퀘스트 목록 -->
    <div v-if="loading" class="space-y-2">
      <div v-for="i in 3" :key="i" class="h-8 bg-muted rounded animate-pulse" />
    </div>
    <div v-else class="space-y-2">
      <div
        v-for="q in quests" :key="q.id"
        class="flex items-center gap-2 text-sm"
        :class="q.completed ? 'opacity-50' : ''"
      >
        <Icon
          :icon="q.completed ? 'heroicons:check-circle-solid' : 'heroicons:circle'"
          class="w-4 h-4 shrink-0"
          :class="q.completed ? 'text-green-500' : 'text-muted-foreground'"
        />
        <span :class="q.completed ? 'line-through text-muted-foreground' : ''">{{ q.title }}</span>
        <span class="ml-auto text-xs text-muted-foreground whitespace-nowrap">
          +{{ q.xpReward }}XP
          <span v-if="q.creditReward"> +{{ q.creditReward }}cr</span>
        </span>
      </div>
    </div>
  </div>
</template>
