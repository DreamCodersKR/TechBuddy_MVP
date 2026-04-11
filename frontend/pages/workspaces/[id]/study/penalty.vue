<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { toast } from 'vue-sonner'

definePageMeta({ layout: 'workspace' })

const route = useRoute()
const { get: authGet, post: authPost, delete: authDel } = useAuthFetch()
const authStore = useAuthStore()

const workspaceId = computed(() => route.params.id as string)
const myId = computed(() => (authStore.currentUser as any)?.id)

interface PenaltyConsent {
  id: string
  userId: string
  agreedAt: string
  user: { id: string; nickname: string; avatarUrl: string | null }
}

interface PenaltyHistory {
  id: string
  userId: string
  amount: number
  reason: string
  createdAt: string
  user: { id: string; nickname: string }
}

interface PenaltyRule {
  id: string
  isEnabled: boolean
  depositAmount: number
  penaltyPerMiss: number
  periodStart: string | null
  periodEnd: string | null
  consents: PenaltyConsent[]
  histories: PenaltyHistory[]
}

const rule = ref<PenaltyRule | null>(null)
const memberCount = ref(0)
const loading = ref(true)
const isAdmin = ref(false)
const members = ref<any[]>([])

// 설정 폼
const showForm = ref(false)
const form = ref({ depositAmount: 100, penaltyPerMiss: 20, periodStart: '', periodEnd: '' })
const saving = ref(false)
const consenting = ref(false)

async function load() {
  loading.value = true
  try {
    const [penaltyData, membersData] = await Promise.all([
      authGet<{ rule: PenaltyRule | null; memberCount: number }>(`/workspaces/${workspaceId.value}/study/penalty`),
      authGet<any[]>(`/workspaces/${workspaceId.value}/members`),
    ])
    rule.value = penaltyData.rule
    memberCount.value = penaltyData.memberCount
    members.value = membersData

    const me = membersData.find((m: any) => m.userId === myId.value)
    isAdmin.value = me?.role === 'ADMIN'

    if (penaltyData.rule) {
      form.value = {
        depositAmount: penaltyData.rule.depositAmount,
        penaltyPerMiss: penaltyData.rule.penaltyPerMiss,
        periodStart: penaltyData.rule.periodStart?.slice(0, 10) ?? '',
        periodEnd: penaltyData.rule.periodEnd?.slice(0, 10) ?? '',
      }
    }
  }
  finally { loading.value = false }
}

onMounted(load)

async function saveRule() {
  saving.value = true
  try {
    await authPost(`/workspaces/${workspaceId.value}/study/penalty`, {
      depositAmount: form.value.depositAmount,
      penaltyPerMiss: form.value.penaltyPerMiss,
      periodStart: form.value.periodStart ? new Date(form.value.periodStart).toISOString() : undefined,
      periodEnd: form.value.periodEnd ? new Date(form.value.periodEnd).toISOString() : undefined,
    })
    showForm.value = false
    await load()
  }
  catch (e: unknown) { const err = e as { data?: { message?: string } }; toast.error(err?.data?.message || '저장 실패') }
  finally { saving.value = false }
}

const hasConsented = computed(() => rule.value?.consents.some((c) => c.userId === myId.value) ?? false)

async function toggleConsent() {
  consenting.value = true
  try {
    if (hasConsented.value) {
      await authDel(`/workspaces/${workspaceId.value}/study/penalty/consent`)
    }
    else {
      await authPost(`/workspaces/${workspaceId.value}/study/penalty/consent`, {})
    }
    await load()
  }
  catch (e: unknown) { const err = e as { data?: { message?: string } }; toast.error(err?.data?.message || '처리 실패') }
  finally { consenting.value = false }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })
}

const consentRate = computed(() => {
  if (!rule.value || !memberCount.value) return 0
  return Math.round((rule.value.consents.length / memberCount.value) * 100)
})
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <div class="mb-6">
      <h1 class="text-xl font-bold text-foreground">벌금 관리</h1>
      <p class="text-sm text-muted-foreground mt-0.5">크레딧 기반 벌금 제도로 스터디 참여를 독려합니다</p>
    </div>

    <div v-if="loading" class="flex justify-center py-16">
      <Icon icon="heroicons:arrow-path" class="w-6 h-6 animate-spin text-muted-foreground" />
    </div>

    <div v-else class="space-y-4">
      <!-- 벌금 규칙 없음 (ADMIN에게 설정 유도) -->
      <div
        v-if="!rule && !showForm"
        class="border border-dashed border-border rounded-xl p-8 text-center"
      >
        <Icon icon="heroicons:banknotes" class="w-10 h-10 text-muted-foreground opacity-30 mx-auto mb-3" />
        <p class="text-sm font-medium text-muted-foreground">벌금 규칙이 설정되지 않았습니다</p>
        <p class="text-xs text-muted-foreground mt-1">전원 동의 후 크레딧 기반 벌금 제도가 활성화됩니다</p>
        <button
          v-if="isAdmin"
          class="mt-4 px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:opacity-90 transition"
          @click="showForm = true"
        >
          벌금 규칙 설정
        </button>
      </div>

      <!-- 규칙 설정 폼 (ADMIN) -->
      <div v-if="showForm || (rule && isAdmin)" class="border border-border rounded-xl bg-card p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-foreground">
            {{ rule ? '규칙 수정' : '규칙 설정' }}
          </h3>
          <span v-if="rule && rule.isEnabled" class="text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 px-2 py-0.5 rounded-full">
            수정 시 동의 초기화
          </span>
        </div>

        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-xs font-medium text-muted-foreground mb-1.5">1인 예치금 (cr)</label>
            <input
              v-model.number="form.depositAmount"
              type="number"
              min="0"
              class="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-muted-foreground mb-1.5">1회 미제출 벌금 (cr)</label>
            <input
              v-model.number="form.penaltyPerMiss"
              type="number"
              min="0"
              class="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-muted-foreground mb-1.5">시작일</label>
            <input
              v-model="form.periodStart"
              type="date"
              class="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-muted-foreground mb-1.5">종료일</label>
            <input
              v-model="form.periodEnd"
              type="date"
              class="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div class="flex gap-2 justify-end">
          <button
            v-if="showForm && !rule"
            class="px-3 py-2 text-sm border border-border rounded-lg hover:bg-accent transition"
            @click="showForm = false"
          >
            취소
          </button>
          <button
            :disabled="saving"
            class="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition"
            @click="saveRule"
          >
            {{ saving ? '저장 중...' : '저장' }}
          </button>
        </div>
      </div>

      <!-- 현재 규칙 요약 카드 -->
      <div v-if="rule && !showForm" class="border border-border rounded-xl bg-card overflow-hidden">
        <!-- 상태 배너 -->
        <div
          class="px-4 py-2 text-xs font-medium flex items-center gap-2"
          :class="rule.isEnabled
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
            : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'"
        >
          <Icon :icon="rule.isEnabled ? 'heroicons:check-circle' : 'heroicons:clock'" class="w-3.5 h-3.5" />
          {{ rule.isEnabled ? '활성화됨 — 벌금 규칙이 적용 중입니다' : `동의 대기 중 (${rule.consents.length}/${memberCount}명)` }}
        </div>

        <div class="p-5 grid grid-cols-2 gap-4">
          <div>
            <p class="text-xs text-muted-foreground">1인 예치금</p>
            <p class="text-lg font-bold text-foreground mt-0.5">{{ rule.depositAmount }} cr</p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground">1회 미제출 벌금</p>
            <p class="text-lg font-bold text-destructive mt-0.5">-{{ rule.penaltyPerMiss }} cr</p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground">적용 기간</p>
            <p class="text-sm text-foreground mt-0.5">
              {{ formatDate(rule.periodStart) }} ~ {{ formatDate(rule.periodEnd) }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground">총 예치금 풀</p>
            <p class="text-sm font-semibold text-foreground mt-0.5">
              {{ rule.depositAmount * memberCount }} cr
            </p>
          </div>
        </div>
      </div>

      <!-- 동의 현황 -->
      <div v-if="rule" class="border border-border rounded-xl bg-card p-5">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-sm font-semibold text-foreground">동의 현황</h3>
            <p class="text-xs text-muted-foreground mt-0.5">전원 동의 시 자동으로 활성화됩니다</p>
          </div>
          <!-- 내 동의 버튼 -->
          <button
            v-if="!rule.isEnabled"
            :disabled="consenting"
            class="px-3 py-1.5 text-xs rounded-lg border transition-colors"
            :class="hasConsented
              ? 'border-destructive text-destructive hover:bg-destructive/10'
              : 'border-primary text-primary hover:bg-primary/10'"
            @click="toggleConsent"
          >
            {{ consenting ? '처리 중...' : (hasConsented ? '동의 철회' : '동의하기') }}
          </button>
        </div>

        <!-- 동의율 바 -->
        <div class="flex items-center gap-3 mb-4">
          <div class="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all"
              :class="rule.isEnabled ? 'bg-green-500' : 'bg-primary'"
              :style="{ width: consentRate + '%' }"
            />
          </div>
          <span class="text-xs font-medium text-foreground">{{ rule.consents.length }}/{{ memberCount }}</span>
        </div>

        <!-- 동의 멤버 아바타 목록 -->
        <div class="flex flex-wrap gap-2">
          <div
            v-for="member in members"
            :key="member.userId"
            class="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs"
            :class="rule.consents.some(c => c.userId === member.userId)
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              : 'bg-muted text-muted-foreground'"
          >
            <Icon
              :icon="rule.consents.some(c => c.userId === member.userId) ? 'heroicons:check' : 'heroicons:clock'"
              class="w-3 h-3"
            />
            {{ member.user?.nickname ?? '?' }}
          </div>
        </div>
      </div>

      <!-- 벌금 이력 -->
      <div v-if="rule && rule.histories.length > 0" class="border border-border rounded-xl bg-card overflow-hidden">
        <div class="px-4 py-3 border-b border-border">
          <h3 class="text-sm font-semibold text-foreground">벌금 이력</h3>
        </div>
        <div class="divide-y divide-border">
          <div
            v-for="h in rule.histories"
            :key="h.id"
            class="flex items-center justify-between px-4 py-3"
          >
            <div>
              <p class="text-sm text-foreground">{{ h.user.nickname }}</p>
              <p class="text-xs text-muted-foreground mt-0.5">{{ h.reason }}</p>
            </div>
            <div class="text-right">
              <p class="text-sm font-semibold text-destructive">-{{ h.amount }} cr</p>
              <p class="text-xs text-muted-foreground mt-0.5">{{ formatDate(h.createdAt) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
