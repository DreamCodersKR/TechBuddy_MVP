<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'
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

definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const config = useRuntimeConfig()
const { post: authPost, delete: authDelete } = useAuthFetch()

const agoraId = route.params.id as string

// ─── 타입 ────────────────────────────────────────────────
interface Author {
  id: string
  name: string
  nickname: string | null
  avatarUrl: string | null
  userBadges?: { badge: string }[]
}

const BADGE_CONFIG: Record<string, { icon: string; class: string }> = {
  SUBSCRIBER: { icon: 'heroicons:sparkles', class: 'text-violet-500' },
  LOYALTY: { icon: 'heroicons:trophy', class: 'text-amber-500' },
  ORGANIZATION: { icon: 'heroicons:building-office', class: 'text-blue-500' },
  ACTIVITY: { icon: 'heroicons:bolt', class: 'text-orange-400' },
  NEW_MEMBER: { icon: 'heroicons:star', class: 'text-green-500' },
}

interface AgoraAnswer {
  id: string
  content: string
  isAccepted: boolean
  createdAt: string
  authorId: string
  author: Author
}

interface AgoraDetail {
  id: string
  title: string
  content: string
  bounty: number
  status: 'OPEN' | 'CLOSED'
  viewCount: number
  createdAt: string
  authorId: string
  author: Author
  answers: AgoraAnswer[]
}

// ─── 상태 ────────────────────────────────────────────────
const agora = ref<AgoraDetail | null>(null)
const loading = ref(true)
const loadError = ref('')

const answerContent = ref('')
const isAnswering = ref(false)
const answerError = ref('')

const showDeleteDialog = ref(false)
const isDeleting = ref(false)

const deleteAnswerId = ref('')
const showDeleteAnswerDialog = ref(false)
const isDeletingAnswer = ref(false)

const isAccepting = ref(false)

// ─── 계산 ────────────────────────────────────────────────
const isAuthor = computed(
  () => authStore.isAuthenticated && agora.value?.authorId === authStore.currentUser?.id,
)

const canAnswer = computed(
  () => authStore.isAuthenticated && agora.value?.status === 'OPEN' && !isAuthor.value,
)

const canDelete = computed(
  () => isAuthor.value && (agora.value?.answers.length ?? 0) === 0 && agora.value?.status === 'OPEN',
)

const acceptedAnswer = computed(
  () => agora.value?.answers.find(a => a.isAccepted) ?? null,
)

useHead(() => ({
  title: agora.value ? `${agora.value.title} - FLOWIT` : '아고라 - FLOWIT',
}))

// ─── 데이터 패칭 ─────────────────────────────────────────
async function fetchAgora() {
  loading.value = true
  loadError.value = ''
  try {
    agora.value = await $fetch<AgoraDetail>(`${config.public.apiBaseUrl}/agora/${agoraId}`)
  }
  catch {
    loadError.value = '질문을 불러올 수 없습니다.'
  }
  finally {
    loading.value = false
  }
}

// ─── 답변 작성 ───────────────────────────────────────────
async function submitAnswer() {
  if (!answerContent.value.trim()) {
    answerError.value = '답변을 입력해주세요.'
    return
  }
  answerError.value = ''
  isAnswering.value = true
  try {
    const answer = await authPost<AgoraAnswer>(`/agora/${agoraId}/answers`, {
      content: answerContent.value.trim(),
    })
    agora.value?.answers.push(answer)
    answerContent.value = ''
  }
  catch (error: unknown) {
    const err = error as { data?: { message?: string } }
    answerError.value = err?.data?.message || '답변 작성에 실패했습니다.'
  }
  finally {
    isAnswering.value = false
  }
}

// ─── 답변 채택 ───────────────────────────────────────────
async function acceptAnswer(answerId: string) {
  if (isAccepting.value) return
  isAccepting.value = true
  try {
    await authPost(`/agora/${agoraId}/answers/${answerId}/accept`, {})
    await fetchAgora()
  }
  catch (error: unknown) {
    const err = error as { data?: { message?: string } }
    alert(err?.data?.message || '채택에 실패했습니다.')
  }
  finally {
    isAccepting.value = false
  }
}

// ─── 질문 삭제 ───────────────────────────────────────────
async function deleteAgora() {
  isDeleting.value = true
  try {
    await authDelete(`/agora/${agoraId}`)
    await router.push('/agora')
  }
  catch (error: unknown) {
    const err = error as { data?: { message?: string } }
    alert(err?.data?.message || '삭제에 실패했습니다.')
    showDeleteDialog.value = false
  }
  finally {
    isDeleting.value = false
  }
}

// ─── 답변 삭제 ───────────────────────────────────────────
function openDeleteAnswerDialog(answerId: string) {
  deleteAnswerId.value = answerId
  showDeleteAnswerDialog.value = true
}

async function deleteAnswer() {
  if (!deleteAnswerId.value) return
  isDeletingAnswer.value = true
  try {
    await authDelete(`/agora/${agoraId}/answers/${deleteAnswerId.value}`)
    if (agora.value) {
      agora.value.answers = agora.value.answers.filter(a => a.id !== deleteAnswerId.value)
    }
  }
  catch (error: unknown) {
    const err = error as { data?: { message?: string } }
    alert(err?.data?.message || '답변 삭제에 실패했습니다.')
  }
  finally {
    isDeletingAnswer.value = false
    showDeleteAnswerDialog.value = false
    deleteAnswerId.value = ''
  }
}

// ─── 마운트 ──────────────────────────────────────────────
await fetchAgora()
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- 뒤로가기 -->
    <button
      class="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      @click="router.back()"
    >
      <Icon icon="heroicons:arrow-left" class="w-4 h-4" />
      목록으로
    </button>

    <!-- 로딩 -->
    <template v-if="loading">
      <div class="space-y-4">
        <div class="h-8 bg-muted animate-pulse rounded w-2/3" />
        <div class="h-4 bg-muted animate-pulse rounded w-1/4" />
        <div class="h-40 bg-muted animate-pulse rounded" />
      </div>
    </template>

    <!-- 에러 -->
    <div v-else-if="loadError" class="flex flex-col items-center justify-center py-20 text-center">
      <Icon icon="heroicons:exclamation-circle" class="w-12 h-12 text-muted-foreground mb-4" />
      <p class="text-muted-foreground">{{ loadError }}</p>
    </div>

    <template v-else-if="agora">
      <!-- 질문 카드 -->
      <div class="border border-border rounded-lg bg-card p-6 mb-6">
        <!-- 상태 배지 + 현상금 -->
        <div class="flex items-center justify-between mb-3">
          <span
            class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full"
            :class="agora.status === 'CLOSED'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'"
          >
            <Icon
              :icon="agora.status === 'CLOSED' ? 'heroicons:check-circle' : 'heroicons:question-mark-circle'"
              class="w-3.5 h-3.5"
            />
            {{ agora.status === 'CLOSED' ? '채택완료' : '미채택' }}
          </span>
          <span class="text-sm font-semibold text-amber-500">💎 {{ agora.bounty.toLocaleString() }}cr</span>
        </div>

        <!-- 제목 -->
        <h1 class="text-xl font-bold text-foreground mb-4">{{ agora.title }}</h1>

        <!-- 메타 -->
        <div class="flex items-center gap-4 text-xs text-muted-foreground mb-5">
          <span class="font-medium text-foreground">{{ agora.author.nickname ?? agora.author.name }}</span>
          <span>{{ useRelativeTime(agora.createdAt) }}</span>
          <span class="flex items-center gap-1">
            <Icon icon="heroicons:eye" class="w-3 h-3" />
            {{ agora.viewCount }}
          </span>
          <span class="flex items-center gap-1">
            <Icon icon="heroicons:chat-bubble-left" class="w-3 h-3" />
            {{ agora.answers.length }}개 답변
          </span>
        </div>

        <!-- 본문 -->
        <div class="border-t border-border pt-5">
          <PostMarkdownViewer :content="agora.content" />
        </div>

        <!-- 질문 삭제 버튼 (작성자 + 답변 0개) -->
        <div v-if="canDelete" class="flex justify-end mt-4 pt-4 border-t border-border">
          <Button variant="outline" size="sm" class="text-destructive hover:text-destructive" @click="showDeleteDialog = true">
            <Icon icon="heroicons:trash" class="w-4 h-4 mr-1.5" />
            질문 삭제
          </Button>
        </div>
      </div>

      <!-- 질문 삭제 다이얼로그 -->
      <AlertDialog v-model:open="showDeleteDialog">
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>질문을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              삭제 시 현상금(💎 {{ agora.bounty.toLocaleString() }}cr)이 전액 환불됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction :disabled="isDeleting" class="bg-destructive hover:bg-destructive/90" @click="deleteAgora">
              {{ isDeleting ? '삭제 중...' : '삭제' }}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <!-- 답변 목록 -->
      <div class="mb-6">
        <h2 class="text-base font-semibold text-foreground mb-3">
          답변 {{ agora.answers.length }}개
        </h2>

        <!-- 빈 상태 -->
        <div v-if="agora.answers.length === 0" class="border border-border rounded-lg bg-card p-8 text-center">
          <Icon icon="heroicons:chat-bubble-left-ellipsis" class="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p class="text-muted-foreground text-sm">아직 답변이 없어요. 첫 번째로 답변해보세요!</p>
        </div>

        <!-- 답변 카드 -->
        <div v-else class="space-y-3">
          <div
            v-for="answer in agora.answers"
            :key="answer.id"
            class="border rounded-lg bg-card p-5"
            :class="answer.isAccepted ? 'border-green-400 dark:border-green-600' : 'border-border'"
          >
            <!-- 채택 배지 -->
            <div v-if="answer.isAccepted" class="flex items-center gap-1.5 text-xs font-semibold text-green-600 dark:text-green-400 mb-3">
              <Icon icon="heroicons:check-badge" class="w-4 h-4" />
              채택된 답변 · 💎 {{ agora.bounty.toLocaleString() }}cr 지급
            </div>

            <!-- 답변 내용 -->
            <p class="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{{ answer.content }}</p>

            <!-- 메타 + 버튼 -->
            <div class="flex items-center justify-between mt-4 pt-3 border-t border-border">
              <div class="flex items-center gap-2 text-xs text-muted-foreground">
                <span class="font-medium text-foreground">{{ answer.author.nickname ?? answer.author.name }}</span>
                <Icon
                  v-for="ub in answer.author.userBadges?.slice(0, 2)"
                  :key="ub.badge"
                  :icon="BADGE_CONFIG[ub.badge]?.icon || 'heroicons:star'"
                  class="w-3.5 h-3.5"
                  :class="BADGE_CONFIG[ub.badge]?.class"
                />
                <span>{{ useRelativeTime(answer.createdAt) }}</span>
              </div>
              <div class="flex items-center gap-2">
                <!-- 채택 버튼 (질문 작성자 + 미채택 질문 + 채택 안된 답변) -->
                <Button
                  v-if="isAuthor && agora.status === 'OPEN' && !answer.isAccepted"
                  size="sm"
                  variant="outline"
                  class="text-xs text-green-600 border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                  :disabled="isAccepting"
                  @click="acceptAnswer(answer.id)"
                >
                  <Icon icon="heroicons:check" class="w-3.5 h-3.5 mr-1" />
                  채택
                </Button>
                <!-- 답변 삭제 (답변 작성자 + 채택 안된 경우) -->
                <Button
                  v-if="authStore.currentUser?.id === answer.authorId && !answer.isAccepted"
                  size="sm"
                  variant="ghost"
                  class="text-xs text-muted-foreground hover:text-destructive"
                  @click="openDeleteAnswerDialog(answer.id)"
                >
                  <Icon icon="heroicons:trash" class="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 답변 삭제 다이얼로그 -->
      <AlertDialog v-model:open="showDeleteAnswerDialog">
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>답변을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>삭제한 답변은 복구할 수 없습니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction :disabled="isDeletingAnswer" class="bg-destructive hover:bg-destructive/90" @click="deleteAnswer">
              {{ isDeletingAnswer ? '삭제 중...' : '삭제' }}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <!-- 답변 작성 폼 -->
      <div v-if="canAnswer" class="border border-border rounded-lg bg-card p-5">
        <h3 class="text-sm font-semibold text-foreground mb-3">답변 작성</h3>
        <textarea
          v-model="answerContent"
          rows="5"
          placeholder="답변을 입력하세요..."
          class="w-full px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          :class="answerError ? 'border-destructive' : ''"
        />
        <p v-if="answerError" class="text-sm text-destructive mt-1">{{ answerError }}</p>
        <div class="flex justify-end mt-3">
          <Button :disabled="isAnswering || !answerContent.trim()" @click="submitAnswer">
            <Icon v-if="isAnswering" icon="heroicons:arrow-path" class="mr-2 w-4 h-4 animate-spin" />
            {{ isAnswering ? '작성 중...' : '답변 등록' }}
          </Button>
        </div>
      </div>

      <!-- 미로그인 안내 -->
      <div v-else-if="!authStore.isAuthenticated" class="border border-border rounded-lg bg-card p-5 text-center">
        <p class="text-sm text-muted-foreground mb-3">로그인 후 답변을 작성할 수 있어요.</p>
        <Button size="sm" @click="navigateTo('/auth/login')">로그인하기</Button>
      </div>

      <!-- 채택완료 안내 -->
      <div v-else-if="agora.status === 'CLOSED'" class="border border-border rounded-lg bg-card p-5 text-center">
        <Icon icon="heroicons:check-circle" class="w-8 h-8 text-green-500 mx-auto mb-2" />
        <p class="text-sm text-muted-foreground">채택이 완료된 질문입니다.</p>
      </div>

      <!-- 본인 질문 안내 -->
      <div v-else-if="isAuthor && agora.status === 'OPEN'" class="border border-border rounded-lg bg-card p-5 text-center">
        <p class="text-sm text-muted-foreground">본인 질문에는 답변을 작성할 수 없습니다.</p>
      </div>
    </template>
  </div>
</template>
