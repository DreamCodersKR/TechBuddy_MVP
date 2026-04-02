<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'

definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const config = useRuntimeConfig()
const { get: authGet, post: authPost, patch: authPatch } = useAuthFetch()

// ─── 타입 ────────────────────────────────────────────────
interface RecruitDetail {
  id: string
  title: string
  description: string
  type: 'PROJECT' | 'STUDY'
  positions: string[]
  maxMembers: number
  deadline: string | null
  isClosed: boolean
  authorId: string
  createdAt: string
  author: { id: string; name: string; nickname: string | null; avatarUrl: string | null }
  project: { id: string; name: string; type: string } | null
  _count: { applications: number }
}

interface Application {
  id: string
  recruitId: string
  applicantId: string
  message: string | null
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  createdAt: string
  applicant: { id: string; name: string; nickname: string | null; avatarUrl: string | null; techStack: string[] }
}

// ─── 상태 ────────────────────────────────────────────────
const recruit = ref<RecruitDetail | null>(null)
const applications = ref<Application[]>([])
const loadError = ref(false)

const isAuthor = computed(() =>
  authStore.isAuthenticated && recruit.value?.authorId === authStore.currentUser?.id,
)

// ─── 데이터 로드 ─────────────────────────────────────────
async function loadData() {
  try {
    recruit.value = await $fetch<RecruitDetail>(
      `${config.public.apiBaseUrl}/recruit/${route.params.id}`,
    )
  }
  catch {
    loadError.value = true
    return
  }

  // 작성자인 경우 지원자 목록 로드
  if (authStore.isAuthenticated && recruit.value?.authorId === authStore.currentUser?.id) {
    try {
      applications.value = await authGet<Application[]>(`/recruit/${route.params.id}/applications`)
    }
    catch {
      // 403 등 무시
    }
  }
}

await loadData()

// ─── 마감 처리 ───────────────────────────────────────────
const isClosing = ref(false)

async function handleClose() {
  if (!confirm('모집을 마감하시겠습니까? 마감 후에는 새 지원을 받을 수 없습니다.')) return
  isClosing.value = true
  try {
    await authPatch(`/recruit/${route.params.id}/close`, {})
    if (recruit.value) recruit.value.isClosed = true
  }
  catch (error: unknown) {
    const err = error as { data?: { message?: string } }
    alert(err?.data?.message || '마감 처리에 실패했습니다.')
  }
  finally {
    isClosing.value = false
  }
}

// ─── 지원 수락/거절 ───────────────────────────────────────
const updatingApp = ref<string | null>(null)

async function updateApplicationStatus(appId: string, status: 'ACCEPTED' | 'REJECTED') {
  updatingApp.value = appId
  try {
    await authPatch(`/recruit/${route.params.id}/applications/${appId}/status`, { status })
    const app = applications.value.find(a => a.id === appId)
    if (app) app.status = status
  }
  catch (error: unknown) {
    const err = error as { data?: { message?: string } }
    alert(err?.data?.message || '처리에 실패했습니다.')
  }
  finally {
    updatingApp.value = null
  }
}

// ─── 지원하기 ────────────────────────────────────────────
const showApplyForm = ref(false)
const applyMessage = ref('')
const isApplying = ref(false)
const applied = ref(false)

async function handleApply() {
  isApplying.value = true
  try {
    const body: Record<string, string> = {}
    if (applyMessage.value.trim()) body.message = applyMessage.value.trim()
    await authPost(`/recruit/${route.params.id}/apply`, body)
    applied.value = true
    showApplyForm.value = false
    if (recruit.value) recruit.value._count.applications += 1
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number; data?: { message?: string } }
    if (err?.statusCode === 409) {
      // 이미 지원한 경우
      applied.value = true
      showApplyForm.value = false
    }
    else if (err?.statusCode === 401) {
      await router.push('/auth/login')
    }
    else {
      alert(err?.data?.message || '지원에 실패했습니다.')
    }
  }
  finally {
    isApplying.value = false
  }
}

// ─── 유틸 ────────────────────────────────────────────────
function formatDate(dateStr: string | null) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
}

const statusLabel: Record<string, { label: string; class: string }> = {
  PENDING: { label: '검토중', class: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  ACCEPTED: { label: '수락', class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  REJECTED: { label: '거절', class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}
</script>

<template>
  <!-- 에러 -->
  <div v-if="loadError" class="max-w-3xl mx-auto px-4 py-20 text-center">
    <Icon icon="heroicons:exclamation-circle" class="w-12 h-12 text-muted-foreground mx-auto mb-4" />
    <h2 class="text-lg font-semibold text-foreground mb-2">모집글을 찾을 수 없어요</h2>
    <Button variant="outline" @click="router.back()">돌아가기</Button>
  </div>

  <!-- 로딩 -->
  <div v-else-if="!recruit" class="max-w-3xl mx-auto px-4 py-8 space-y-4">
    <div class="h-6 bg-muted animate-pulse rounded w-1/3" />
    <div class="h-8 bg-muted animate-pulse rounded w-2/3" />
    <div class="h-4 bg-muted animate-pulse rounded w-1/2" />
  </div>

  <!-- 본문 -->
  <div v-else class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- 상단 네비 -->
    <div class="flex items-center gap-3 mb-6">
      <button
        class="text-muted-foreground hover:text-foreground transition-colors"
        @click="router.back()"
      >
        <Icon icon="heroicons:arrow-left" class="w-5 h-5" />
      </button>
      <span class="text-sm text-muted-foreground">팀원모집</span>
    </div>

    <!-- 모집글 카드 -->
    <div class="border border-border rounded-lg bg-card p-6 mb-6">
      <!-- 뱃지 행 -->
      <div class="flex items-center gap-2 mb-3">
        <span
          class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
          :class="recruit.type === 'PROJECT'
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
            : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'"
        >
          {{ recruit.type === 'PROJECT' ? '프로젝트' : '스터디' }}
        </span>
        <span v-if="recruit.project" class="text-xs text-muted-foreground">
          {{ recruit.project.name }}
        </span>
        <span
          v-if="recruit.isClosed"
          class="ml-auto text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded"
        >마감</span>
      </div>

      <!-- 제목 -->
      <h1 class="text-xl font-bold text-foreground mb-4">{{ recruit.title }}</h1>

      <!-- 메타 정보 -->
      <div class="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
        <span>{{ recruit.author.nickname ?? recruit.author.name }}</span>
        <span>{{ useRelativeTime(recruit.createdAt) }}</span>
        <span class="flex items-center gap-1">
          <Icon icon="heroicons:user-group" class="w-4 h-4" />
          {{ recruit._count.applications }}/{{ recruit.maxMembers }}명
        </span>
        <span v-if="recruit.deadline" class="flex items-center gap-1">
          <Icon icon="heroicons:calendar" class="w-4 h-4" />
          {{ formatDate(recruit.deadline) }} 마감
        </span>
      </div>

      <!-- 포지션 태그 -->
      <div class="flex flex-wrap gap-2 mb-6">
        <span
          v-for="pos in recruit.positions"
          :key="pos"
          class="inline-block px-3 py-1 text-xs rounded-full bg-secondary text-secondary-foreground font-medium"
        >
          {{ pos }}
        </span>
      </div>

      <!-- 본문 -->
      <div class="border-t border-border pt-5">
        <p class="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{{ recruit.description }}</p>
      </div>
    </div>

    <!-- 작성자: 마감 버튼 -->
    <div v-if="isAuthor && !recruit.isClosed" class="flex justify-end mb-6">
      <Button variant="outline" size="sm" :disabled="isClosing" @click="handleClose">
        <Icon v-if="isClosing" icon="heroicons:arrow-path" class="w-4 h-4 mr-1.5 animate-spin" />
        <Icon v-else icon="heroicons:x-circle" class="w-4 h-4 mr-1.5" />
        모집 마감하기
      </Button>
    </div>

    <!-- ─────────────── 작성자: 지원자 목록 ─────────────── -->
    <template v-if="isAuthor">
      <div class="border border-border rounded-lg bg-card">
        <div class="px-6 py-4 border-b border-border">
          <h2 class="font-semibold text-foreground">
            지원자 목록
            <span class="ml-2 text-sm font-normal text-muted-foreground">{{ applications.length }}명</span>
          </h2>
        </div>

        <!-- 지원자 없음 -->
        <div v-if="applications.length === 0" class="px-6 py-10 text-center text-muted-foreground text-sm">
          아직 지원자가 없어요
        </div>

        <!-- 지원자 목록 -->
        <div v-else class="divide-y divide-border">
          <div v-for="app in applications" :key="app.id" class="px-6 py-4">
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1 min-w-0">
                <!-- 지원자 이름 + 상태 -->
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-sm font-medium text-foreground">
                    {{ app.applicant.nickname ?? app.applicant.name }}
                  </span>
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                    :class="statusLabel[app.status]?.class"
                  >
                    {{ statusLabel[app.status]?.label }}
                  </span>
                </div>

                <!-- 기술 스택 -->
                <div v-if="app.applicant.techStack?.length > 0" class="flex flex-wrap gap-1 mb-2">
                  <span
                    v-for="tech in app.applicant.techStack.slice(0, 5)"
                    :key="tech"
                    class="px-1.5 py-0.5 text-xs bg-muted text-muted-foreground rounded"
                  >
                    {{ tech }}
                  </span>
                </div>

                <!-- 자기소개 메시지 -->
                <p v-if="app.message" class="text-xs text-muted-foreground line-clamp-2">{{ app.message }}</p>
                <p class="text-xs text-muted-foreground mt-1">{{ useRelativeTime(app.createdAt) }}</p>
              </div>

              <!-- 수락/거절 버튼 (PENDING 상태만) -->
              <div v-if="app.status === 'PENDING'" class="flex gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  :disabled="updatingApp === app.id"
                  class="text-red-500 hover:text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
                  @click="updateApplicationStatus(app.id, 'REJECTED')"
                >
                  거절
                </Button>
                <Button
                  size="sm"
                  :disabled="updatingApp === app.id"
                  @click="updateApplicationStatus(app.id, 'ACCEPTED')"
                >
                  <Icon v-if="updatingApp === app.id" icon="heroicons:arrow-path" class="w-3 h-3 mr-1 animate-spin" />
                  수락
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ─────────────── 비작성자: 지원 영역 ─────────────── -->
    <template v-else>
      <!-- 마감된 경우 -->
      <div
        v-if="recruit.isClosed"
        class="border border-border rounded-lg bg-muted/30 px-6 py-4 text-center"
      >
        <Icon icon="heroicons:x-circle" class="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
        <p class="text-sm text-muted-foreground">이 모집글은 마감됐습니다.</p>
      </div>

      <!-- 지원 완료 -->
      <div
        v-else-if="applied"
        class="border border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-900/10 px-6 py-4 text-center"
      >
        <Icon icon="heroicons:check-circle" class="w-5 h-5 mx-auto mb-2 text-green-500" />
        <p class="text-sm font-medium text-green-700 dark:text-green-400">지원이 완료됐습니다!</p>
        <p class="text-xs text-green-600 dark:text-green-500 mt-1">작성자의 검토 후 결과를 알려드려요.</p>
      </div>

      <!-- 비로그인 -->
      <div
        v-else-if="!authStore.isAuthenticated"
        class="border border-border rounded-lg bg-card px-6 py-5 text-center"
      >
        <p class="text-sm text-muted-foreground mb-4">로그인 후 지원할 수 있어요</p>
        <Button @click="router.push('/auth/login')">로그인하기</Button>
      </div>

      <!-- 지원하기 영역 -->
      <div v-else class="border border-border rounded-lg bg-card overflow-hidden">
        <!-- 지원 폼 닫힌 상태 -->
        <div v-if="!showApplyForm" class="px-6 py-5 flex items-center justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-foreground">이 프로젝트에 합류하고 싶으신가요?</p>
            <p class="text-xs text-muted-foreground mt-1">간단한 자기소개와 함께 지원해보세요.</p>
          </div>
          <Button @click="showApplyForm = true">지원하기</Button>
        </div>

        <!-- 지원 폼 열린 상태 -->
        <div v-else class="px-6 py-5 space-y-4">
          <h3 class="text-sm font-semibold text-foreground">지원하기</h3>
          <div>
            <label class="text-xs text-muted-foreground mb-1.5 block">자기소개 메시지 (선택)</label>
            <textarea
              v-model="applyMessage"
              placeholder="본인 소개, 관련 경험, 합류 이유 등을 자유롭게 작성해주세요."
              rows="5"
              class="w-full px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div class="flex justify-end gap-2">
            <Button variant="outline" :disabled="isApplying" @click="showApplyForm = false">취소</Button>
            <Button :disabled="isApplying" @click="handleApply">
              <Icon v-if="isApplying" icon="heroicons:arrow-path" class="w-4 h-4 mr-1.5 animate-spin" />
              {{ isApplying ? '지원 중...' : '지원 완료' }}
            </Button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
