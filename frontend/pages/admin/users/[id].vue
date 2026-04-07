<script setup lang="ts">
import { Icon } from '@iconify/vue'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const userId = route.params.id as string
const { get: authGet, patch: authPatch, post: authPost } = useAuthFetch()
const authStore = useAuthStore()

interface UserDetail {
  id: string; email: string; name: string; nickname: string | null
  role: string; plan: string; credit: number; level: number; xp: number
  isBanned: boolean; bannedAt: string | null; createdAt: string
  _count: { posts: number; agoraQuestions: number; aiConversations: number }
}

const user = ref<UserDetail | null>(null)
const loading = ref(true)

async function loadUser() {
  loading.value = true
  try {
    user.value = await authGet<UserDetail>(`/admin/users/${userId}`)
  } finally {
    loading.value = false }
}

// --- 플랜 변경 ---
const planModal = ref(false)
const newPlan = ref('')
const planLoading = ref(false)
async function changePlan() {
  if (!newPlan.value) return
  planLoading.value = true
  try {
    await authPatch(`/admin/users/${userId}/plan`, { plan: newPlan.value })
    planModal.value = false
    await loadUser()
  } finally { planLoading.value = false }
}

// --- 크레딧 ---
const creditModal = ref(false)
const creditAmount = ref(0)
const creditReason = ref('')
const creditLoading = ref(false)
async function adjustCredit() {
  if (!creditAmount.value || !creditReason.value.trim()) return
  creditLoading.value = true
  try {
    await authPost(`/admin/users/${userId}/credits`, { amount: creditAmount.value, reason: creditReason.value })
    creditModal.value = false
    creditAmount.value = 0
    creditReason.value = ''
    await loadUser()
  } finally { creditLoading.value = false }
}

// --- 역할 변경 (SUPER_ADMIN 전용) ---
const roleModal = ref(false)
const newRole = ref('')
const roleLoading = ref(false)
const isSuperAdmin = computed(() => authStore.currentUser?.role === 'SUPER_ADMIN')
async function changeRole() {
  if (!newRole.value) return
  roleLoading.value = true
  try {
    await authPatch(`/admin/users/${userId}/role`, { role: newRole.value })
    roleModal.value = false
    await loadUser()
  } finally { roleLoading.value = false }
}

// --- 정지 / 해제 ---
const banLoading = ref(false)
async function toggleBan() {
  banLoading.value = true
  try {
    const action = user.value?.isBanned ? 'unban' : 'ban'
    await authPost(`/admin/users/${userId}/${action}`, {})
    await loadUser()
  } finally { banLoading.value = false }
}

const PLAN_COLORS: Record<string, string> = {
  FREE: 'text-muted-foreground', PRO: 'text-blue-500', PREMIUM: 'text-violet-500',
}
const ROLE_COLORS: Record<string, string> = {
  USER: 'text-muted-foreground', MODERATOR: 'text-amber-500', ADMIN: 'text-blue-500', SUPER_ADMIN: 'text-red-500',
}

onMounted(loadUser)
</script>

<template>
  <div>
    <div class="flex items-center gap-3 mb-6">
      <NuxtLink to="/admin/users" class="text-muted-foreground hover:text-foreground">
        <Icon icon="heroicons:arrow-left" class="w-4 h-4" />
      </NuxtLink>
      <h1 class="text-xl font-bold text-foreground">유저 상세</h1>
    </div>

    <div v-if="loading" class="flex items-center justify-center h-40">
      <Icon icon="heroicons:arrow-path" class="w-5 h-5 animate-spin text-muted-foreground" />
    </div>

    <template v-else-if="user">
      <!-- 기본 정보 -->
      <div class="bg-background border border-border rounded-xl p-5 mb-4">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-lg font-bold text-foreground">{{ user.name }}</p>
            <p class="text-sm text-muted-foreground">{{ user.email }}</p>
            <p v-if="user.nickname" class="text-xs text-muted-foreground mt-0.5">@{{ user.nickname }}</p>
            <span v-if="user.isBanned" class="inline-block mt-1 text-xs text-red-500 font-medium bg-red-50 dark:bg-red-950 px-2 py-0.5 rounded">
              정지됨 ({{ user.bannedAt ? new Date(user.bannedAt).toLocaleDateString('ko-KR') : '' }})
            </span>
          </div>
          <p class="text-xs text-muted-foreground">
            가입일: {{ new Date(user.createdAt).toLocaleDateString('ko-KR') }}
          </p>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div class="bg-muted/40 rounded-lg p-3 text-center">
            <p class="text-xs text-muted-foreground">역할</p>
            <p class="text-sm font-semibold mt-0.5" :class="ROLE_COLORS[user.role] ?? ''">{{ user.role }}</p>
          </div>
          <div class="bg-muted/40 rounded-lg p-3 text-center">
            <p class="text-xs text-muted-foreground">플랜</p>
            <p class="text-sm font-semibold mt-0.5" :class="PLAN_COLORS[user.plan] ?? ''">{{ user.plan }}</p>
          </div>
          <div class="bg-muted/40 rounded-lg p-3 text-center">
            <p class="text-xs text-muted-foreground">크레딧</p>
            <p class="text-sm font-semibold text-foreground mt-0.5">{{ user.credit.toLocaleString() }}cr</p>
          </div>
          <div class="bg-muted/40 rounded-lg p-3 text-center">
            <p class="text-xs text-muted-foreground">레벨 / XP</p>
            <p class="text-sm font-semibold text-foreground mt-0.5">Lv.{{ user.level }} / {{ user.xp }}xp</p>
          </div>
        </div>
      </div>

      <!-- 활동 통계 -->
      <div class="bg-background border border-border rounded-xl p-5 mb-4">
        <p class="text-sm font-semibold text-foreground mb-3">활동 통계</p>
        <div class="grid grid-cols-3 gap-3 text-center">
          <div>
            <p class="text-xl font-bold text-foreground">{{ user._count.posts }}</p>
            <p class="text-xs text-muted-foreground mt-0.5">게시글</p>
          </div>
          <div>
            <p class="text-xl font-bold text-foreground">{{ user._count.agoraQuestions }}</p>
            <p class="text-xs text-muted-foreground mt-0.5">아고라 질문</p>
          </div>
          <div>
            <p class="text-xl font-bold text-foreground">{{ user._count.aiConversations }}</p>
            <p class="text-xs text-muted-foreground mt-0.5">AI 대화</p>
          </div>
        </div>
      </div>

      <!-- 관리 액션 -->
      <div class="bg-background border border-border rounded-xl p-5">
        <p class="text-sm font-semibold text-foreground mb-3">관리 액션</p>
        <div class="flex flex-wrap gap-2">
          <button
            class="px-3 py-1.5 text-xs font-medium bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
            @click="newPlan = user.plan; planModal = true"
          >플랜 변경</button>

          <button
            class="px-3 py-1.5 text-xs font-medium bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors"
            @click="creditModal = true"
          >크레딧 지급/차감</button>

          <button
            v-if="isSuperAdmin"
            class="px-3 py-1.5 text-xs font-medium bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-900 transition-colors"
            @click="newRole = user.role; roleModal = true"
          >역할 변경</button>

          <button
            :disabled="banLoading"
            class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
            :class="user.isBanned
              ? 'bg-muted text-muted-foreground hover:bg-muted/80'
              : 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900'"
            @click="toggleBan"
          >{{ user.isBanned ? '정지 해제' : '계정 정지' }}</button>
        </div>
      </div>
    </template>

    <!-- 플랜 변경 모달 -->
    <div v-if="planModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="planModal = false">
      <div class="bg-background border border-border rounded-xl p-5 w-80">
        <p class="text-sm font-semibold text-foreground mb-3">플랜 변경</p>
        <select v-model="newPlan" class="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg mb-3">
          <option value="FREE">FREE</option>
          <option value="PRO">PRO</option>
          <option value="PREMIUM">PREMIUM</option>
        </select>
        <div class="flex gap-2 justify-end">
          <button class="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-accent" @click="planModal = false">취소</button>
          <button
            :disabled="planLoading"
            class="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
            @click="changePlan"
          >변경</button>
        </div>
      </div>
    </div>

    <!-- 크레딧 모달 -->
    <div v-if="creditModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="creditModal = false">
      <div class="bg-background border border-border rounded-xl p-5 w-80">
        <p class="text-sm font-semibold text-foreground mb-3">크레딧 지급 / 차감</p>
        <input
          v-model.number="creditAmount"
          type="number"
          placeholder="양수 = 지급, 음수 = 차감"
          class="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          v-model="creditReason"
          type="text"
          placeholder="사유 입력"
          class="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <div class="flex gap-2 justify-end">
          <button class="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-accent" @click="creditModal = false">취소</button>
          <button
            :disabled="creditLoading || !creditAmount || !creditReason.trim()"
            class="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
            @click="adjustCredit"
          >적용</button>
        </div>
      </div>
    </div>

    <!-- 역할 변경 모달 -->
    <div v-if="roleModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="roleModal = false">
      <div class="bg-background border border-border rounded-xl p-5 w-80">
        <p class="text-sm font-semibold text-foreground mb-1">역할 변경 <span class="text-xs text-red-500">(SUPER_ADMIN 전용)</span></p>
        <select v-model="newRole" class="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg mb-3 mt-2">
          <option value="USER">USER</option>
          <option value="MODERATOR">MODERATOR</option>
          <option value="ADMIN">ADMIN</option>
          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
        </select>
        <div class="flex gap-2 justify-end">
          <button class="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-accent" @click="roleModal = false">취소</button>
          <button
            :disabled="roleLoading"
            class="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
            @click="changeRole"
          >변경</button>
        </div>
      </div>
    </div>
  </div>
</template>
