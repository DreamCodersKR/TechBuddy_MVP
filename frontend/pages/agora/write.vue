<script setup lang="ts">
import { toast } from 'vue-sonner'
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

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

useHead({ title: '질문 작성 - FLOWIT' })

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { post: authPost } = useAuthFetch()

// ─── 폼 상태 ──────────────────────────────────────────────
const form = reactive({
  title: (route.query.title as string) || '',
  content: (route.query.content as string) || '',
  bounty: 10,
})

const customBounty = ref('')
const isCustomMode = ref(false)
const errors = reactive({ title: '', content: '', bounty: '' })

const presets = [1, 10, 50, 100]
const userCredit = computed(() => authStore.currentUser?.credit ?? 0)

function selectPreset(value: number) {
  isCustomMode.value = false
  form.bounty = value
  customBounty.value = ''
}

watch(customBounty, (val) => {
  const n = parseInt(val)
  if (!isNaN(n) && n > 0) {
    form.bounty = n
    isCustomMode.value = true
  }
})

// ─── 유효성 검사 ──────────────────────────────────────────
function validate(): boolean {
  let valid = true
  errors.title = ''
  errors.content = ''
  errors.bounty = ''

  if (!form.title.trim()) {
    errors.title = '제목을 입력해주세요.'
    valid = false
  }
  if (!form.content.trim()) {
    errors.content = '내용을 입력해주세요.'
    valid = false
  }
  if (form.bounty < 1) {
    errors.bounty = '현상금은 최소 1크레딧이어야 합니다.'
    valid = false
  }
  if (form.bounty > userCredit.value) {
    errors.bounty = `현재 크레딧(${userCredit.value}cr)이 부족합니다.`
    valid = false
  }
  return valid
}

// ─── 제출 ─────────────────────────────────────────────────
const isSubmitting = ref(false)
const showCancelDialog = ref(false)

async function handleSubmit() {
  if (!validate()) return
  isSubmitting.value = true
  try {
    const result = await authPost<{ id: string }>('/agora', {
      title: form.title.trim(),
      content: form.content,
      bounty: form.bounty,
    })
    await router.push(`/agora/${result.id}`)
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number; data?: { message?: string } }
    if (err?.statusCode === 401) {
      await router.push('/auth/login')
    }
    else {
      toast.error(err?.data?.message || '질문 작성에 실패했습니다.')
    }
  }
  finally {
    isSubmitting.value = false
  }
}
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
      <h1 class="text-xl font-bold text-foreground">질문 작성</h1>
    </div>

    <form class="space-y-6" @submit.prevent="handleSubmit">
      <!-- 제목 -->
      <div class="space-y-2">
        <Label for="title">제목 <span class="text-destructive">*</span></Label>
        <Input
          id="title"
          v-model="form.title"
          placeholder="질문 제목을 입력하세요"
          maxlength="200"
          :class="errors.title ? 'border-destructive' : ''"
        />
        <div class="flex justify-between items-center">
          <p v-if="errors.title" class="text-sm text-destructive">{{ errors.title }}</p>
          <p class="text-xs text-muted-foreground ml-auto">{{ form.title.length }}/200</p>
        </div>
      </div>

      <!-- 현상금 설정 -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <Label>현상금 <span class="text-destructive">*</span></Label>
          <span class="text-xs text-muted-foreground">
            잔액:
            <span class="font-semibold text-amber-500">💎 {{ userCredit.toLocaleString() }}cr</span>
          </span>
        </div>
        <div class="flex flex-wrap gap-2">
          <!-- 프리셋 버튼 -->
          <button
            v-for="preset in presets"
            :key="preset"
            type="button"
            class="px-3 py-1.5 text-sm font-medium rounded-md border transition-colors"
            :class="!isCustomMode && form.bounty === preset
              ? 'bg-primary text-primary-foreground border-primary'
              : 'border-border text-muted-foreground hover:text-foreground hover:bg-accent'"
            @click="selectPreset(preset)"
          >
            {{ preset }}cr
          </button>
          <!-- 직접 입력 -->
          <div class="flex items-center gap-1.5">
            <input
              v-model="customBounty"
              type="number"
              min="1"
              placeholder="직접입력"
              class="w-24 px-2 py-1.5 text-sm border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              :class="isCustomMode ? 'border-primary' : 'border-border'"
              @focus="isCustomMode = true"
            />
            <span class="text-sm text-muted-foreground">cr</span>
          </div>
        </div>
        <p class="text-sm text-foreground">
          설정된 현상금:
          <span class="font-semibold text-amber-500">💎 {{ form.bounty.toLocaleString() }}cr</span>
        </p>
        <p v-if="errors.bounty" class="text-sm text-destructive">{{ errors.bounty }}</p>
      </div>

      <!-- 본문 (마크다운 에디터) -->
      <div class="space-y-2">
        <Label>내용 <span class="text-destructive">*</span></Label>
        <PostMarkdownEditor
          v-model="form.content"
          height="400px"
        />
        <p v-if="errors.content" class="text-sm text-destructive">{{ errors.content }}</p>
      </div>

      <!-- 하단 버튼 -->
      <div class="flex items-center justify-end gap-3 pt-4 border-t border-border">
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

        <Button type="submit" :disabled="isSubmitting">
          <Icon v-if="isSubmitting" icon="heroicons:arrow-path" class="mr-2 w-4 h-4 animate-spin" />
          {{ isSubmitting ? '작성 중...' : '질문 등록' }}
        </Button>
      </div>
    </form>
  </div>
</template>
