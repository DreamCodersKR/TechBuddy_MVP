<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

definePageMeta({ layout: 'workspace', middleware: 'auth' })
useHead({ title: 'TIL - FLOWIT' })

const route = useRoute()
const router = useRouter()
const workspaceId = route.params.id as string
const { get: authGet } = useAuthFetch()
const authStore = useAuthStore()

interface TilItem {
  id: string
  title: string
  date: string
  tags: string[]
  visibility: 'PRIVATE' | 'WORKSPACE' | 'PUBLIC'
  author: { id: string, name: string, nickname: string | null, avatarUrl: string | null }
}

const tils = ref<TilItem[]>([])
const total = ref(0)
const loading = ref(true)
const page = ref(1)
const limit = 20

const currentUserId = computed(() => (authStore.currentUser as any)?.id ?? '')

const VISIBILITY_LABEL: Record<string, string> = {
  PRIVATE: '나만',
  WORKSPACE: '팀원',
  PUBLIC: '전체',
}
const VISIBILITY_COLOR: Record<string, string> = {
  PRIVATE: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  WORKSPACE: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  PUBLIC: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
}

async function loadTils() {
  loading.value = true
  try {
    const res = await authGet<{ items: TilItem[], total: number }>(
      `/tils?page=${page.value}&limit=${limit}`
    )
    // 이 워크스페이스에 속한 TIL만 필터 (BE에서 workspaceId 필터 추가 전 임시)
    tils.value = res.items
    total.value = res.total
  }
  catch { tils.value = [] }
  finally { loading.value = false }
}

onMounted(() => loadTils())

function goWrite() {
  router.push(`/workspaces/${workspaceId}/til/write`)
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-bold">TIL</h2>
        <p class="text-sm text-muted-foreground mt-0.5">오늘 배운 것을 기록하세요</p>
      </div>
      <Button @click="goWrite">
        <Icon icon="heroicons:plus" class="w-4 h-4 mr-2" />
        TIL 작성
      </Button>
    </div>

    <!-- 로딩 -->
    <div v-if="loading" class="space-y-3">
      <div v-for="n in 5" :key="n" class="h-16 bg-muted animate-pulse rounded-xl" />
    </div>

    <!-- TIL 목록 -->
    <div v-else-if="tils.length > 0" class="space-y-3">
      <NuxtLink
        v-for="til in tils"
        :key="til.id"
        :to="`/til/${til.id}`"
        class="block bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span
                class="text-xs px-1.5 py-0.5 rounded font-medium"
                :class="VISIBILITY_COLOR[til.visibility]"
              >
                {{ VISIBILITY_LABEL[til.visibility] }}
              </span>
              <span class="text-xs text-muted-foreground">{{ til.date.slice(0, 10) }}</span>
              <span v-if="til.author.id !== currentUserId" class="text-xs text-muted-foreground">
                · {{ til.author.nickname ?? til.author.name }}
              </span>
            </div>
            <p class="text-sm font-medium text-foreground line-clamp-1">{{ til.title }}</p>
            <div v-if="til.tags.length > 0" class="flex flex-wrap gap-1 mt-1.5">
              <span
                v-for="tag in til.tags.slice(0, 3)"
                :key="tag"
                class="text-xs bg-muted text-muted-foreground rounded px-1.5 py-0.5"
              >
                #{{ tag }}
              </span>
            </div>
          </div>
        </div>
      </NuxtLink>
    </div>

    <!-- 빈 상태 -->
    <div v-else class="flex flex-col items-center justify-center py-20 text-center">
      <Icon icon="heroicons:pencil-square" class="w-12 h-12 text-muted-foreground/40 mb-4" />
      <p class="text-sm font-medium text-foreground mb-1">아직 TIL이 없습니다</p>
      <p class="text-xs text-muted-foreground mb-4">오늘 배운 것을 기록해보세요</p>
      <Button variant="outline" @click="goWrite">첫 TIL 작성하기</Button>
    </div>
  </div>
</template>
