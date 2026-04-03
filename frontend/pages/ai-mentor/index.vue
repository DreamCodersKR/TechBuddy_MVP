<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'

definePageMeta({ layout: 'default', middleware: 'auth' })
useHead({ title: 'AI 멘토 - FLOWIT' })

const { get: authGet, delete: authDelete } = useAuthFetch()

interface Conversation {
  id: string
  title: string
  updatedAt: string
  _count: { messages: number }
}

const conversations = ref<Conversation[]>([])
const loading = ref(true)

async function loadConversations() {
  loading.value = true
  try {
    conversations.value = await authGet<Conversation[]>('/ai-mentor/conversations')
  }
  catch { conversations.value = [] }
  finally { loading.value = false }
}

async function handleDelete(id: string, e: Event) {
  e.stopPropagation()
  if (!confirm('이 대화를 삭제하시겠습니까?')) return
  try {
    await authDelete(`/ai-mentor/conversations/${id}`)
    conversations.value = conversations.value.filter(c => c.id !== id)
  }
  catch { alert('삭제에 실패했습니다.') }
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '방금 전'
  if (mins < 60) return `${mins}분 전`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}일 전`
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

onMounted(() => { loadConversations() })
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- 헤더 -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-foreground flex items-center gap-2">
          <Icon icon="heroicons:sparkles" class="w-6 h-6 text-violet-500" />
          AI 멘토
        </h1>
        <p class="text-sm text-muted-foreground mt-1">
          코드, 설계, 문서 등 다양한 질문을 AI에게 물어보세요
        </p>
      </div>
      <Button @click="navigateTo('/ai-mentor/new')">
        <Icon icon="heroicons:plus" class="w-4 h-4 mr-2" />
        새 질문
      </Button>
    </div>

    <!-- 로딩 -->
    <template v-if="loading">
      <div class="space-y-3">
        <div
          v-for="n in 4"
          :key="n"
          class="border border-border rounded-xl p-4 flex items-center gap-3"
        >
          <div class="w-9 h-9 bg-muted rounded-lg animate-pulse" />
          <div class="flex-1 space-y-2">
            <div class="h-4 bg-muted animate-pulse rounded w-2/3" />
            <div class="h-3 bg-muted animate-pulse rounded w-1/4" />
          </div>
        </div>
      </div>
    </template>

    <!-- 목록 -->
    <template v-else-if="conversations.length > 0">
      <div class="space-y-2">
        <div
          v-for="conv in conversations"
          :key="conv.id"
          class="border border-border rounded-xl p-4 hover:bg-accent/30 cursor-pointer transition-colors group flex items-center gap-3"
          @click="navigateTo(`/ai-mentor/${conv.id}`)"
        >
          <div class="flex-shrink-0 w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
            <Icon icon="heroicons:sparkles" class="w-4 h-4 text-violet-600 dark:text-violet-400" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-foreground truncate">
              {{ conv.title }}
            </p>
            <p class="text-xs text-muted-foreground mt-0.5">
              메시지 {{ conv._count.messages }}개 · {{ formatDate(conv.updatedAt) }}
            </p>
          </div>
          <button
            class="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive"
            @click="handleDelete(conv.id, $event)"
          >
            <Icon icon="heroicons:trash" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </template>

    <!-- 빈 상태 -->
    <div
      v-else
      class="flex flex-col items-center justify-center py-20 text-center"
    >
      <div class="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-4">
        <Icon icon="heroicons:sparkles" class="w-8 h-8 text-violet-500" />
      </div>
      <h2 class="text-lg font-semibold text-foreground mb-2">
        아직 AI 멘토링 기록이 없어요
      </h2>
      <p class="text-sm text-muted-foreground mb-6">
        태스크가 막힐 때 AI 멘토에게 질문해보세요
      </p>
      <Button @click="navigateTo('/ai-mentor/new')">
        <Icon icon="heroicons:plus" class="w-4 h-4 mr-2" />
        첫 질문 시작하기
      </Button>
    </div>
  </div>
</template>
