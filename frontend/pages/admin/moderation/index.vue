<script setup lang="ts">
import { toast } from 'vue-sonner'
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'
import { formatDateISO, truncateText } from '@/utils/formatters'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: '콘텐츠 관리 - FLOWIT Admin' })

const { get: authGet, patch: authPatch } = useAuthFetch()

// ─── 타입 ────────────────────────────────────────────────
type ContentType = '' | 'post' | 'comment' | 'agora' | 'agoraAnswer'

interface ModerationItem {
  id: string
  type: 'post' | 'comment' | 'agora' | 'agoraAnswer'
  title: string | null
  content: string
  createdAt: string
  author: {
    id: string
    name: string
    nickname: string | null
  }
}

const TYPE_LABELS: Record<string, string> = {
  post: '게시글',
  comment: '댓글',
  agora: '아고라',
  agoraAnswer: '아고라 답변',
}

const FILTER_OPTIONS: { value: ContentType; label: string }[] = [
  { value: '', label: '전체' },
  { value: 'post', label: '게시글' },
  { value: 'comment', label: '댓글' },
  { value: 'agora', label: '아고라' },
  { value: 'agoraAnswer', label: '아고라 답변' },
]

// ─── 상태 ────────────────────────────────────────────────
const items = ref<ModerationItem[]>([])
const loading = ref(false)
const typeFilter = ref<ContentType>('')
const restoringId = ref<string | null>(null)

// ─── 데이터 로드 ────────────────────────────────────────
async function loadItems() {
  loading.value = true
  try {
    const params = typeFilter.value ? `?type=${typeFilter.value}` : ''
    items.value = await authGet<ModerationItem[]>(`/admin/moderation${params}`)
  }
  catch {
    items.value = []
  }
  finally {
    loading.value = false
  }
}

// ─── 콘텐츠 복원 ────────────────────────────────────────
async function restoreItem(item: ModerationItem) {
  if (!confirm(`이 ${TYPE_LABELS[item.type]}을(를) 복원하시겠습니까?`)) return
  restoringId.value = item.id
  try {
    await authPatch(`/admin/moderation/${item.type}/${item.id}/restore`, {})
    items.value = items.value.filter(i => i.id !== item.id)
  }
  catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    toast.error(err?.data?.message || '복원에 실패했습니다.')
  }
  finally {
    restoringId.value = null
  }
}

const formatDate = formatDateISO

watch(typeFilter, () => {
  loadItems()
})

onMounted(() => {
  loadItems()
})
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-xl font-bold text-foreground">
          콘텐츠 관리
        </h1>
        <p class="text-sm text-muted-foreground mt-0.5">
          숨김 처리된 콘텐츠를 확인하고 복원할 수 있습니다
        </p>
      </div>
      <p
        v-if="items.length > 0"
        class="text-sm text-muted-foreground"
      >
        {{ items.length }}건
      </p>
    </div>

    <!-- 필터 -->
    <div class="flex items-center gap-2 mb-4">
      <button
        v-for="option in FILTER_OPTIONS"
        :key="option.value"
        class="px-3 py-1.5 text-xs rounded-md border transition-colors"
        :class="typeFilter === option.value
          ? 'bg-primary text-primary-foreground border-primary'
          : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground'"
        @click="typeFilter = option.value"
      >
        {{ option.label }}
      </button>
    </div>

    <!-- 테이블 -->
    <div class="bg-background border border-border rounded-xl overflow-hidden">
      <!-- 로딩 -->
      <div
        v-if="loading"
        class="flex items-center justify-center h-32"
      >
        <Icon icon="heroicons:arrow-path" class="w-5 h-5 animate-spin text-muted-foreground" />
      </div>

      <!-- 빈 상태 -->
      <div
        v-else-if="items.length === 0"
        class="flex flex-col items-center justify-center py-12 text-center"
      >
        <Icon icon="heroicons:shield-check" class="w-10 h-10 text-muted-foreground mb-3" />
        <p class="text-sm text-muted-foreground">
          숨겨진 콘텐츠가 없습니다
        </p>
      </div>

      <!-- 목록 테이블 -->
      <table
        v-else
        class="w-full text-sm"
      >
        <thead class="bg-muted/50">
          <tr>
            <th class="text-left px-4 py-3 text-xs font-medium text-muted-foreground w-24">
              유형
            </th>
            <th class="text-left px-4 py-3 text-xs font-medium text-muted-foreground w-28">
              작성자
            </th>
            <th class="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
              내용
            </th>
            <th class="text-left px-4 py-3 text-xs font-medium text-muted-foreground w-28">
              작성일
            </th>
            <th class="px-4 py-3 w-20" />
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          <tr
            v-for="item in items"
            :key="item.id"
            class="hover:bg-muted/30 transition-colors"
          >
            <td class="px-4 py-3">
              <span
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                :class="{
                  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400': item.type === 'post',
                  'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400': item.type === 'comment',
                  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400': item.type === 'agora',
                  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400': item.type === 'agoraAnswer',
                }"
              >
                {{ TYPE_LABELS[item.type] }}
              </span>
            </td>
            <td class="px-4 py-3">
              <p class="text-xs font-medium text-foreground truncate">
                {{ item.author.nickname ?? item.author.name }}
              </p>
            </td>
            <td class="px-4 py-3">
              <p
                v-if="item.title"
                class="text-xs font-medium text-foreground mb-0.5 truncate"
              >
                {{ item.title }}
              </p>
              <p class="text-xs text-muted-foreground truncate max-w-md">
                {{ truncateText(item.content) }}
              </p>
            </td>
            <td class="px-4 py-3 text-xs text-muted-foreground">
              {{ formatDate(item.createdAt) }}
            </td>
            <td class="px-4 py-3">
              <Button
                variant="outline"
                size="sm"
                class="h-7 text-xs"
                :disabled="restoringId === item.id"
                @click="restoreItem(item)"
              >
                <Icon
                  v-if="restoringId === item.id"
                  icon="heroicons:arrow-path"
                  class="w-3.5 h-3.5 mr-1 animate-spin"
                />
                복원
              </Button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
