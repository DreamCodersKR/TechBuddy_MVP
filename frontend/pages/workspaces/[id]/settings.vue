<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

definePageMeta({ layout: 'workspace', middleware: 'auth' })
useHead({ title: '설정 - FLOWIT' })

const route = useRoute()
const router = useRouter()
const workspaceId = route.params.id as string
const authStore = useAuthStore()
const { get: authGet, patch: authPatch, delete: authDelete } = useAuthFetch()

const TECH_PRESETS = ['React', 'Vue', 'Next.js', 'NestJS', 'Express', 'TypeScript', 'Python', 'FastAPI', 'PostgreSQL', 'MongoDB', 'Docker', 'AWS']

interface WorkspaceDetail {
  id: string
  name: string
  type: 'PROJECT' | 'STUDY'
  description: string | null
  techStack: string[]
  githubUrl: string | null
  isPublic: boolean
  status: string
  members: { role: string, user: { id: string } }[]
}

const workspace = ref<WorkspaceDetail | null>(null)
const loading = ref(true)
const myRole = ref<'ADMIN' | 'MEMBER' | 'MENTOR'>('MEMBER')

const form = reactive({
  name: '',
  description: '',
  techStack: [] as string[],
  githubUrl: '',
  isPublic: false,
})

async function loadWorkspace() {
  loading.value = true
  try {
    const res = await authGet<WorkspaceDetail>(`/workspaces/${workspaceId}`)
    workspace.value = res
    form.name = res.name
    form.description = res.description ?? ''
    form.techStack = [...res.techStack]
    form.githubUrl = res.githubUrl ?? ''
    form.isPublic = res.isPublic
    const me = res.members.find(m => m.user.id === authStore.currentUser?.id)
    if (me) myRole.value = me.role as typeof myRole.value
  }
  catch { workspace.value = null }
  finally { loading.value = false }
}

function toggleTech(t: string) {
  const idx = form.techStack.indexOf(t)
  if (idx === -1) form.techStack.push(t)
  else form.techStack.splice(idx, 1)
}

// ─── 저장 ────────────────────────────────────────────────
const isSaving = ref(false)
const saveSuccess = ref(false)

async function handleSave() {
  if (!form.name.trim()) return
  isSaving.value = true
  saveSuccess.value = false
  try {
    const body: Record<string, unknown> = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      techStack: form.techStack,
      isPublic: form.isPublic,
    }
    if (form.githubUrl.trim()) body.githubUrl = form.githubUrl.trim()

    const updated = await authPatch<WorkspaceDetail>(`/workspaces/${workspaceId}`, body)
    workspace.value = updated
    saveSuccess.value = true
    setTimeout(() => { saveSuccess.value = false }, 3000)
  }
  catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    alert(err?.data?.message || '저장에 실패했습니다.')
  }
  finally { isSaving.value = false }
}

// ─── 워크스페이스 삭제 ────────────────────────────────────
const showDeleteConfirm = ref(false)
const deleteConfirmName = ref('')
const isDeleting = ref(false)

async function handleDelete() {
  if (deleteConfirmName.value !== workspace.value?.name) return
  isDeleting.value = true
  try {
    await authDelete(`/workspaces/${workspaceId}`)
    await router.replace('/workspaces')
  }
  catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    alert(err?.data?.message || '삭제에 실패했습니다.')
    isDeleting.value = false
  }
}

onMounted(() => { loadWorkspace() })
</script>

<template>
  <div class="max-w-2xl">
    <!-- 헤더 -->
    <div class="mb-8">
      <h2 class="text-xl font-bold text-foreground">
        워크스페이스 설정
      </h2>
      <p class="text-sm text-muted-foreground mt-0.5">
        워크스페이스 정보를 수정하세요
      </p>
    </div>

    <!-- 로딩 -->
    <div
      v-if="loading"
      class="space-y-4"
    >
      <div class="h-10 bg-muted animate-pulse rounded" />
      <div class="h-20 bg-muted animate-pulse rounded" />
    </div>

    <template v-else-if="workspace">
      <!-- 관리자만 수정 가능 안내 -->
      <div
        v-if="myRole !== 'ADMIN'"
        class="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2"
      >
        <Icon icon="heroicons:lock-closed" class="w-4 h-4 flex-shrink-0" />
        설정 변경은 관리자만 가능합니다.
      </div>

      <!-- 기본 정보 -->
      <div class="space-y-6 pb-8 border-b border-border">
        <h3 class="font-semibold text-foreground">
          기본 정보
        </h3>

        <div class="space-y-2">
          <Label>워크스페이스 이름 <span class="text-destructive">*</span></Label>
          <Input
            v-model="form.name"
            placeholder="워크스페이스 이름"
            :disabled="myRole !== 'ADMIN'"
            maxlength="100"
          />
        </div>

        <div class="space-y-2">
          <Label>설명 <span class="text-xs text-muted-foreground">(선택)</span></Label>
          <textarea
            v-model="form.description"
            placeholder="워크스페이스에 대한 간단한 설명"
            rows="3"
            :disabled="myRole !== 'ADMIN'"
            class="w-full px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground resize-y focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <!-- 기술 스택 -->
        <div class="space-y-2">
          <Label>기술 스택</Label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="tech in TECH_PRESETS"
              :key="tech"
              type="button"
              :disabled="myRole !== 'ADMIN'"
              class="px-3 py-1.5 text-xs font-medium rounded-full border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              :class="form.techStack.includes(tech)
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:text-foreground hover:bg-accent'"
              @click="toggleTech(tech)"
            >
              {{ tech }}
            </button>
          </div>
        </div>

        <!-- GitHub (PROJECT만) -->
        <div
          v-if="workspace.type === 'PROJECT'"
          class="space-y-2"
        >
          <Label>GitHub URL <span class="text-xs text-muted-foreground">(선택)</span></Label>
          <Input
            v-model="form.githubUrl"
            placeholder="https://github.com/..."
            :disabled="myRole !== 'ADMIN'"
          />
        </div>

        <!-- 공개 여부 -->
        <div class="flex items-center justify-between p-4 border border-border rounded-xl">
          <div>
            <p class="text-sm font-medium">
              공개 워크스페이스
            </p>
            <p class="text-xs text-muted-foreground">
              팀원모집 시 팀원들에게 프로젝트가 공개됩니다
            </p>
          </div>
          <button
            type="button"
            :disabled="myRole !== 'ADMIN'"
            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            :class="form.isPublic ? 'bg-primary' : 'bg-muted'"
            @click="form.isPublic = !form.isPublic"
          >
            <span
              class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
              :class="form.isPublic ? 'translate-x-6' : 'translate-x-1'"
            />
          </button>
        </div>

        <!-- 저장 버튼 -->
        <div
          v-if="myRole === 'ADMIN'"
          class="flex items-center gap-3"
        >
          <Button
            :disabled="!form.name.trim() || isSaving"
            @click="handleSave"
          >
            <Icon
              v-if="isSaving"
              icon="heroicons:arrow-path"
              class="w-4 h-4 mr-2 animate-spin"
            />
            {{ isSaving ? '저장 중...' : '변경사항 저장' }}
          </Button>
          <span
            v-if="saveSuccess"
            class="text-sm text-green-600 dark:text-green-400 flex items-center gap-1"
          >
            <Icon icon="heroicons:check-circle" class="w-4 h-4" />
            저장됐습니다
          </span>
        </div>
      </div>

      <!-- 워크스페이스 타입 -->
      <div class="py-8 border-b border-border space-y-3">
        <h3 class="font-semibold text-foreground">
          워크스페이스 유형
        </h3>
        <div class="flex items-center gap-3 p-4 border border-border rounded-xl bg-muted/30">
          <Icon
            :icon="workspace.type === 'PROJECT' ? 'heroicons:code-bracket' : 'heroicons:academic-cap'"
            class="w-5 h-5 text-muted-foreground"
          />
          <div>
            <p class="text-sm font-medium">
              {{ workspace.type === 'PROJECT' ? '프로젝트' : '스터디' }}
            </p>
            <p class="text-xs text-muted-foreground">
              유형은 생성 후 변경할 수 없습니다
            </p>
          </div>
        </div>
      </div>

      <!-- 위험 구역 (관리자만) -->
      <div
        v-if="myRole === 'ADMIN'"
        class="pt-8 space-y-3"
      >
        <h3 class="font-semibold text-destructive">
          위험 구역
        </h3>
        <div class="border border-destructive/30 rounded-xl p-5">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-foreground">
                워크스페이스 삭제
              </p>
              <p class="text-xs text-muted-foreground mt-0.5">
                모든 태스크, 스프린트, 멤버 정보가 영구 삭제됩니다
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              @click="showDeleteConfirm = true"
            >
              삭제
            </Button>
          </div>
        </div>
      </div>
    </template>

    <!-- 삭제 확인 모달 -->
    <div
      v-if="showDeleteConfirm"
      class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      @click.self="showDeleteConfirm = false; deleteConfirmName = ''"
    >
      <div class="bg-card border border-border rounded-xl w-full max-w-sm p-6 space-y-4">
        <div>
          <h3 class="font-semibold text-foreground mb-1">
            정말 삭제할까요?
          </h3>
          <p class="text-sm text-muted-foreground">
            확인을 위해 워크스페이스 이름
            <strong class="text-foreground">{{ workspace?.name }}</strong>을 입력하세요.
          </p>
        </div>
        <Input
          v-model="deleteConfirmName"
          placeholder="워크스페이스 이름 입력"
        />
        <div class="flex justify-end gap-2">
          <Button
            variant="outline"
            @click="showDeleteConfirm = false; deleteConfirmName = ''"
          >
            취소
          </Button>
          <Button
            variant="destructive"
            :disabled="deleteConfirmName !== workspace?.name || isDeleting"
            @click="handleDelete"
          >
            <Icon
              v-if="isDeleting"
              icon="heroicons:arrow-path"
              class="w-4 h-4 mr-1 animate-spin"
            />
            삭제
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
