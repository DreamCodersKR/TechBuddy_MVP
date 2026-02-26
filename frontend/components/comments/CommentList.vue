<script setup lang="ts">
import type { Comment } from './CommentItem.vue'

const props = defineProps<{
  postId: string
  initialComments: Comment[]
}>()

const emit = defineEmits<{
  countChange: [delta: number]
}>()

const authStore = useAuthStore()
const { post: authPost, patch: authPatch, delete: authDelete } = useAuthFetch()

// ─── 로컬 댓글 목록 ─────────────────────────────────────
const comments = ref<Comment[]>([...props.initialComments])

// ─── 작성 ──────────────────────────────────────────────
const submitting = ref(false)

async function handleSubmit(content: string) {
  submitting.value = true
  try {
    const newComment = await authPost<Comment>('/comments', {
      postId: props.postId,
      content,
    })
    comments.value.push(newComment)
    emit('countChange', 1)
  }
  catch {
    alert('댓글 등록에 실패했습니다.')
  }
  finally {
    submitting.value = false
  }
}

// ─── 수정 ──────────────────────────────────────────────
async function handleUpdate(id: string, content: string) {
  try {
    const updated = await authPatch<Comment>(`/comments/${id}`, { content })
    const idx = comments.value.findIndex(c => c.id === id)
    if (idx !== -1) {
      comments.value[idx] = { ...comments.value[idx]!, ...updated }
    }
  }
  catch {
    alert('댓글 수정에 실패했습니다.')
  }
}

// ─── 삭제 ──────────────────────────────────────────────
async function handleDelete(id: string) {
  try {
    await authDelete(`/comments/${id}`)
    comments.value = comments.value.filter(c => c.id !== id)
    emit('countChange', -1)
  }
  catch {
    alert('댓글 삭제에 실패했습니다.')
  }
}
</script>

<template>
  <div>
    <!-- 댓글 목록 -->
    <ul v-if="comments.length > 0" class="space-y-5 mb-6">
      <CommentsCommentItem
        v-for="comment in comments"
        :key="comment.id"
        :comment="comment"
        :is-author="authStore.isAuthenticated && comment.author.id === authStore.currentUser?.id"
        @update="handleUpdate"
        @delete="handleDelete"
      />
    </ul>

    <div v-else class="text-center py-8 text-muted-foreground text-sm mb-6">
      첫 댓글을 남겨보세요.
    </div>

    <!-- 댓글 작성 폼 (로그인 사용자만) -->
    <div v-if="authStore.isAuthenticated">
      <div class="border-t border-border pt-4">
        <CommentsCommentForm :submitting="submitting" @submit="handleSubmit" />
      </div>
    </div>

    <div v-else class="border-t border-border pt-4 text-center">
      <p class="text-sm text-muted-foreground">
        댓글을 작성하려면
        <NuxtLink to="/auth/login" class="text-primary underline underline-offset-2">
          로그인
        </NuxtLink>
        이 필요합니다.
      </p>
    </div>
  </div>
</template>
