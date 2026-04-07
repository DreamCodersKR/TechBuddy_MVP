<script setup lang="ts">
import { Icon } from '@iconify/vue'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: '문의 처리 - FLOWIT Admin' })

const { get: authGet, patch: authPatch } = useAuthFetch()

interface Inquiry {
  id: string
  type: string
  title: string
  content: string
  status: string
  reply: string | null
  repliedAt: string | null
  createdAt: string
  user: { id: string; name: string; email: string }
}

const statusFilter = ref('')
const inquiries = ref<Inquiry[]>([])
const loading = ref(false)
const selected = ref<Inquiry | null>(null)
const replyText = ref('')
const replyLoading = ref(false)

async function loadInquiries() {
  loading.value = true
  try {
    const params = statusFilter.value ? `?status=${statusFilter.value}` : ''
    inquiries.value = await authGet<Inquiry[]>(`/admin/inquiries${params}`)
  } finally { loading.value = false }
}

function openDetail(item: Inquiry) {
  selected.value = item
  replyText.value = item.reply ?? ''
}

async function submitReply() {
  if (!selected.value || !replyText.value.trim()) return
  replyLoading.value = true
  try {
    await authPatch(`/admin/inquiries/${selected.value.id}/reply`, { reply: replyText.value })
    selected.value = null
    await loadInquiries()
  } finally { replyLoading.value = false }
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'text-amber-500',
  IN_PROGRESS: 'text-blue-500',
  RESOLVED: 'text-emerald-500',
  CLOSED: 'text-muted-foreground',
}
const TYPE_LABELS: Record<string, string> = {
  GENERAL: '일반', BUG: '버그', PAYMENT: '결제', ACCOUNT: '계정', OTHER: '기타',
}

watch(statusFilter, loadInquiries)
onMounted(loadInquiries)
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-bold text-foreground">문의 처리</h1>
      <p v-if="inquiries.length" class="text-sm text-muted-foreground">{{ inquiries.length }}건</p>
    </div>

    <!-- 필터 -->
    <div class="mb-4">
      <select
        v-model="statusFilter"
        class="px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none"
      >
        <option value="">전체</option>
        <option value="OPEN">OPEN</option>
        <option value="IN_PROGRESS">IN_PROGRESS</option>
        <option value="RESOLVED">RESOLVED</option>
        <option value="CLOSED">CLOSED</option>
      </select>
    </div>

    <!-- 목록 -->
    <div class="bg-background border border-border rounded-xl overflow-hidden">
      <div v-if="loading" class="flex items-center justify-center h-32">
        <Icon icon="heroicons:arrow-path" class="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
      <div v-else-if="!inquiries.length" class="text-center py-10 text-sm text-muted-foreground">문의가 없습니다.</div>
      <table v-else class="w-full text-sm">
        <thead class="bg-muted/50">
          <tr>
            <th class="text-left px-4 py-3 text-xs font-medium text-muted-foreground">유형</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-muted-foreground">제목</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-muted-foreground">작성자</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-muted-foreground">상태</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-muted-foreground">접수일</th>
            <th class="px-4 py-3" />
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          <tr
            v-for="item in inquiries"
            :key="item.id"
            class="hover:bg-muted/30 transition-colors"
          >
            <td class="px-4 py-3 text-xs text-muted-foreground">{{ TYPE_LABELS[item.type] ?? item.type }}</td>
            <td class="px-4 py-3 font-medium text-foreground">{{ item.title }}</td>
            <td class="px-4 py-3">
              <p class="text-xs text-foreground">{{ item.user.name }}</p>
              <p class="text-xs text-muted-foreground">{{ item.user.email }}</p>
            </td>
            <td class="px-4 py-3">
              <span class="text-xs font-medium" :class="STATUS_COLORS[item.status] ?? ''">{{ item.status }}</span>
            </td>
            <td class="px-4 py-3 text-xs text-muted-foreground">
              {{ new Date(item.createdAt).toLocaleDateString('ko-KR') }}
            </td>
            <td class="px-4 py-3">
              <button class="text-xs text-primary hover:underline" @click="openDetail(item)">처리</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 상세 / 답변 모달 -->
    <div v-if="selected" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="selected = null">
      <div class="bg-background border border-border rounded-xl p-5 w-full max-w-lg mx-4">
        <div class="flex items-center justify-between mb-3">
          <p class="font-semibold text-foreground">{{ selected.title }}</p>
          <button class="text-muted-foreground hover:text-foreground" @click="selected = null">
            <Icon icon="heroicons:x-mark" class="w-4 h-4" />
          </button>
        </div>
        <p class="text-xs text-muted-foreground mb-1">{{ selected.user.name }} · {{ new Date(selected.createdAt).toLocaleDateString('ko-KR') }}</p>
        <div class="bg-muted/40 rounded-lg p-3 text-sm text-foreground mb-4 whitespace-pre-wrap">{{ selected.content }}</div>
        <p class="text-xs font-medium text-foreground mb-1">답변</p>
        <textarea
          v-model="replyText"
          rows="4"
          placeholder="답변을 입력하세요..."
          class="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring mb-3"
        />
        <div class="flex justify-end gap-2">
          <button class="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-accent" @click="selected = null">닫기</button>
          <button
            :disabled="replyLoading || !replyText.trim()"
            class="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
            @click="submitReply"
          >답변 저장</button>
        </div>
      </div>
    </div>
  </div>
</template>
