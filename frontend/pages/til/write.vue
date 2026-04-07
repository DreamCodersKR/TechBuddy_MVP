<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

definePageMeta({ layout: 'default', middleware: 'auth' })
useHead({ title: 'TIL 작성 - FLOWIT' })

const { post: authPost } = useAuthFetch()
const router = useRouter()

const title = ref('')
const content = ref('')
const tagInput = ref('')
const tags = ref<string[]>([])
const submitting = ref(false)
const error = ref('')

function addTag() {
  const tag = tagInput.value.trim().replace(/^#/, '')
  if (tag && !tags.value.includes(tag) && tags.value.length < 5) {
    tags.value.push(tag)
    tagInput.value = ''
  }
}
function removeTag(tag: string) { tags.value = tags.value.filter(t => t !== tag) }
function onTagKey(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() }
}

async function submit() {
  if (!title.value.trim() || !content.value.trim()) {
    error.value = '제목과 내용을 입력해주세요'
    return
  }
  submitting.value = true
  error.value = ''
  try {
    const res = await authPost<{ id: string }>('/tils', {
      title: title.value,
      content: content.value,
      tags: tags.value,
    })
    router.push(`/til/${res.id}`)
  } catch (e: any) {
    error.value = e?.data?.message || '작성에 실패했습니다'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto py-8 px-4">
    <div class="flex items-center gap-2 mb-6">
      <NuxtLink to="/til" class="text-muted-foreground hover:text-foreground">
        <Icon icon="heroicons:arrow-left" class="w-5 h-5" />
      </NuxtLink>
      <h1 class="text-xl font-bold">오늘의 TIL 작성</h1>
    </div>

    <div class="bg-card border border-border rounded-xl p-6 space-y-4">
      <!-- 제목 -->
      <div>
        <label class="text-sm font-medium mb-1 block">제목</label>
        <Input v-model="title" placeholder="오늘 배운 것을 한 줄로 요약해보세요" maxlength="100" />
      </div>

      <!-- 내용 (마크다운) -->
      <div>
        <label class="text-sm font-medium mb-1 block">내용 <span class="text-xs text-muted-foreground">(마크다운 지원)</span></label>
        <textarea
          v-model="content"
          rows="12"
          placeholder="오늘 배운 것을 자유롭게 작성하세요..."
          class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y min-h-[200px]"
        />
      </div>

      <!-- 태그 -->
      <div>
        <label class="text-sm font-medium mb-1 block">태그 <span class="text-xs text-muted-foreground">(최대 5개)</span></label>
        <div class="flex flex-wrap gap-1 mb-2">
          <Badge
            v-for="tag in tags" :key="tag"
            variant="secondary"
            class="cursor-pointer text-xs"
            @click="removeTag(tag)"
          >
            #{{ tag }} <Icon icon="heroicons:x-mark" class="w-3 h-3 ml-0.5" />
          </Badge>
        </div>
        <Input
          v-model="tagInput"
          placeholder="태그 입력 후 Enter (예: NestJS)"
          @keydown="onTagKey"
          @blur="addTag"
          :disabled="tags.length >= 5"
        />
      </div>

      <!-- 에러 -->
      <p v-if="error" class="text-sm text-destructive">{{ error }}</p>

      <div class="flex justify-end gap-2">
        <NuxtLink to="/til"><Button variant="outline">취소</Button></NuxtLink>
        <Button @click="submit" :disabled="submitting">
          <Icon v-if="submitting" icon="heroicons:arrow-path" class="w-4 h-4 mr-1 animate-spin" />
          {{ submitting ? '작성 중...' : 'TIL 작성' }}
        </Button>
      </div>
    </div>
  </div>
</template>
