<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

definePageMeta({ layout: 'default', middleware: 'auth' })
useHead({ title: '워크스페이스 만들기 - FLOWIT' })

const router = useRouter()
const { post: authPost } = useAuthFetch()

const TECH_PRESETS = ['React', 'Vue', 'Next.js', 'NestJS', 'Express', 'TypeScript', 'Python', 'FastAPI', 'PostgreSQL', 'MongoDB', 'Docker', 'AWS']

const form = reactive({
  type: 'PROJECT' as 'PROJECT' | 'STUDY',
  name: '',
  description: '',
  techStack: [] as string[],
  githubUrl: '',
  isPublic: false,
})

const errors = reactive({ name: '', description: '' })

function toggleTech(t: string) {
  const idx = form.techStack.indexOf(t)
  if (idx === -1) form.techStack.push(t)
  else form.techStack.splice(idx, 1)
}

function validate() {
  errors.name = ''
  errors.description = ''
  if (!form.name.trim()) { errors.name = '이름을 입력해주세요.'; return false }
  return true
}

const isSubmitting = ref(false)

async function handleSubmit() {
  if (!validate()) return
  isSubmitting.value = true
  try {
    const body: Record<string, unknown> = {
      type: form.type,
      name: form.name.trim(),
    }
    if (form.description.trim()) body.description = form.description.trim()
    if (form.techStack.length) body.techStack = form.techStack
    if (form.githubUrl.trim()) body.githubUrl = form.githubUrl.trim()
    body.isPublic = form.isPublic

    const result = await authPost<{ id: string }>('/workspaces', body)
    await router.push(`/workspaces/${result.id}`)
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, data?: { message?: string } }
    alert(err?.data?.message || '워크스페이스 생성에 실패했습니다.')
  }
  finally { isSubmitting.value = false }
}
</script>

<template>
  <div class="container max-w-2xl py-8">
    <!-- 헤더 -->
    <div class="flex items-center gap-3 mb-8">
      <button
        class="text-muted-foreground hover:text-foreground transition-colors"
        @click="router.back()"
      >
        <Icon
          icon="heroicons:arrow-left"
          class="w-5 h-5"
        />
      </button>
      <h1 class="text-xl font-bold text-foreground">
        새 워크스페이스 만들기
      </h1>
    </div>

    <form
      class="space-y-6"
      @submit.prevent="handleSubmit"
    >
      <!-- 유형 선택 -->
      <div class="space-y-2">
        <Label>유형 <span class="text-destructive">*</span></Label>
        <div class="grid grid-cols-2 gap-3">
          <button
            v-for="t in [{ label: '프로젝트', value: 'PROJECT', icon: 'heroicons:code-bracket', desc: '사이드 프로젝트, 팀 개발' }, { label: '스터디', value: 'STUDY', icon: 'heroicons:academic-cap', desc: '기술 스터디, 학습 그룹' }]"
            :key="t.value"
            type="button"
            class="flex flex-col items-start p-4 rounded-xl border-2 transition-colors text-left"
            :class="form.type === t.value
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-muted-foreground'"
            @click="form.type = t.value as 'PROJECT' | 'STUDY'"
          >
            <Icon
              :icon="t.icon"
              class="w-6 h-6 mb-2"
              :class="form.type === t.value ? 'text-primary' : 'text-muted-foreground'"
            />
            <span class="font-medium text-sm">{{ t.label }}</span>
            <span class="text-xs text-muted-foreground mt-0.5">{{ t.desc }}</span>
          </button>
        </div>
      </div>

      <!-- 이름 -->
      <div class="space-y-2">
        <Label for="name">이름 <span class="text-destructive">*</span></Label>
        <Input
          id="name"
          v-model="form.name"
          placeholder="예: FLOWIT MVP 개발"
          maxlength="100"
          :class="errors.name ? 'border-destructive' : ''"
        />
        <p
          v-if="errors.name"
          class="text-sm text-destructive"
        >
          {{ errors.name }}
        </p>
      </div>

      <!-- 설명 -->
      <div class="space-y-2">
        <Label for="description">설명 <span class="text-xs text-muted-foreground">(선택)</span></Label>
        <textarea
          id="description"
          v-model="form.description"
          placeholder="워크스페이스에 대한 간단한 설명을 입력하세요"
          rows="3"
          class="w-full px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground resize-y focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <!-- 기술 스택 -->
      <div class="space-y-2">
        <Label>기술 스택 <span class="text-xs text-muted-foreground">(선택)</span></Label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="tech in TECH_PRESETS"
            :key="tech"
            type="button"
            class="px-3 py-1.5 text-xs font-medium rounded-full border transition-colors"
            :class="form.techStack.includes(tech)
              ? 'bg-primary text-primary-foreground border-primary'
              : 'border-border text-muted-foreground hover:text-foreground hover:bg-accent'"
            @click="toggleTech(tech)"
          >
            {{ tech }}
          </button>
        </div>
      </div>

      <!-- GitHub (프로젝트만) -->
      <div
        v-if="form.type === 'PROJECT'"
        class="space-y-2"
      >
        <Label for="github">GitHub URL <span class="text-xs text-muted-foreground">(선택)</span></Label>
        <Input
          id="github"
          v-model="form.githubUrl"
          placeholder="https://github.com/..."
        />
      </div>

      <!-- 공개 여부 -->
      <div class="flex items-center justify-between p-4 border border-border rounded-xl">
        <div>
          <p class="text-sm font-medium">
            공개 워크스페이스
          </p>
          <p class="text-xs text-muted-foreground">
            팀원 모집 시 팀원들에게 프로젝트가 공개됩니다
          </p>
        </div>
        <button
          type="button"
          class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
          :class="form.isPublic ? 'bg-primary' : 'bg-muted'"
          @click="form.isPublic = !form.isPublic"
        >
          <span
            class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
            :class="form.isPublic ? 'translate-x-6' : 'translate-x-1'"
          />
        </button>
      </div>

      <!-- 하단 버튼 -->
      <div class="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <Button
          type="button"
          variant="outline"
          @click="router.back()"
        >
          취소
        </Button>
        <Button
          type="submit"
          :disabled="isSubmitting"
        >
          <Icon
            v-if="isSubmitting"
            icon="heroicons:arrow-path"
            class="mr-2 w-4 h-4 animate-spin"
          />
          {{ isSubmitting ? '생성 중...' : '워크스페이스 만들기' }}
        </Button>
      </div>
    </form>
  </div>
</template>
