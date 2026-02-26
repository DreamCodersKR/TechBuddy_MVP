<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Author {
  id: string
  name: string
  nickname: string | null
  avatarUrl: string | null
}

export interface Comment {
  id: string
  content: string
  author: Author
  createdAt: string
  parentId: string | null
}

const props = defineProps<{
  comment: Comment
  isAuthor: boolean
}>()

const emit = defineEmits<{
  update: [id: string, content: string]
  delete: [id: string]
}>()

// ─── 수정 ──────────────────────────────────────────────
const isEditing = ref(false)
const editContent = ref('')
const isUpdating = ref(false)

function startEdit() {
  editContent.value = props.comment.content
  isEditing.value = true
}

function cancelEdit() {
  isEditing.value = false
  editContent.value = ''
}

async function submitEdit() {
  const trimmed = editContent.value.trim()
  if (!trimmed || isUpdating.value) return
  isUpdating.value = true
  emit('update', props.comment.id, trimmed)
  isEditing.value = false
  isUpdating.value = false
}

// ─── 삭제 ──────────────────────────────────────────────
const showDeleteDialog = ref(false)

// ─── 날짜 포맷 ─────────────────────────────────────────
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMin = Math.floor((now.getTime() - date.getTime()) / 60000)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffMin < 1) return '방금 전'
  if (diffMin < 60) return `${diffMin}분 전`
  if (diffHour < 24) return `${diffHour}시간 전`
  if (diffDay < 7) return `${diffDay}일 전`
  return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
}
</script>

<template>
  <li class="flex gap-3">
    <!-- 아바타 -->
    <div class="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden mt-0.5">
      <img
        v-if="comment.author.avatarUrl"
        :src="comment.author.avatarUrl"
        :alt="comment.author.nickname || comment.author.name"
        class="w-full h-full object-cover"
      >
      <Icon v-else icon="heroicons:user-circle" class="w-5 h-5 text-muted-foreground" />
    </div>

    <!-- 내용 -->
    <div class="flex-1 min-w-0">
      <!-- 헤더: 작성자 + 날짜 + 액션 -->
      <div class="flex items-center justify-between gap-2 mb-1">
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium text-foreground">
            {{ comment.author.nickname || comment.author.name }}
          </span>
          <span class="text-xs text-muted-foreground">
            {{ formatDate(comment.createdAt) }}
          </span>
        </div>

        <!-- 수정/삭제 (본인만) -->
        <div v-if="isAuthor" class="flex items-center gap-0.5 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            class="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
            @click="startEdit"
          >
            수정
          </Button>
          <Button
            variant="ghost"
            size="sm"
            class="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
            @click="showDeleteDialog = true"
          >
            삭제
          </Button>
        </div>
      </div>

      <!-- 인라인 편집 모드 -->
      <div v-if="isEditing" class="mt-1">
        <textarea
          v-model="editContent"
          rows="3"
          class="w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          @keydown.escape="cancelEdit"
        />
        <div class="flex justify-end gap-2 mt-1.5">
          <Button variant="ghost" size="sm" class="h-7 text-xs" @click="cancelEdit">
            취소
          </Button>
          <Button size="sm" class="h-7 text-xs" :disabled="!editContent.trim() || isUpdating" @click="submitEdit">
            저장
          </Button>
        </div>
      </div>

      <!-- 댓글 내용 -->
      <p v-else class="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
        {{ comment.content }}
      </p>
    </div>

    <!-- 삭제 확인 다이얼로그 -->
    <AlertDialog v-model:open="showDeleteDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>댓글을 삭제하시겠습니까?</AlertDialogTitle>
          <AlertDialogDescription>
            삭제된 댓글은 복구할 수 없습니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction @click="emit('delete', comment.id)">
            삭제
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </li>
</template>
