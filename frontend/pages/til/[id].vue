<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

definePageMeta({ layout: 'default', middleware: 'auth' })

const route = useRoute()
const { get: authGet, delete: authDelete } = useAuthFetch()
const authStore = useAuthStore()
const router = useRouter()

interface Til {
  id: string
  title: string
  content: string
  date: string
  tags: string[]
  author: { id: string; name: string; nickname: string | null; avatarUrl: string | null }
  createdAt: string
}

const til = ref<Til | null>(null)
const loading = ref(true)

async function loadTil() {
  try {
    til.value = await authGet<Til>(`/tils/${route.params.id}`)
    useHead({ title: `${til.value?.title} - TIL - FLOWIT` })
  } finally { loading.value = false }
}

onMounted(() => loadTil())

const isOwner = computed(() => til.value?.author.id === authStore.currentUser?.id)

async function deleteTil() {
  if (!confirm('TIL을 삭제하시겠습니까?')) return
  await authDelete(`/tils/${til.value?.id}`)
  router.push('/til')
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
}
</script>

<template>
  <div class="max-w-2xl mx-auto py-8 px-4">
    <div v-if="loading" class="animate-pulse space-y-4">
      <div class="h-6 bg-muted rounded w-3/4" />
      <div class="h-4 bg-muted rounded w-full" />
    </div>

    <template v-else-if="til">
      <!-- 뒤로가기 -->
      <NuxtLink to="/til" class="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
        <Icon icon="heroicons:arrow-left" class="w-4 h-4 mr-1" /> TIL 목록
      </NuxtLink>

      <div class="bg-card border border-border rounded-xl p-6">
        <!-- 헤더 -->
        <div class="flex items-start justify-between gap-2 mb-4">
          <div>
            <h1 class="text-xl font-bold mb-1">{{ til.title }}</h1>
            <div class="flex items-center gap-3 text-sm text-muted-foreground">
              <div class="flex items-center gap-1.5">
                <Avatar class="h-5 w-5">
                  <AvatarImage :src="til.author.avatarUrl ?? ''" />
                  <AvatarFallback class="text-xs">{{ (til.author.nickname || til.author.name).slice(0, 1) }}</AvatarFallback>
                </Avatar>
                <span>{{ til.author.nickname || til.author.name }}</span>
              </div>
              <span>{{ formatDate(til.date) }}</span>
            </div>
          </div>
          <div v-if="isOwner" class="flex gap-2 shrink-0">
            <NuxtLink :to="`/til/${til.id}/edit`">
              <Button variant="outline" size="sm">수정</Button>
            </NuxtLink>
            <Button variant="outline" size="sm" class="text-destructive" @click="deleteTil">삭제</Button>
          </div>
        </div>

        <!-- 태그 -->
        <div class="flex gap-1 mb-4" v-if="til.tags.length">
          <Badge v-for="tag in til.tags" :key="tag" variant="secondary" class="text-xs">
            #{{ tag }}
          </Badge>
        </div>

        <!-- 본문 -->
        <ClientOnly>
          <PostMarkdownViewer :content="til.content" />
          <template #fallback>
            <div class="prose dark:prose-invert max-w-none whitespace-pre-wrap text-sm">{{ til.content }}</div>
          </template>
        </ClientOnly>
      </div>
    </template>
  </div>
</template>
