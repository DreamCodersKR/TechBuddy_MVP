<script setup lang="ts">
import { Icon } from '@iconify/vue'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: '신고 처리 - FLOWIT Admin' })

const { get: authGet, patch: authPatch } = useAuthFetch()

interface Report {
  id: string
  targetType: string
  targetId: string
  reason: string
  detail: string | null
  status: string
  createdAt: string
  reporter: { id: string; name: string; email: string }
}

const statusFilter = ref('')
const reports = ref<Report[]>([])
const loading = ref(false)
const selected = ref<Report | null>(null)
const actionValue = ref('')
const reviewLoading = ref(false)

async function loadReports() {
  loading.value = true
  try {
    const params = statusFilter.value ? `?status=${statusFilter.value}` : ''
    reports.value = await authGet<Report[]>(`/admin/reports${params}`)
  } finally { loading.value = false }
}

function openDetail(item: Report) {
  selected.value = item
  actionValue.value = 'DISMISSED'
}

async function submitReview() {
  if (!selected.value || !actionValue.value) return
  reviewLoading.value = true
  try {
    await authPatch(`/admin/reports/${selected.value.id}`, { status: actionValue.value })
    selected.value = null
    await loadReports()
  } finally { reviewLoading.value = false }
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'text-amber-500',
  REVIEWING: 'text-blue-500',
  ACTION_TAKEN: 'text-red-500',
  DISMISSED: 'text-muted-foreground',
}
const TARGET_LABELS: Record<string, string> = {
  POST: '게시글', COMMENT: '댓글', USER: '유저',
}
const REASON_LABELS: Record<string, string> = {
  SPAM: '스팸', HARASSMENT: '괴롭힘', INAPPROPRIATE: '부적절한 콘텐츠',
  MISINFORMATION: '허위정보', COPYRIGHT: '저작권', OTHER: '기타',
}

watch(statusFilter, loadReports)
onMounted(loadReports)
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-bold text-foreground">신고 처리</h1>
      <p v-if="reports.length" class="text-sm text-muted-foreground">{{ reports.length }}건</p>
    </div>

    <!-- 필터 -->
    <div class="mb-4">
      <select
        v-model="statusFilter"
        class="px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none"
      >
        <option value="">전체</option>
        <option value="PENDING">PENDING</option>
        <option value="REVIEWING">REVIEWING</option>
        <option value="ACTION_TAKEN">ACTION_TAKEN</option>
        <option value="DISMISSED">DISMISSED</option>
      </select>
    </div>

    <!-- 목록 -->
    <div class="bg-background border border-border rounded-xl overflow-hidden">
      <div v-if="loading" class="flex items-center justify-center h-32">
        <Icon icon="heroicons:arrow-path" class="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
      <div v-else-if="!reports.length" class="text-center py-10 text-sm text-muted-foreground">신고가 없습니다.</div>
      <table v-else class="w-full text-sm">
        <thead class="bg-muted/50">
          <tr>
            <th class="text-left px-4 py-3 text-xs font-medium text-muted-foreground">대상</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-muted-foreground">사유</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-muted-foreground">신고자</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-muted-foreground">상태</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-muted-foreground">신고일</th>
            <th class="px-4 py-3" />
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          <tr
            v-for="item in reports"
            :key="item.id"
            class="hover:bg-muted/30 transition-colors"
          >
            <td class="px-4 py-3 text-xs font-medium text-foreground">{{ TARGET_LABELS[item.targetType] ?? item.targetType }}</td>
            <td class="px-4 py-3 text-xs text-muted-foreground">{{ REASON_LABELS[item.reason] ?? item.reason }}</td>
            <td class="px-4 py-3">
              <p class="text-xs text-foreground">{{ item.reporter.name }}</p>
              <p class="text-xs text-muted-foreground">{{ item.reporter.email }}</p>
            </td>
            <td class="px-4 py-3">
              <span class="text-xs font-medium" :class="STATUS_COLORS[item.status] ?? ''">{{ item.status }}</span>
            </td>
            <td class="px-4 py-3 text-xs text-muted-foreground">
              {{ new Date(item.createdAt).toLocaleDateString('ko-KR') }}
            </td>
            <td class="px-4 py-3">
              <button
                v-if="item.status === 'PENDING' || item.status === 'REVIEWING'"
                class="text-xs text-primary hover:underline"
                @click="openDetail(item)"
              >처리</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 처리 모달 -->
    <div v-if="selected" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="selected = null">
      <div class="bg-background border border-border rounded-xl p-5 w-full max-w-md mx-4">
        <div class="flex items-center justify-between mb-3">
          <p class="font-semibold text-foreground">신고 처리</p>
          <button class="text-muted-foreground hover:text-foreground" @click="selected = null">
            <Icon icon="heroicons:x-mark" class="w-4 h-4" />
          </button>
        </div>
        <div class="space-y-1 mb-4 text-xs text-muted-foreground">
          <p>대상: <span class="text-foreground font-medium">{{ TARGET_LABELS[selected.targetType] ?? selected.targetType }}</span></p>
          <p>사유: <span class="text-foreground font-medium">{{ REASON_LABELS[selected.reason] ?? selected.reason }}</span></p>
          <p v-if="selected.detail">설명: {{ selected.detail }}</p>
          <p>신고자: {{ selected.reporter.name }} ({{ selected.reporter.email }})</p>
        </div>
        <p class="text-xs font-medium text-foreground mb-2">처리 결정</p>
        <select
          v-model="actionValue"
          class="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg mb-4"
        >
          <option value="DISMISSED">조치 없음 (기각)</option>
          <option value="REVIEWING">경고 검토</option>
          <option value="ACTION_TAKEN">콘텐츠 숨김 처리</option>
        </select>
        <div class="flex justify-end gap-2">
          <button class="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-accent" @click="selected = null">취소</button>
          <button
            :disabled="reviewLoading"
            class="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
            @click="submitReview"
          >처리 완료</button>
        </div>
      </div>
    </div>
  </div>
</template>
