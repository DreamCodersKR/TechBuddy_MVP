<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

definePageMeta({ layout: 'workspace', middleware: 'auth' })
useHead({ title: 'KPT 회고 - FLOWIT' })

const route = useRoute()
const workspaceId = route.params.id as string
const sprintId = route.params.sprintId as string
const { get: authGet, post: authPost } = useAuthFetch()
const authStore = useAuthStore()

// ─── 타입 ────────────────────────────────────────────────
interface SprintInfo {
  id: string
  name: string
  status: string
}

interface KptItem {
  id: string
  keeps: string[]
  problems: string[]
  tries: string[]
  user: {
    id: string
    nickname: string | null
    avatarUrl: string | null
  }
  createdAt: string
}

interface KptResponse {
  retrospectives: KptItem[]
  summary: string | null
}

// ─── 상태 ────────────────────────────────────────────────
const sprint = ref<SprintInfo | null>(null)
const retrospectives = ref<KptItem[]>([])
const summary = ref<string | null>(null)
const loading = ref(true)

// 내 회고 입력 폼
const keeps = ref<string[]>([])
const problems = ref<string[]>([])
const tries = ref<string[]>([])
const keepInput = ref('')
const problemInput = ref('')
const tryInput = ref('')
const isSaving = ref(false)
const saveSuccess = ref(false)

// AI 요약
const isSummarizing = ref(false)

// 팀원 회고 토글
const showTeamRetros = ref(false)

const currentUserId = computed(() => (authStore.currentUser as any)?.id ?? '')

// 내 기존 회고가 있는지
const myRetro = computed(() =>
  retrospectives.value.find(r => r.user.id === currentUserId.value),
)

// 팀원 회고 (나 제외)
const teamRetros = computed(() =>
  retrospectives.value.filter(r => r.user.id !== currentUserId.value),
)

// ─── 데이터 로드 ────────────────────────────────────────
async function loadData() {
  loading.value = true
  try {
    const [sprintRes, kptRes] = await Promise.all([
      authGet<SprintInfo>(`/workspaces/${workspaceId}/sprints/${sprintId}`),
      authGet<KptResponse>(`/workspaces/${workspaceId}/sprints/${sprintId}/kpt`),
    ])
    sprint.value = sprintRes
    retrospectives.value = kptRes.retrospectives
    summary.value = kptRes.summary

    // 내 기존 회고가 있으면 폼에 채우기
    if (myRetro.value) {
      keeps.value = [...myRetro.value.keeps]
      problems.value = [...myRetro.value.problems]
      tries.value = [...myRetro.value.tries]
    }
  }
  catch {
    sprint.value = null
    retrospectives.value = []
  }
  finally {
    loading.value = false
  }
}

// ─── 항목 추가/삭제 ──────────────────────────────────────
function addKeep() {
  const val = keepInput.value.trim()
  if (val) {
    keeps.value.push(val)
    keepInput.value = ''
  }
}

function addProblem() {
  const val = problemInput.value.trim()
  if (val) {
    problems.value.push(val)
    problemInput.value = ''
  }
}

function addTry() {
  const val = tryInput.value.trim()
  if (val) {
    tries.value.push(val)
    tryInput.value = ''
  }
}

function removeKeep(index: number) {
  keeps.value.splice(index, 1)
}

function removeProblem(index: number) {
  problems.value.splice(index, 1)
}

function removeTry(index: number) {
  tries.value.splice(index, 1)
}

// ─── 저장 ────────────────────────────────────────────────
async function handleSave() {
  if (keeps.value.length === 0 && problems.value.length === 0 && tries.value.length === 0) {
    toast.info('최소 하나의 항목을 입력해주세요.')
    return
  }
  isSaving.value = true
  saveSuccess.value = false
  try {
    await authPost(`/workspaces/${workspaceId}/sprints/${sprintId}/kpt`, {
      keeps: keeps.value,
      problems: problems.value,
      tries: tries.value,
    })
    saveSuccess.value = true
    setTimeout(() => { saveSuccess.value = false }, 3000)
    // 저장 후 최신 데이터 다시 로드
    const kptRes = await authGet<KptResponse>(`/workspaces/${workspaceId}/sprints/${sprintId}/kpt`)
    retrospectives.value = kptRes.retrospectives
    summary.value = kptRes.summary
  }
  catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    toast.error(err?.data?.message || '회고 저장에 실패했습니다.')
  }
  finally {
    isSaving.value = false
  }
}

// ─── AI 요약 생성 ────────────────────────────────────────
async function generateSummary() {
  isSummarizing.value = true
  try {
    const res = await authPost<{ summary: string }>(
      `/workspaces/${workspaceId}/sprints/${sprintId}/kpt/ai-summary`,
    )
    summary.value = res.summary
  }
  catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    toast.error(err?.data?.message || 'AI 요약 생성에 실패했습니다.')
  }
  finally {
    isSummarizing.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <!-- 헤더 -->
    <div class="mb-6">
      <NuxtLink
        :to="`/workspaces/${workspaceId}/sprints`"
        class="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
      >
        <Icon icon="heroicons:arrow-left" class="w-4 h-4" />
        스프린트 목록으로
      </NuxtLink>
      <div class="flex items-center gap-3">
        <h2 class="text-xl font-bold text-foreground">
          KPT 회고
        </h2>
        <span
          v-if="sprint"
          class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
        >
          {{ sprint.name }}
        </span>
      </div>
      <p class="text-sm text-muted-foreground mt-1">
        스프린트를 돌아보며 Keep / Problem / Try를 작성해보세요
      </p>
    </div>

    <!-- 로딩 -->
    <div
      v-if="loading"
      class="flex items-center justify-center h-40"
    >
      <Icon icon="heroicons:arrow-path" class="w-6 h-6 animate-spin text-muted-foreground" />
    </div>

    <template v-else>
      <!-- 내 회고 작성/수정 섹션 -->
      <div class="bg-card border border-border rounded-xl p-5 mb-6">
        <h3 class="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Icon icon="heroicons:pencil-square" class="w-4 h-4" />
          {{ myRetro ? '내 회고 수정' : '내 회고 작성' }}
        </h3>

        <!-- Keep -->
        <div class="mb-5">
          <div class="flex items-center gap-2 mb-2">
            <span class="inline-flex items-center justify-center w-5 h-5 rounded bg-green-100 dark:bg-green-900/30">
              <span class="text-xs font-bold text-green-700 dark:text-green-400">K</span>
            </span>
            <label class="text-sm font-medium text-foreground">Keep (잘한 점)</label>
          </div>
          <ul
            v-if="keeps.length > 0"
            class="space-y-1.5 mb-2"
          >
            <li
              v-for="(item, idx) in keeps"
              :key="idx"
              class="flex items-center gap-2 text-sm text-foreground bg-green-50 dark:bg-green-900/10 rounded-lg px-3 py-2"
            >
              <span class="flex-1">{{ item }}</span>
              <button
                class="text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0"
                @click="removeKeep(idx)"
              >
                <Icon icon="heroicons:x-mark" class="w-4 h-4" />
              </button>
            </li>
          </ul>
          <div class="flex gap-2">
            <Input
              v-model="keepInput"
              placeholder="잘한 점을 입력하세요"
              class="flex-1"
              @keydown.enter.prevent="addKeep"
            />
            <Button
              variant="outline"
              size="sm"
              class="flex-shrink-0"
              @click="addKeep"
            >
              <Icon icon="heroicons:plus" class="w-4 h-4 mr-1" />
              추가
            </Button>
          </div>
        </div>

        <!-- Problem -->
        <div class="mb-5">
          <div class="flex items-center gap-2 mb-2">
            <span class="inline-flex items-center justify-center w-5 h-5 rounded bg-red-100 dark:bg-red-900/30">
              <span class="text-xs font-bold text-red-700 dark:text-red-400">P</span>
            </span>
            <label class="text-sm font-medium text-foreground">Problem (문제점)</label>
          </div>
          <ul
            v-if="problems.length > 0"
            class="space-y-1.5 mb-2"
          >
            <li
              v-for="(item, idx) in problems"
              :key="idx"
              class="flex items-center gap-2 text-sm text-foreground bg-red-50 dark:bg-red-900/10 rounded-lg px-3 py-2"
            >
              <span class="flex-1">{{ item }}</span>
              <button
                class="text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0"
                @click="removeProblem(idx)"
              >
                <Icon icon="heroicons:x-mark" class="w-4 h-4" />
              </button>
            </li>
          </ul>
          <div class="flex gap-2">
            <Input
              v-model="problemInput"
              placeholder="문제점을 입력하세요"
              class="flex-1"
              @keydown.enter.prevent="addProblem"
            />
            <Button
              variant="outline"
              size="sm"
              class="flex-shrink-0"
              @click="addProblem"
            >
              <Icon icon="heroicons:plus" class="w-4 h-4 mr-1" />
              추가
            </Button>
          </div>
        </div>

        <!-- Try -->
        <div class="mb-5">
          <div class="flex items-center gap-2 mb-2">
            <span class="inline-flex items-center justify-center w-5 h-5 rounded bg-blue-100 dark:bg-blue-900/30">
              <span class="text-xs font-bold text-blue-700 dark:text-blue-400">T</span>
            </span>
            <label class="text-sm font-medium text-foreground">Try (개선할 점)</label>
          </div>
          <ul
            v-if="tries.length > 0"
            class="space-y-1.5 mb-2"
          >
            <li
              v-for="(item, idx) in tries"
              :key="idx"
              class="flex items-center gap-2 text-sm text-foreground bg-blue-50 dark:bg-blue-900/10 rounded-lg px-3 py-2"
            >
              <span class="flex-1">{{ item }}</span>
              <button
                class="text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0"
                @click="removeTry(idx)"
              >
                <Icon icon="heroicons:x-mark" class="w-4 h-4" />
              </button>
            </li>
          </ul>
          <div class="flex gap-2">
            <Input
              v-model="tryInput"
              placeholder="개선할 점을 입력하세요"
              class="flex-1"
              @keydown.enter.prevent="addTry"
            />
            <Button
              variant="outline"
              size="sm"
              class="flex-shrink-0"
              @click="addTry"
            >
              <Icon icon="heroicons:plus" class="w-4 h-4 mr-1" />
              추가
            </Button>
          </div>
        </div>

        <!-- 저장 -->
        <div class="flex items-center justify-between">
          <p
            v-if="saveSuccess"
            class="text-xs text-emerald-500"
          >
            회고가 저장되었습니다.
          </p>
          <span v-else />
          <Button
            :disabled="isSaving || (keeps.length === 0 && problems.length === 0 && tries.length === 0)"
            @click="handleSave"
          >
            <Icon
              v-if="isSaving"
              icon="heroicons:arrow-path"
              class="w-4 h-4 mr-1 animate-spin"
            />
            저장하기
          </Button>
        </div>
      </div>

      <!-- 팀원 회고 보기 -->
      <div class="bg-card border border-border rounded-xl p-5 mb-6">
        <button
          class="w-full flex items-center justify-between"
          @click="showTeamRetros = !showTeamRetros"
        >
          <h3 class="text-sm font-semibold text-foreground flex items-center gap-2">
            <Icon icon="heroicons:users" class="w-4 h-4" />
            팀원 회고 보기
            <span class="text-xs font-normal text-muted-foreground">({{ teamRetros.length }}명)</span>
          </h3>
          <Icon
            icon="heroicons:chevron-down"
            class="w-4 h-4 text-muted-foreground transition-transform"
            :class="showTeamRetros ? 'rotate-180' : ''"
          />
        </button>

        <div
          v-if="showTeamRetros"
          class="mt-4 space-y-4"
        >
          <div
            v-if="teamRetros.length === 0"
            class="text-center py-6 text-sm text-muted-foreground"
          >
            아직 팀원의 회고가 없습니다.
          </div>

          <div
            v-for="retro in teamRetros"
            :key="retro.id"
            class="border border-border rounded-lg p-4"
          >
            <p class="text-sm font-medium text-foreground mb-3">
              {{ retro.user.nickname ?? '팀원' }}의 회고
            </p>

            <!-- Keep -->
            <div
              v-if="retro.keeps.length > 0"
              class="mb-2"
            >
              <div class="flex items-center gap-1.5 mb-1">
                <span class="inline-flex items-center justify-center w-4 h-4 rounded bg-green-100 dark:bg-green-900/30">
                  <span class="text-[10px] font-bold text-green-700 dark:text-green-400">K</span>
                </span>
                <span class="text-xs font-medium text-green-700 dark:text-green-400">Keep</span>
              </div>
              <ul class="space-y-0.5 pl-5">
                <li
                  v-for="(item, idx) in retro.keeps"
                  :key="idx"
                  class="text-sm text-foreground list-disc"
                >
                  {{ item }}
                </li>
              </ul>
            </div>

            <!-- Problem -->
            <div
              v-if="retro.problems.length > 0"
              class="mb-2"
            >
              <div class="flex items-center gap-1.5 mb-1">
                <span class="inline-flex items-center justify-center w-4 h-4 rounded bg-red-100 dark:bg-red-900/30">
                  <span class="text-[10px] font-bold text-red-700 dark:text-red-400">P</span>
                </span>
                <span class="text-xs font-medium text-red-700 dark:text-red-400">Problem</span>
              </div>
              <ul class="space-y-0.5 pl-5">
                <li
                  v-for="(item, idx) in retro.problems"
                  :key="idx"
                  class="text-sm text-foreground list-disc"
                >
                  {{ item }}
                </li>
              </ul>
            </div>

            <!-- Try -->
            <div
              v-if="retro.tries.length > 0"
            >
              <div class="flex items-center gap-1.5 mb-1">
                <span class="inline-flex items-center justify-center w-4 h-4 rounded bg-blue-100 dark:bg-blue-900/30">
                  <span class="text-[10px] font-bold text-blue-700 dark:text-blue-400">T</span>
                </span>
                <span class="text-xs font-medium text-blue-700 dark:text-blue-400">Try</span>
              </div>
              <ul class="space-y-0.5 pl-5">
                <li
                  v-for="(item, idx) in retro.tries"
                  :key="idx"
                  class="text-sm text-foreground list-disc"
                >
                  {{ item }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- AI 요약 -->
      <div class="bg-card border border-border rounded-xl p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-foreground flex items-center gap-2">
            <Icon icon="heroicons:sparkles" class="w-4 h-4" />
            AI 요약
          </h3>
          <Button
            variant="outline"
            size="sm"
            :disabled="isSummarizing || retrospectives.length === 0"
            @click="generateSummary"
          >
            <Icon
              v-if="isSummarizing"
              icon="heroicons:arrow-path"
              class="w-4 h-4 mr-1 animate-spin"
            />
            <Icon
              v-else
              icon="heroicons:sparkles"
              class="w-4 h-4 mr-1"
            />
            {{ summary ? 'AI 요약 재생성' : 'AI 요약 생성' }}
          </Button>
        </div>

        <div
          v-if="summary"
          class="bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800 rounded-lg p-4"
        >
          <p class="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
            {{ summary }}
          </p>
        </div>

        <p
          v-else-if="retrospectives.length === 0"
          class="text-sm text-muted-foreground"
        >
          팀원들의 회고가 모이면 AI 요약을 생성할 수 있습니다.
        </p>

        <p
          v-else
          class="text-sm text-muted-foreground"
        >
          AI 요약 생성 버튼을 눌러 팀 회고를 요약해보세요.
        </p>
      </div>
    </template>
  </div>
</template>
