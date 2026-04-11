<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { toast } from 'vue-sonner'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { get: authGet, patch: authPatch } = useAuthFetch()

const postId = route.params.id as string

// ─── 게시글 데이터 ──────────────────────────────────────
interface Post {
  id: string
  title: string
  content: string
  boardId: string
  authorId: string
  board: { id: string; name: string }
  postTags: Array<{ tag: { name: string } }>
}

const postLoaded = ref(false)
const loadError = ref('')
const boardName = ref('')

// ─── 폼 상태 ───────────────────────────────────────────
const form = reactive({
  title: '',
  content: '',
  tags: [] as string[],
})

const errors = reactive({
  title: '',
  content: '',
})

// ─── 게시글 로드 ───────────────────────────────────────
async function fetchPost() {
  try {
    const post = await authGet<Post>(`/posts/${postId}`)

    // 작성자 본인 확인
    if (post.authorId !== authStore.currentUser?.id) {
      await router.replace('/community')
      return
    }

    // 폼 pre-fill
    form.title = post.title
    form.content = post.content
    form.tags = post.postTags.map(pt => pt.tag.name)
    boardName.value = post.board?.name ?? ''

    postLoaded.value = true
  }
  catch {
    loadError.value = '게시글을 불러오는 데 실패했습니다.'
  }
}

// ─── 태그 입력 ─────────────────────────────────────────
const tagInput = ref('')

function addTag() {
  const tag = tagInput.value.trim()
  if (!tag) return
  if (form.tags.includes(tag)) {
    tagInput.value = ''
    return
  }
  if (form.tags.length >= 5) return
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
  if (e.key === 'Backspace' && tagInput.value === '' && form.tags.length > 0) {
    form.tags.pop()
  }
}

// ─── 유효성 검사 ───────────────────────────────────────
function validate(): boolean {
  let isValid = true
  errors.title = ''
  errors.content = ''

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
    await authPatch(`/posts/${postId}`, {
      title: form.title.trim(),
      content: form.content,
      tags: form.tags,
    })
    await router.push(`/community/${postId}`)
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number; data?: { message?: string } }
    if (err?.statusCode === 401) {
      await router.push('/auth/login')
    }
    else {
      toast.error(err?.data?.message || '게시글 수정에 실패했습니다. 다시 시도해주세요.')
    }
  }
  finally {
    isSubmitting.value = false
  }
}

// ─── 마운트 ────────────────────────────────────────────
useHead({ title: '게시글 수정 - FLOWIT' })

onMounted(() => {
  fetchPost()
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
      <h1 class="text-xl font-bold text-foreground">게시글 수정</h1>
    </div>

    <!-- 로드 에러 -->
    <div v-if="loadError" class="flex flex-col items-center justify-center py-20 gap-4">
      <Icon icon="heroicons:exclamation-triangle" class="w-10 h-10 text-destructive" />
      <p class="text-muted-foreground">{{ loadError }}</p>
      <Button variant="outline" @click="router.back()">
        돌아가기
      </Button>
    </div>

    <!-- 로딩 중 -->
    <div v-else-if="!postLoaded" class="space-y-6">
      <div class="h-10 bg-muted rounded-md animate-pulse" />
      <div class="h-10 bg-muted rounded-md animate-pulse" />
      <div class="h-10 bg-muted rounded-md animate-pulse" />
      <div class="h-[500px] bg-muted rounded-md animate-pulse" />
    </div>

    <!-- 폼 -->
    <form v-else class="space-y-6" @submit.prevent="handleSubmit">
      <!-- 게시판 (수정 불가, 읽기 전용 표시) -->
      <div class="space-y-2">
        <Label>게시판</Label>
        <div class="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground">
          {{ boardName }}
          <span class="ml-2 text-xs">(게시판은 변경할 수 없습니다)</span>
        </div>
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
      <!-- postLoaded 이후에만 렌더링 → 에디터 마운트 시 form.content에 이미 값이 있음 -->
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
        <!-- 취소 버튼 -->
        <Button type="button" variant="outline" :disabled="isSubmitting" @click="showCancelDialog = true">
          취소
        </Button>
        <AlertDialog v-model:open="showCancelDialog">
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>수정을 취소하시겠습니까?</AlertDialogTitle>
              <AlertDialogDescription>
                변경된 내용은 저장되지 않습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>계속 수정</AlertDialogCancel>
              <AlertDialogAction @click="router.back()">
                나가기
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <!-- 수정 완료 버튼 -->
        <Button type="submit" :disabled="isSubmitting">
          <Icon v-if="isSubmitting" icon="heroicons:arrow-path" class="mr-2 w-4 h-4 animate-spin" />
          {{ isSubmitting ? '수정 중...' : '수정 완료' }}
        </Button>
      </div>
    </form>
  </div>
</template>
