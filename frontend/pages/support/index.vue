<script setup lang="ts">
import { Icon } from '@iconify/vue'

definePageMeta({ middleware: 'auth' })
useHead({ title: '고객 지원 - FLOWIT' })

const { get: authGet, post: authPost } = useAuthFetch()

interface Inquiry {
  id: string
  type: string
  title: string
  content: string
  status: string
  reply: string | null
  repliedAt: string | null
  createdAt: string
}

const tab = ref<'list' | 'new'>('list')
const inquiries = ref<Inquiry[]>([])
const loading = ref(false)
const selected = ref<Inquiry | null>(null)

// 작성 폼
const form = reactive({ type: 'GENERAL', title: '', content: '' })
const submitLoading = ref(false)
const submitDone = ref(false)

async function loadInquiries() {
  loading.value = true
  try {
    inquiries.value = await authGet<Inquiry[]>('/support/inquiries')
  } finally { loading.value = false }
}

async function submitInquiry() {
  if (!form.title.trim() || form.content.trim().length < 10) return
  submitLoading.value = true
  try {
    await authPost('/support/inquiries', { ...form })
    submitDone.value = true
    form.title = ''
    form.content = ''
    form.type = 'GENERAL'
    await loadInquiries()
    setTimeout(() => { submitDone.value = false; tab.value = 'list' }, 1500)
  } finally { submitLoading.value = false }
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'text-amber-500',
  IN_PROGRESS: 'text-blue-500',
  RESOLVED: 'text-emerald-500',
  CLOSED: 'text-muted-foreground',
}
const STATUS_LABELS: Record<string, string> = {
  OPEN: '접수됨', IN_PROGRESS: '처리중', RESOLVED: '답변완료', CLOSED: '종료',
}
const TYPE_LABELS: Record<string, string> = {
  GENERAL: '일반', BUG: '버그', PAYMENT: '결제', ACCOUNT: '계정', OTHER: '기타',
}

watch(tab, (v) => { if (v === 'list') loadInquiries() })
onMounted(loadInquiries)
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-8">
    <h1 class="text-xl font-bold text-foreground mb-1">고객 지원</h1>
    <p class="text-sm text-muted-foreground mb-6">문의사항이 있으시면 아래 양식으로 접수해 주세요.</p>

    <!-- 탭 -->
    <div class="flex gap-1 border-b border-border mb-6">
      <button
        v-for="t in [{ key: 'list', label: '내 문의 내역' }, { key: 'new', label: '문의 작성' }]"
        :key="t.key"
        class="px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px"
        :class="tab === t.key
          ? 'border-primary text-primary'
          : 'border-transparent text-muted-foreground hover:text-foreground'"
        @click="tab = t.key as 'list' | 'new'"
      >{{ t.label }}</button>
    </div>

    <!-- 내 문의 목록 -->
    <div v-if="tab === 'list'">
      <div v-if="loading" class="flex items-center justify-center h-32">
        <Icon icon="heroicons:arrow-path" class="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
      <div v-else-if="!inquiries.length" class="text-center py-10 text-sm text-muted-foreground">
        <p>문의 내역이 없습니다.</p>
        <button class="mt-2 text-primary hover:underline" @click="tab = 'new'">첫 문의 작성하기</button>
      </div>
      <div v-else class="space-y-3">
        <div
          v-for="item in inquiries"
          :key="item.id"
          class="bg-background border border-border rounded-xl p-4 cursor-pointer hover:bg-muted/20 transition-colors"
          @click="selected = item"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs text-muted-foreground">{{ TYPE_LABELS[item.type] ?? item.type }}</span>
                <span class="text-xs font-medium" :class="STATUS_COLORS[item.status] ?? ''">{{ STATUS_LABELS[item.status] ?? item.status }}</span>
              </div>
              <p class="text-sm font-medium text-foreground truncate">{{ item.title }}</p>
              <p class="text-xs text-muted-foreground mt-0.5">{{ new Date(item.createdAt).toLocaleDateString('ko-KR') }}</p>
            </div>
            <Icon icon="heroicons:chevron-right" class="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
          </div>
        </div>
      </div>
    </div>

    <!-- 문의 작성 -->
    <div v-else>
      <div v-if="submitDone" class="text-center py-8">
        <Icon icon="heroicons:check-circle" class="w-12 h-12 text-emerald-500 mx-auto mb-2" />
        <p class="text-sm font-medium text-foreground">문의가 접수되었습니다.</p>
        <p class="text-xs text-muted-foreground mt-1">영업일 기준 1~2일 내 답변드리겠습니다.</p>
      </div>
      <div v-else class="space-y-4">
        <div>
          <label class="text-xs font-medium text-foreground block mb-1">유형</label>
          <select
            v-model="form.type"
            class="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="GENERAL">일반</option>
            <option value="BUG">버그 신고</option>
            <option value="PAYMENT">결제 문의</option>
            <option value="ACCOUNT">계정 문의</option>
            <option value="OTHER">기타</option>
          </select>
        </div>
        <div>
          <label class="text-xs font-medium text-foreground block mb-1">제목</label>
          <input
            v-model="form.title"
            type="text"
            placeholder="문의 제목을 입력하세요"
            class="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label class="text-xs font-medium text-foreground block mb-1">내용</label>
          <textarea
            v-model="form.content"
            rows="6"
            placeholder="문의 내용을 최소 10자 이상 입력해 주세요."
            class="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p class="text-xs text-muted-foreground mt-1">{{ form.content.length }}자</p>
        </div>
        <button
          :disabled="submitLoading || !form.title.trim() || form.content.trim().length < 10"
          class="w-full py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
          @click="submitInquiry"
        >
          <Icon v-if="submitLoading" icon="heroicons:arrow-path" class="w-4 h-4 animate-spin inline mr-1" />
          문의 제출
        </button>
      </div>
    </div>

    <!-- 문의 상세 모달 -->
    <div v-if="selected" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" @click.self="selected = null">
      <div class="bg-background border border-border rounded-xl p-5 w-full max-w-lg">
        <div class="flex items-center justify-between mb-3">
          <p class="font-semibold text-foreground">{{ selected.title }}</p>
          <button class="text-muted-foreground hover:text-foreground" @click="selected = null">
            <Icon icon="heroicons:x-mark" class="w-4 h-4" />
          </button>
        </div>
        <div class="flex items-center gap-2 mb-3">
          <span class="text-xs text-muted-foreground">{{ TYPE_LABELS[selected.type] ?? selected.type }}</span>
          <span class="text-xs font-medium" :class="STATUS_COLORS[selected.status] ?? ''">{{ STATUS_LABELS[selected.status] ?? selected.status }}</span>
          <span class="text-xs text-muted-foreground ml-auto">{{ new Date(selected.createdAt).toLocaleDateString('ko-KR') }}</span>
        </div>
        <div class="bg-muted/40 rounded-lg p-3 text-sm text-foreground mb-4 whitespace-pre-wrap">{{ selected.content }}</div>
        <div v-if="selected.reply" class="border border-border rounded-lg p-3">
          <p class="text-xs font-medium text-primary mb-1">관리자 답변</p>
          <p class="text-sm text-foreground whitespace-pre-wrap">{{ selected.reply }}</p>
          <p v-if="selected.repliedAt" class="text-xs text-muted-foreground mt-1">{{ new Date(selected.repliedAt).toLocaleDateString('ko-KR') }}</p>
        </div>
        <div v-else class="text-xs text-muted-foreground text-center py-2">아직 답변이 등록되지 않았습니다.</div>
      </div>
    </div>
  </div>
</template>
