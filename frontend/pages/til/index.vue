<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDateFull } from '@/utils/formatters'

definePageMeta({ layout: 'default', middleware: 'auth' })
useHead({ title: 'TIL - FLOWIT' })

const { get: authGet } = useAuthFetch()
const authStore = useAuthStore()

interface TilItem {
  id: string
  title: string
  content: string
  date: string
  tags: string[]
  author: { id: string; name: string; nickname: string | null; avatarUrl: string | null }
  createdAt: string
}

const tils = ref<TilItem[]>([])
const total = ref(0)
const page = ref(1)
const loading = ref(true)
const myOnly = ref(false)

async function loadTils() {
  loading.value = true
  try {
    const params = new URLSearchParams({ page: String(page.value), limit: '20' })
    if (myOnly.value) params.set('authorId', authStore.currentUser?.id ?? '')
    const res = await authGet<{ items: TilItem[]; total: number }>(`/tils?${params}`)
    tils.value = res.items
    total.value = res.total
  } catch { tils.value = [] }
  finally { loading.value = false }
}

onMounted(() => loadTils())
watch([myOnly], () => { page.value = 1; loadTils() })

const formatDate = formatDateFull
function excerpt(content: string, len = 120) {
  const text = content.replace(/[#*`>\-]/g, '').trim()
  return text.length > len ? text.slice(0, len) + '…' : text
}
</script>

<template>
  <div class="max-w-2xl mx-auto py-8 px-4">
    <!-- 헤더 -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold">TIL 피드</h1>
        <p class="text-sm text-muted-foreground mt-1">Today I Learned — 오늘 배운 것을 기록해요</p>
      </div>
      <NuxtLink to="/til/write">
        <Button size="sm">
          <Icon icon="heroicons:plus" class="w-4 h-4 mr-1" />
          TIL 작성
        </Button>
      </NuxtLink>
    </div>

    <!-- 필터 -->
    <div class="flex items-center gap-2 mb-4">
      <Button
        :variant="!myOnly ? 'default' : 'outline'"
        size="sm"
        @click="myOnly = false"
      >전체</Button>
      <Button
        :variant="myOnly ? 'default' : 'outline'"
        size="sm"
        @click="myOnly = true"
      >내 TIL</Button>
    </div>

    <!-- 로딩 -->
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 5" :key="i" class="bg-card border border-border rounded-xl p-4 animate-pulse">
        <div class="h-4 bg-muted rounded w-3/4 mb-2" />
        <div class="h-3 bg-muted rounded w-full" />
      </div>
    </div>

    <!-- 목록 -->
    <div v-else-if="tils.length" class="space-y-4">
      <NuxtLink
        v-for="til in tils" :key="til.id"
        :to="`/til/${til.id}`"
        class="block bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors"
      >
        <div class="flex items-start justify-between gap-2 mb-2">
          <h2 class="font-semibold text-foreground line-clamp-1">{{ til.title }}</h2>
          <span class="text-xs text-muted-foreground shrink-0">{{ formatDate(til.date) }}</span>
        </div>
        <p class="text-sm text-muted-foreground line-clamp-2 mb-3">{{ excerpt(til.content) }}</p>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Avatar class="h-5 w-5">
              <AvatarImage :src="til.author.avatarUrl ?? ''" />
              <AvatarFallback class="text-xs">{{ (til.author.nickname || til.author.name).slice(0, 1) }}</AvatarFallback>
            </Avatar>
            <span class="text-xs text-muted-foreground">{{ til.author.nickname || til.author.name }}</span>
          </div>
          <div class="flex gap-1">
            <Badge v-for="tag in til.tags.slice(0, 3)" :key="tag" variant="secondary" class="text-xs px-1.5 py-0">
              {{ tag }}
            </Badge>
          </div>
        </div>
      </NuxtLink>
    </div>

    <div v-else class="text-center py-16 text-muted-foreground">
      <Icon icon="heroicons:document-text" class="w-12 h-12 mx-auto mb-3 opacity-30" />
      <p>아직 TIL이 없어요. 오늘 배운 것을 기록해보세요!</p>
    </div>
  </div>
</template>
