<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'
import { toast } from 'vue-sonner'
import { formatRelativeTime } from '@/utils/formatters'

definePageMeta({ layout: 'default', middleware: 'pricing-gate' })
useHead({ title: 'FLOWIT AI - FLOWIT' })

const authStore = useAuthStore()
const { get: authGet, delete: authDelete } = useAuthFetch()

interface Conversation {
  id: string
  title: string
  updatedAt: string
  contextType: string | null
  contextId: string | null
  _count: { messages: number }
}

const conversations = ref<Conversation[]>([])
const loading = ref(true)
const inputContent = ref('')
const searchQuery = ref('')

// 사이드바 토글
const isSidebarOpen = ref(true)

// 프로필 팝업
const showProfileMenu = ref(false)
const profileMenuRef = ref<HTMLElement | null>(null)

const userCredit = computed(() => authStore.currentUser?.credit ?? 0)
const userNickname = computed(() => authStore.currentUser?.nickname ?? '사용자')
const userPlan = computed(() => authStore.currentUser?.plan ?? 'FREE')
const userInitials = computed(() => {
  const n = authStore.currentUser?.nickname ?? 'U'
  return n.slice(0, 2).toUpperCase()
})
const planLabel = computed(() => {
  const map: Record<string, string> = { FREE: 'Free', PRO: 'Pro', PREMIUM: 'Premium' }
  return map[userPlan.value] ?? 'Free'
})

const filteredConversations = computed(() => {
  if (!searchQuery.value.trim()) return conversations.value
  return conversations.value.filter(c =>
    c.title.toLowerCase().includes(searchQuery.value.toLowerCase()),
  )
})

async function loadConversations() {
  loading.value = true
  try {
    conversations.value = await authGet<Conversation[]>('/ai-mentor/conversations')
  }
  catch { conversations.value = [] }
  finally { loading.value = false }
}

async function handleDelete(id: string, e: Event) {
  e.stopPropagation()
  if (!confirm('이 대화를 삭제하시겠습니까?')) return
  try {
    await authDelete(`/ai-mentor/conversations/${id}`)
    conversations.value = conversations.value.filter(c => c.id !== id)
  }
  catch { toast.error('삭제에 실패했습니다.') }
}

const formatDate = formatRelativeTime

function handleStartChat() {
  const text = inputContent.value.trim()
  if (!text) {
    navigateTo('/ai-mentor/new')
    return
  }
  navigateTo(`/ai-mentor/new?prefill=${encodeURIComponent(text)}`)
}

function setPreset(text: string) {
  inputContent.value = text
  nextTick(() => handleStartChat())
}

function handleCurriculumChat(topic: string) {
  navigateTo(`/ai-mentor/new?prefill=${encodeURIComponent(topic)}`)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
    e.preventDefault()
    handleStartChat()
  }
}

async function handleLogout() {
  showProfileMenu.value = false
  await authStore.logout()
}

function handleOutsideClick(e: MouseEvent) {
  if (profileMenuRef.value && !profileMenuRef.value.contains(e.target as Node)) {
    showProfileMenu.value = false
  }
}

onMounted(() => {
  loadConversations()
  document.addEventListener('click', handleOutsideClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick)
})
</script>

<template>
  <!-- GNB 아래 full-height 2-panel 레이아웃 -->
  <div class="flex h-[calc(100vh-57px)] overflow-hidden">

    <!-- ── 왼쪽 사이드바 ── -->
    <aside
      class="flex-shrink-0 flex flex-col border-r border-border bg-card transition-all duration-300 overflow-hidden relative"
      :class="isSidebarOpen ? 'w-64' : 'w-0'"
    >
      <!-- 사이드바 헤더: 토글 버튼 -->
      <div class="flex items-center justify-between p-3 flex-shrink-0">
        <span class="text-sm font-semibold text-foreground">FLOWIT AI</span>
        <button
          class="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          title="사이드바 닫기"
          @click="isSidebarOpen = false"
        >
          <Icon icon="heroicons:chevron-double-left" class="w-4 h-4" />
        </button>
      </div>

      <!-- 새 채팅 버튼 -->
      <div class="px-3 pb-2 flex-shrink-0">
        <Button
          class="w-full justify-start gap-2"
          variant="outline"
          @click="navigateTo('/ai-mentor/new')"
        >
          <Icon icon="heroicons:plus" class="w-4 h-4" />
          새 채팅
        </Button>
      </div>

      <!-- 검색 -->
      <div class="px-3 pb-2 flex-shrink-0">
        <div class="relative">
          <Icon icon="heroicons:magnifying-glass" class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="대화 검색..."
            class="w-full pl-8 pr-3 py-1.5 text-xs bg-muted rounded-lg border-0 outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
          >
        </div>
      </div>

      <!-- 대화 목록 -->
      <div class="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
        <!-- 로딩 -->
        <template v-if="loading">
          <div
            v-for="n in 5"
            :key="n"
            class="px-3 py-2.5 rounded-lg"
          >
            <div class="h-3.5 bg-muted animate-pulse rounded w-3/4 mb-1.5" />
            <div class="h-2.5 bg-muted animate-pulse rounded w-1/3" />
          </div>
        </template>

        <!-- 대화 없음 -->
        <div
          v-else-if="conversations.length === 0"
          class="px-3 py-6 text-center"
        >
          <p class="text-xs text-muted-foreground leading-relaxed">
            아직 대화 기록이 없어요<br>
            새 채팅을 시작해보세요
          </p>
        </div>

        <!-- 검색 결과 없음 -->
        <div
          v-else-if="filteredConversations.length === 0"
          class="px-3 py-6 text-center"
        >
          <p class="text-xs text-muted-foreground">
            검색 결과가 없어요
          </p>
        </div>

        <!-- 대화 목록 -->
        <div
          v-for="conv in filteredConversations"
          :key="conv.id"
          class="group flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-accent cursor-pointer transition-colors"
          @click="navigateTo(`/ai-mentor/${conv.id}`)"
        >
          <div class="flex-1 min-w-0">
            <p class="text-xs font-medium text-foreground truncate flex items-center gap-1">
              <Icon v-if="conv.contextType" icon="heroicons:link" class="w-3 h-3 text-violet-500 flex-shrink-0" title="Task 참조" />
              {{ conv.title }}
            </p>
            <p class="text-[11px] text-muted-foreground mt-0.5">
              {{ formatDate(conv.updatedAt) }}
            </p>
          </div>
          <button
            class="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10 hover:text-destructive"
            @click.stop="handleDelete(conv.id, $event)"
          >
            <Icon icon="heroicons:trash" class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <!-- 하단: 크레딧 + 프로필 -->
      <div class="flex-shrink-0 border-t border-border">
        <!-- 크레딧 -->
        <div class="px-3 pt-3 pb-2">
          <div class="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20">
            <Icon icon="heroicons:bolt" class="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span class="text-xs text-amber-700 dark:text-amber-400">
              보유 크레딧 <span class="font-semibold">{{ userCredit }}cr</span>
            </span>
          </div>
        </div>

        <!-- 프로필 버튼 + 팝업 -->
        <div
          ref="profileMenuRef"
          class="relative px-3 pb-3"
        >
          <!-- 프로필 팝업 (위로 올라옴) -->
          <Transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="opacity-0 translate-y-2"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition-all duration-150 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 translate-y-2"
          >
            <div
              v-if="showProfileMenu"
              class="absolute bottom-full left-0 right-0 mb-1 mx-0 bg-popover border border-border rounded-xl shadow-lg overflow-hidden z-50"
            >
              <!-- 프로필 정보 -->
              <div class="flex items-center gap-3 px-4 py-3 border-b border-border">
                <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-semibold text-primary-foreground flex-shrink-0">
                  {{ userInitials }}
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-medium text-foreground truncate">{{ userNickname }}</p>
                  <p class="text-xs text-muted-foreground">{{ planLabel }} 플랜</p>
                </div>
              </div>
              <!-- 메뉴 항목 -->
              <div class="py-1">
                <button
                  v-if="userPlan !== 'PREMIUM'"
                  class="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
                  @click="showProfileMenu = false; navigateTo('/pricing')"
                >
                  <Icon icon="heroicons:sparkles" class="w-4 h-4 text-violet-500 flex-shrink-0" />
                  플랜 업그레이드
                </button>
                <button
                  class="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
                  @click="showProfileMenu = false; navigateTo('/mypage')"
                >
                  <Icon icon="heroicons:user-circle" class="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  마이페이지
                </button>
              </div>
              <div class="border-t border-border py-1">
                <button
                  class="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  @click="handleLogout"
                >
                  <Icon icon="heroicons:arrow-right-on-rectangle" class="w-4 h-4 flex-shrink-0" />
                  로그아웃
                </button>
              </div>
            </div>
          </Transition>

          <!-- 프로필 버튼 -->
          <button
            class="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-accent transition-colors"
            @click.stop="showProfileMenu = !showProfileMenu"
          >
            <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-semibold text-primary-foreground flex-shrink-0">
              {{ userInitials }}
            </div>
            <div class="flex-1 text-left min-w-0">
              <p class="text-sm font-medium text-foreground truncate">{{ userNickname }}</p>
              <p class="text-xs text-muted-foreground">{{ planLabel }}</p>
            </div>
            <Icon
              icon="heroicons:ellipsis-horizontal"
              class="w-4 h-4 text-muted-foreground flex-shrink-0"
            />
          </button>
        </div>
      </div>
    </aside>

    <!-- ── 메인 영역 ── -->
    <main class="flex-1 flex flex-col overflow-hidden bg-background min-w-0">
      <!-- 사이드바 닫혔을 때 토글 버튼 -->
      <div
        v-if="!isSidebarOpen"
        class="flex-shrink-0 p-3 border-b border-border flex items-center gap-3"
      >
        <button
          class="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          title="사이드바 열기"
          @click="isSidebarOpen = true"
        >
          <Icon icon="heroicons:chevron-double-right" class="w-4 h-4" />
        </button>
        <span class="text-sm font-semibold text-foreground">FLOWIT AI</span>
      </div>

      <!-- 중앙 빈 상태 -->
      <div class="flex-1 flex flex-col items-center justify-center px-6 pb-4 overflow-y-auto">
        <!-- 로고 -->
        <div class="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-5 flex-shrink-0">
          <Icon icon="heroicons:sparkles" class="w-8 h-8 text-violet-500" />
        </div>
        <h1 class="text-2xl font-bold text-foreground mb-2 flex-shrink-0">
          FLOWIT AI
        </h1>
        <p class="text-sm text-muted-foreground mb-6 text-center max-w-sm flex-shrink-0">
          코드, 설계, 문서 등 무엇이든 물어보세요
        </p>

        <!-- 추천 학습 카드 -->
        <div class="w-full max-w-lg mb-6 flex-shrink-0">
          <AiMentorCurriculumCard @start-chat="handleCurriculumChat" />
        </div>

        <!-- 빠른 시작 예시 카드 -->
        <div class="grid grid-cols-2 gap-3 w-full max-w-lg flex-shrink-0">
          <button
            class="flex flex-col gap-1.5 p-4 text-left border border-border rounded-xl hover:bg-accent transition-colors"
            @click="setPreset('이 코드의 문제점을 분석하고 개선점을 알려주세요')"
          >
            <Icon icon="heroicons:code-bracket" class="w-4 h-4 text-violet-500" />
            <span class="text-sm font-medium text-foreground">코드 리뷰</span>
            <span class="text-xs text-muted-foreground">코드 분석 및 개선점 제안</span>
          </button>
          <button
            class="flex flex-col gap-1.5 p-4 text-left border border-border rounded-xl hover:bg-accent transition-colors"
            @click="setPreset('아키텍처 설계를 도와주세요')"
          >
            <Icon icon="heroicons:squares-2x2" class="w-4 h-4 text-violet-500" />
            <span class="text-sm font-medium text-foreground">설계 도움</span>
            <span class="text-xs text-muted-foreground">시스템 및 DB 설계 가이드</span>
          </button>
          <button
            class="flex flex-col gap-1.5 p-4 text-left border border-border rounded-xl hover:bg-accent transition-colors"
            @click="setPreset('에러 메시지를 분석하고 해결 방법을 알려주세요')"
          >
            <Icon icon="heroicons:bug-ant" class="w-4 h-4 text-violet-500" />
            <span class="text-sm font-medium text-foreground">디버깅</span>
            <span class="text-xs text-muted-foreground">에러 원인 파악 및 해결</span>
          </button>
          <button
            class="flex flex-col gap-1.5 p-4 text-left border border-border rounded-xl hover:bg-accent transition-colors"
            @click="setPreset('기술 문서를 작성해주세요')"
          >
            <Icon icon="heroicons:document-text" class="w-4 h-4 text-violet-500" />
            <span class="text-sm font-medium text-foreground">문서 작성</span>
            <span class="text-xs text-muted-foreground">README, API 문서 등 작성</span>
          </button>
        </div>
      </div>

      <!-- 하단 입력창 -->
      <div class="px-6 pb-6 flex-shrink-0">
        <div class="max-w-2xl mx-auto">
          <div class="border border-border rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-ring bg-card shadow-sm">
            <textarea
              v-model="inputContent"
              placeholder="무엇이든 물어보세요..."
              rows="3"
              class="w-full px-4 pt-3 pb-1 text-sm bg-transparent resize-none focus:outline-none"
              @keydown="handleKeydown"
            />
            <div class="flex items-center justify-between px-4 py-2">
              <span class="text-xs text-muted-foreground">
                Enter 전송 · Shift+Enter 줄바꿈
              </span>
              <Button
                size="sm"
                :disabled="!inputContent.trim()"
                @click="handleStartChat"
              >
                <Icon icon="heroicons:paper-airplane" class="w-4 h-4 mr-1.5" />
                시작하기
              </Button>
            </div>
          </div>
          <p class="text-center text-xs text-muted-foreground mt-2">
            AI는 실수할 수 있습니다. 중요한 정보는 반드시 검토하세요.
          </p>
        </div>
      </div>
    </main>
  </div>
</template>
