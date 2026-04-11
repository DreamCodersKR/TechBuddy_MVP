<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'vue-sonner'
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

useHead({ title: '모집글 작성 - FLOWIT' })

const router = useRouter()
const { get: authGet, post: authPost } = useAuthFetch()

// ─── 워크스페이스 목록 ────────────────────────────────────
interface Workspace {
  id: string
  name: string
  type: 'PROJECT' | 'STUDY'
}

const workspaces = ref<Workspace[]>([])
const loadingWorkspaces = ref(true)

async function loadWorkspaces() {
  try {
    const res = await authGet<{ data: Workspace[] }>('/workspaces?limit=100')
    workspaces.value = res.data
  }
  catch {
    workspaces.value = []
  }
  finally {
    loadingWorkspaces.value = false
  }
}

// ─── 포지션 프리셋 ────────────────────────────────────────
const POSITION_PRESETS = ['프론트엔드', '백엔드', '풀스택', 'AI/ML', '기획', '디자인', '마케터']

// ─── 폼 상태 ─────────────────────────────────────────────
const form = reactive({
  projectId: '',
  type: 'PROJECT' as 'PROJECT' | 'STUDY',
  title: '',
  description: '',
  positions: [] as string[],
  maxMembers: 4,
  deadline: '',
})

const errors = reactive({
  projectId: '',
  title: '',
  description: '',
  positions: '',
  maxMembers: '',
  deadline: '',
})

// 워크스페이스 선택 시 type 자동 매핑
watch(() => form.projectId, (id) => {
  const ws = workspaces.value.find(w => w.id === id)
  if (ws) form.type = ws.type
})

function togglePosition(pos: string) {
  const idx = form.positions.indexOf(pos)
  if (idx === -1) form.positions.push(pos)
  else form.positions.splice(idx, 1)
}

// ─── 유효성 검사 ─────────────────────────────────────────
function validate(): boolean {
  let valid = true
  errors.projectId = ''
  errors.title = ''
  errors.description = ''
  errors.positions = ''
  errors.maxMembers = ''
  errors.deadline = ''

  if (!form.projectId) {
    errors.projectId = '워크스페이스를 선택해주세요.'
    valid = false
  }
  if (!form.title.trim()) {
    errors.title = '제목을 입력해주세요.'
    valid = false
  }
  if (!form.description.trim()) {
    errors.description = '모집 내용을 입력해주세요.'
    valid = false
  }
  if (form.positions.length === 0) {
    errors.positions = '포지션을 하나 이상 선택해주세요.'
    valid = false
  }
  if (form.maxMembers < 1) {
    errors.maxMembers = '최소 1명 이상이어야 합니다.'
    valid = false
  }
  if (!form.deadline) {
    errors.deadline = '마감일을 선택해주세요.'
    valid = false
  }
  else if (new Date(form.deadline) <= new Date()) {
    errors.deadline = '마감일은 오늘 이후여야 합니다.'
    valid = false
  }
  return valid
}

// ─── 제출 ────────────────────────────────────────────────
const isSubmitting = ref(false)
const showCancelDialog = ref(false)

async function handleSubmit() {
  if (!validate()) return
  isSubmitting.value = true
  try {
    const body: Record<string, unknown> = {
      projectId: form.projectId,
      type: form.type,
      title: form.title.trim(),
      description: form.description.trim(),
      positions: form.positions,
      maxMembers: form.maxMembers,
      deadline: form.deadline,
    }

    const result = await authPost<{ id: string }>('/recruit', body)
    await router.push(`/recruit/${result.id}`)
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number; data?: { message?: string } }
    if (err?.statusCode === 401) {
      await router.push('/auth/login')
    }
    else if (err?.statusCode === 403) {
      toast.error(err?.data?.message || '워크스페이스 관리자만 모집글을 작성할 수 있습니다.')
    }
    else {
      toast.error(err?.data?.message || '모집글 작성에 실패했습니다.')
    }
  }
  finally {
    isSubmitting.value = false
  }
}

// 초기 로드
await loadWorkspaces()
</script>

<template>
  <div class="container max-w-3xl py-8">
    <!-- 헤더 -->
    <div class="flex items-center gap-3 mb-8">
      <button
        class="text-muted-foreground hover:text-foreground transition-colors"
        @click="router.back()"
      >
        <Icon icon="heroicons:arrow-left" class="w-5 h-5" />
      </button>
      <h1 class="text-xl font-bold text-foreground">
        모집글 작성
      </h1>
    </div>

    <!-- 워크스페이스 없을 때 안내 -->
    <template v-if="!loadingWorkspaces && workspaces.length === 0">
      <div class="flex flex-col items-center justify-center py-20 text-center border border-border rounded-lg">
        <Icon icon="heroicons:folder-plus" class="w-12 h-12 text-muted-foreground mb-4" />
        <h2 class="text-lg font-semibold text-foreground mb-2">
          먼저 워크스페이스를 만들어보세요
        </h2>
        <p class="text-muted-foreground text-sm mb-6">
          팀원모집은 PM툴의 프로젝트 또는 스터디룸이 있어야 작성할 수 있어요.
        </p>
        <Button @click="navigateTo('/workspaces')">
          <Icon icon="heroicons:plus" class="w-4 h-4 mr-2" />
          워크스페이스 만들기
        </Button>
      </div>
    </template>

    <!-- 작성 폼 -->
    <form v-else class="space-y-6" @submit.prevent="handleSubmit">
      <!-- 워크스페이스 선택 -->
      <div class="space-y-2">
        <Label for="workspace">워크스페이스 <span class="text-destructive">*</span></Label>
        <div v-if="loadingWorkspaces" class="h-10 bg-muted animate-pulse rounded-md" />
        <select
          v-else
          id="workspace"
          v-model="form.projectId"
          class="w-full h-10 px-3 text-sm border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          :class="errors.projectId ? 'border-destructive' : 'border-border'"
        >
          <option value="">워크스페이스를 선택해주세요</option>
          <option v-for="ws in workspaces" :key="ws.id" :value="ws.id">
            [{{ ws.type === 'PROJECT' ? '프로젝트' : '스터디' }}] {{ ws.name }}
          </option>
        </select>
        <p v-if="errors.projectId" class="text-sm text-destructive">{{ errors.projectId }}</p>
      </div>

      <!-- 모집 유형 -->
      <div class="space-y-2">
        <Label>모집 유형 <span class="text-destructive">*</span></Label>
        <div class="flex gap-2">
          <button
            v-for="t in [{ label: '프로젝트', value: 'PROJECT' }, { label: '스터디', value: 'STUDY' }]"
            :key="t.value"
            type="button"
            class="px-4 py-2 text-sm font-medium rounded-md border transition-colors"
            :class="form.type === t.value
              ? 'bg-primary text-primary-foreground border-primary'
              : 'border-border text-muted-foreground hover:text-foreground hover:bg-accent'"
            @click="form.type = t.value as 'PROJECT' | 'STUDY'"
          >
            {{ t.label }}
          </button>
        </div>
      </div>

      <!-- 제목 -->
      <div class="space-y-2">
        <Label for="title">제목 <span class="text-destructive">*</span></Label>
        <Input
          id="title"
          v-model="form.title"
          placeholder="예: React 프론트엔드 개발자 모집합니다"
          maxlength="200"
          :class="errors.title ? 'border-destructive' : ''"
        />
        <div class="flex justify-between items-center">
          <p v-if="errors.title" class="text-sm text-destructive">{{ errors.title }}</p>
          <p class="text-xs text-muted-foreground ml-auto">{{ form.title.length }}/200</p>
        </div>
      </div>

      <!-- 모집 내용 -->
      <div class="space-y-2">
        <Label for="description">모집 내용 <span class="text-destructive">*</span></Label>
        <textarea
          id="description"
          v-model="form.description"
          placeholder="프로젝트/스터디 소개, 모집 조건, 활동 방식 등을 자유롭게 작성해주세요."
          rows="8"
          class="w-full px-3 py-2 text-sm border rounded-md bg-background text-foreground resize-y focus:outline-none focus:ring-2 focus:ring-ring"
          :class="errors.description ? 'border-destructive' : 'border-border'"
        />
        <p v-if="errors.description" class="text-sm text-destructive">{{ errors.description }}</p>
      </div>

      <!-- 모집 포지션 -->
      <div class="space-y-2">
        <Label>모집 포지션 <span class="text-destructive">*</span></Label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="pos in POSITION_PRESETS"
            :key="pos"
            type="button"
            class="px-3 py-1.5 text-sm font-medium rounded-full border transition-colors"
            :class="form.positions.includes(pos)
              ? 'bg-primary text-primary-foreground border-primary'
              : 'border-border text-muted-foreground hover:text-foreground hover:bg-accent'"
            @click="togglePosition(pos)"
          >
            {{ pos }}
          </button>
        </div>
        <p v-if="errors.positions" class="text-sm text-destructive">{{ errors.positions }}</p>
        <p v-if="form.positions.length > 0" class="text-xs text-muted-foreground">
          선택됨: {{ form.positions.join(', ') }}
        </p>
      </div>

      <!-- 최대 인원 -->
      <div class="space-y-2">
        <Label for="maxMembers">최대 모집 인원 <span class="text-destructive">*</span></Label>
        <div class="flex items-center gap-2">
          <input
            id="maxMembers"
            v-model.number="form.maxMembers"
            type="number"
            min="1"
            max="50"
            class="w-24 h-10 px-3 text-sm border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            :class="errors.maxMembers ? 'border-destructive' : 'border-border'"
          />
          <span class="text-sm text-muted-foreground">명</span>
        </div>
        <p v-if="errors.maxMembers" class="text-sm text-destructive">{{ errors.maxMembers }}</p>
      </div>

      <!-- 마감일 (필수) -->
      <div class="space-y-2">
        <Label for="deadline">마감일 <span class="text-destructive">*</span></Label>
        <input
          id="deadline"
          v-model="form.deadline"
          type="date"
          class="h-10 px-3 text-sm border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          :class="errors.deadline ? 'border-destructive' : 'border-border'"
        />
        <p v-if="errors.deadline" class="text-sm text-destructive">{{ errors.deadline }}</p>
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
          {{ isSubmitting ? '작성 중...' : '모집글 등록' }}
        </Button>
      </div>
    </form>
  </div>
</template>
