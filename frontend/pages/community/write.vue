<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

// 인증 필요 페이지
definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

useHead({ title: '게시글 작성 - FLOWIT' })

const router = useRouter()
const authStore = useAuthStore()
const { post: authPost } = useAuthFetch()

// ─── 게시판 목록 ───────────────────────────────────────
interface Board {
  id: string
  name: string
  description: string | null
}

const boards = ref<Board[]>([])
const boardsLoading = ref(true)

async function fetchBoards() {
  try {
    const result = await $fetch<Board[]>(`${authStore.apiBaseUrl}/boards`)
    boards.value = result
  }
  catch {
    // 게시판 목록 로드 실패 시 빈 배열 유지
  }
  finally {
    boardsLoading.value = false
  }
}

// ─── 폼 상태 ───────────────────────────────────────────
const form = reactive({
  boardId: '',
  title: '',
  content: '',
  tags: [] as string[],
})

const errors = reactive({
  boardId: '',
  title: '',
  content: '',
})

// ─── 태그 입력 ─────────────────────────────────────────
const tagInput = ref('')

function addTag() {
  const tag = tagInput.value.trim()
  if (!tag) return
  if (form.tags.includes(tag)) {
    tagInput.value = ''
    return
  }
  if (form.tags.length >= 5) return // 최대 5개
  form.tags.push(tag)
  tagInput.value = ''
}

function removeTag(tag: string) {
  form.tags = form.tags.filter(t => t !== tag)
}

function onTagKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault()
    addTag()
  }
  // 백스페이스로 마지막 태그 제거
  if (e.key === 'Backspace' && tagInput.value === '' && form.tags.length > 0) {
    form.tags.pop()
  }
}

// ─── 유효성 검사 ───────────────────────────────────────
function validate(): boolean {
  let isValid = true
  errors.boardId = ''
  errors.title = ''
  errors.content = ''

  if (!form.boardId) {
    errors.boardId = '게시판을 선택해주세요.'
    isValid = false
  }
  if (!form.title.trim()) {
    errors.title = '제목을 입력해주세요.'
    isValid = false
  }
  if (form.title.length > 200) {
    errors.title = '제목은 200자 이내로 입력해주세요.'
    isValid = false
  }
  if (!form.content.trim()) {
    errors.content = '내용을 입력해주세요.'
    isValid = false
  }
  return isValid
}

// ─── 취소 다이얼로그 ────────────────────────────────────
const showCancelDialog = ref(false)

// ─── 제출 ──────────────────────────────────────────────
const isSubmitting = ref(false)

async function handleSubmit() {
  if (!validate()) return
  isSubmitting.value = true

  try {
    const result = await authPost<{ id: string }>('/posts', {
      boardId: form.boardId,
      title: form.title.trim(),
      content: form.content,
      tags: form.tags,
    })
    await router.push(`/community/${result.id}`)
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number; data?: { message?: string } }
    if (err?.statusCode === 401) {
      await router.push('/auth/login')
    }
    else {
      alert(err?.data?.message || '게시글 작성에 실패했습니다. 다시 시도해주세요.')
    }
  }
  finally {
    isSubmitting.value = false
  }
}

// ─── 마운트 ────────────────────────────────────────────
onMounted(() => {
  fetchBoards()
})
</script>

<template>
  <div class="container max-w-4xl py-8">
    <!-- 헤더 -->
    <div class="flex items-center gap-3 mb-8">
      <button
        class="text-muted-foreground hover:text-foreground transition-colors"
        @click="router.back()"
      >
        <Icon icon="heroicons:arrow-left" class="w-5 h-5" />
      </button>
      <h1 class="text-xl font-bold text-foreground">게시글 작성</h1>
    </div>

    <form class="space-y-6" @submit.prevent="handleSubmit">
      <!-- 게시판 선택 -->
      <div class="space-y-2">
        <Label for="board">게시판 <span class="text-destructive">*</span></Label>
        <Select v-model="form.boardId" :disabled="boardsLoading">
          <SelectTrigger id="board" :class="errors.boardId ? 'border-destructive' : ''">
            <SelectValue :placeholder="boardsLoading ? '게시판 목록 불러오는 중...' : '게시판을 선택하세요'" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="board in boards"
              :key="board.id"
              :value="board.id"
            >
              {{ board.name }}
            </SelectItem>
          </SelectContent>
        </Select>
        <p v-if="errors.boardId" class="text-sm text-destructive">
          {{ errors.boardId }}
        </p>
      </div>

      <!-- 제목 -->
      <div class="space-y-2">
        <Label for="title">제목 <span class="text-destructive">*</span></Label>
        <Input
          id="title"
          v-model="form.title"
          placeholder="제목을 입력하세요"
          maxlength="200"
          :class="errors.title ? 'border-destructive' : ''"
        />
        <div class="flex justify-between items-center">
          <p v-if="errors.title" class="text-sm text-destructive">
            {{ errors.title }}
          </p>
          <p class="text-xs text-muted-foreground ml-auto">
            {{ form.title.length }}/200
          </p>
        </div>
      </div>

      <!-- 태그 입력 -->
      <div class="space-y-2">
        <Label>태그 <span class="text-xs text-muted-foreground font-normal">(최대 5개, Enter 또는 콤마로 추가)</span></Label>
        <div class="flex flex-wrap gap-2 min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
          <!-- 추가된 태그 칩 -->
          <span
            v-for="tag in form.tags"
            :key="tag"
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
          >
            {{ tag }}
            <button
              type="button"
              class="hover:text-destructive transition-colors"
              @click="removeTag(tag)"
            >
              <Icon icon="heroicons:x-mark" class="w-3 h-3" />
            </button>
          </span>
          <!-- 태그 입력 필드 -->
          <input
            v-model="tagInput"
            type="text"
            placeholder="태그 입력 후 Enter"
            class="flex-1 min-w-24 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
            :disabled="form.tags.length >= 5"
            @keydown="onTagKeydown"
            @blur="addTag"
          />
        </div>
      </div>

      <!-- 본문 (마크다운 에디터) -->
      <div class="space-y-2">
        <Label>내용 <span class="text-destructive">*</span></Label>
        <PostMarkdownEditor
          v-model="form.content"
          height="500px"
        />
        <p v-if="errors.content" class="text-sm text-destructive">
          {{ errors.content }}
        </p>
      </div>

      <!-- 하단 버튼 -->
      <div class="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <!-- 취소 버튼 (AlertDialog) -->
        <Button type="button" variant="outline" :disabled="isSubmitting" @click="showCancelDialog = true">
          취소
        </Button>
        <AlertDialog v-model:open="showCancelDialog">
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>작성을 취소하시겠습니까?</AlertDialogTitle>
              <AlertDialogDescription>
                작성 중인 내용은 저장되지 않습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>계속 작성</AlertDialogCancel>
              <AlertDialogAction @click="router.back()">
                나가기
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <!-- 작성 완료 버튼 -->
        <Button type="submit" :disabled="isSubmitting">
          <Icon v-if="isSubmitting" icon="heroicons:arrow-path" class="mr-2 w-4 h-4 animate-spin" />
          {{ isSubmitting ? '작성 중...' : '작성 완료' }}
        </Button>
      </div>
    </form>
  </div>
</template>
