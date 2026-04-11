<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { formatDateTime } from '@/utils/formatters'

definePageMeta({ layout: 'workspace' })

const route = useRoute()
const { get: authGet } = useAuthFetch()

const workspaceId = computed(() => route.params.id as string)

interface Submission {
  userId: string
  status: 'SUBMITTED' | 'LATE'
  submittedAt: string
  proofUrl: string | null
  content: string | null
}

interface MemberSubmission {
  user: { id: string; nickname: string; avatarUrl: string | null }
  submission: Submission | null
}

interface Assignment {
  id: string
  title: string
  dueDate: string | null
  submissions: Submission[]
}

interface StudyWeek {
  id: string
  weekNumber: number
  title: string
  startDate: string | null
  endDate: string | null
  assignments: Assignment[]
}

const weeks = ref<StudyWeek[]>([])
const members = ref<any[]>([])
const loading = ref(true)
const selectedWeekId = ref<string | null>(null)
const selectedAssignmentId = ref<string | null>(null)
const submissionDetail = ref<MemberSubmission[]>([])
const detailLoading = ref(false)

async function load() {
  loading.value = true
  try {
    const [weeksData, membersData] = await Promise.all([
      authGet<StudyWeek[]>(`/workspaces/${workspaceId.value}/study/weeks`),
      authGet<any[]>(`/workspaces/${workspaceId.value}/members`),
    ])
    weeks.value = weeksData
    members.value = membersData
    if (weeksData.length > 0) {
      selectedWeekId.value = weeksData[0].id
    }
  }
  finally { loading.value = false }
}

async function loadDetail(assignmentId: string) {
  selectedAssignmentId.value = assignmentId
  detailLoading.value = true
  try {
    submissionDetail.value = await authGet<MemberSubmission[]>(
      `/workspaces/${workspaceId.value}/study/assignments/${assignmentId}/submissions`,
    )
  }
  finally { detailLoading.value = false }
}

onMounted(load)

const selectedWeek = computed(() => weeks.value.find((w) => w.id === selectedWeekId.value))
const memberCount = computed(() => members.value.length)

function submittedCount(assign: Assignment) {
  return assign.submissions.length
}

function submissionPct(assign: Assignment) {
  if (!memberCount.value) return 0
  return Math.round((assign.submissions.length / memberCount.value) * 100)
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '-'
  return formatDateTime(dateStr)
}

function isOverdue(dueDate: string | null) {
  if (!dueDate) return false
  return new Date(dueDate) < new Date()
}
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-xl font-bold text-foreground">과제 인증 현황</h1>
      <p class="text-sm text-muted-foreground mt-0.5">멤버별 과제 제출 현황을 확인합니다</p>
    </div>

    <div v-if="loading" class="flex justify-center py-16">
      <Icon icon="heroicons:arrow-path" class="w-6 h-6 animate-spin text-muted-foreground" />
    </div>

    <div v-else-if="weeks.length === 0" class="flex flex-col items-center py-20 text-center">
      <Icon icon="heroicons:clipboard-document-check" class="w-12 h-12 text-muted-foreground opacity-30 mb-3" />
      <p class="text-sm text-muted-foreground">아직 주차가 없습니다</p>
    </div>

    <div v-else class="flex gap-6">
      <!-- 왼쪽: 주차 탭 + 과제 목록 -->
      <div class="w-72 flex-shrink-0">
        <!-- 주차 탭 -->
        <div class="flex flex-wrap gap-1.5 mb-4">
          <button
            v-for="week in weeks"
            :key="week.id"
            class="px-3 py-1.5 text-xs rounded-full border transition-colors"
            :class="selectedWeekId === week.id
              ? 'bg-primary text-primary-foreground border-primary'
              : 'border-border text-muted-foreground hover:bg-accent'"
            @click="selectedWeekId = week.id; selectedAssignmentId = null"
          >
            {{ week.weekNumber }}주차
          </button>
        </div>

        <!-- 선택된 주차의 과제 목록 -->
        <div v-if="selectedWeek" class="space-y-2">
          <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            {{ selectedWeek.title }}
          </p>
          <div
            v-for="assign in selectedWeek.assignments"
            :key="assign.id"
            class="border border-border rounded-lg p-3 cursor-pointer transition-colors"
            :class="selectedAssignmentId === assign.id ? 'bg-accent border-primary/40' : 'bg-card hover:bg-accent/50'"
            @click="loadDetail(assign.id)"
          >
            <p class="text-sm font-medium text-foreground truncate">{{ assign.title }}</p>
            <div class="flex items-center gap-2 mt-2">
              <!-- 진행 바 -->
              <div class="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  class="h-full bg-primary rounded-full transition-all"
                  :style="{ width: submissionPct(assign) + '%' }"
                />
              </div>
              <span class="text-xs text-muted-foreground flex-shrink-0">
                {{ submittedCount(assign) }}/{{ memberCount }}
              </span>
            </div>
            <p
              v-if="assign.dueDate"
              class="text-xs mt-1"
              :class="isOverdue(assign.dueDate) ? 'text-destructive' : 'text-muted-foreground'"
            >
              마감: {{ new Date(assign.dueDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) }}
            </p>
          </div>

          <div v-if="selectedWeek.assignments.length === 0" class="py-6 text-center">
            <p class="text-xs text-muted-foreground">과제가 없습니다</p>
          </div>
        </div>
      </div>

      <!-- 오른쪽: 멤버별 제출 상세 -->
      <div class="flex-1 min-w-0">
        <div v-if="!selectedAssignmentId" class="flex flex-col items-center justify-center h-64 border border-dashed border-border rounded-xl">
          <Icon icon="heroicons:cursor-arrow-rays" class="w-8 h-8 text-muted-foreground opacity-40 mb-2" />
          <p class="text-sm text-muted-foreground">왼쪽에서 과제를 선택하세요</p>
        </div>

        <div v-else-if="detailLoading" class="flex justify-center py-16">
          <Icon icon="heroicons:arrow-path" class="w-5 h-5 animate-spin text-muted-foreground" />
        </div>

        <div v-else class="border border-border rounded-xl bg-card overflow-hidden">
          <div class="px-4 py-3 border-b border-border bg-muted/20">
            <p class="text-sm font-semibold text-foreground">멤버별 제출 현황</p>
            <p class="text-xs text-muted-foreground mt-0.5">
              {{ submissionDetail.filter(m => m.submission).length }}명 제출 / {{ submissionDetail.length }}명
            </p>
          </div>

          <div class="divide-y divide-border">
            <div
              v-for="item in submissionDetail"
              :key="item.user.id"
              class="flex items-start gap-3 px-4 py-3"
            >
              <!-- 아바타 -->
              <div class="flex-shrink-0 w-8 h-8 rounded-full bg-muted overflow-hidden flex items-center justify-center">
                <img v-if="item.user.avatarUrl" :src="item.user.avatarUrl" class="w-full h-full object-cover" />
                <span v-else class="text-xs font-medium text-muted-foreground">
                  {{ (item.user.nickname ?? '?').slice(0, 2) }}
                </span>
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium text-foreground">{{ item.user.nickname }}</span>
                  <span
                    v-if="item.submission"
                    class="text-xs px-1.5 py-0.5 rounded-full"
                    :class="item.submission.status === 'LATE'
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'"
                  >
                    {{ item.submission.status === 'LATE' ? '지각' : '제출완료' }}
                  </span>
                  <span v-else class="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                    미제출
                  </span>
                </div>

                <template v-if="item.submission">
                  <p class="text-xs text-muted-foreground mt-0.5">
                    {{ formatDate(item.submission.submittedAt) }}
                  </p>
                  <a
                    v-if="item.submission.proofUrl"
                    :href="item.submission.proofUrl"
                    target="_blank"
                    class="text-xs text-primary hover:underline truncate block mt-0.5"
                  >
                    {{ item.submission.proofUrl }}
                  </a>
                  <p v-if="item.submission.content" class="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {{ item.submission.content }}
                  </p>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
