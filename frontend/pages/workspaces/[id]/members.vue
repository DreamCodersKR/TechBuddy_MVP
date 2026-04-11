<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

definePageMeta({ layout: 'workspace', middleware: 'auth' })
useHead({ title: '멤버 관리 - FLOWIT' })

const route = useRoute()
const workspaceId = route.params.id as string
const authStore = useAuthStore()
const { get: authGet, post: authPost, patch: authPatch, delete: authDelete } = useAuthFetch()

interface Member {
  id: string
  role: 'ADMIN' | 'MEMBER' | 'MENTOR'
  createdAt: string
  user: { id: string, name: string, nickname: string | null, avatarUrl: string | null, email: string }
}

const ROLE_LABEL: Record<string, string> = { ADMIN: '관리자', MEMBER: '멤버', MENTOR: '멘토' }
const ROLE_COLOR: Record<string, string> = {
  ADMIN: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  MEMBER: 'bg-muted text-muted-foreground',
  MENTOR: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
}

const members = ref<Member[]>([])
const loading = ref(true)
const currentUserRole = ref<string>('')

const isAdmin = computed(() => currentUserRole.value === 'ADMIN')

async function loadMembers() {
  loading.value = true
  try {
    const res = await authGet<Member[]>(`/workspaces/${workspaceId}/members`)
    members.value = res
    const me = res.find(m => m.user.id === authStore.currentUser?.id)
    currentUserRole.value = me?.role ?? ''
  }
  catch { members.value = [] }
  finally { loading.value = false }
}

// ─── 초대 ────────────────────────────────────────────────
const showInvite = ref(false)
const inviteEmail = ref('')
const isInviting = ref(false)

async function handleInvite() {
  if (!inviteEmail.value.trim()) return
  isInviting.value = true
  try {
    await authPost(`/workspaces/${workspaceId}/members`, { email: inviteEmail.value.trim() })
    inviteEmail.value = ''
    showInvite.value = false
    await loadMembers()
  }
  catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    toast.error(err?.data?.message || '초대에 실패했습니다.')
  }
  finally { isInviting.value = false }
}

// ─── 역할 변경 ───────────────────────────────────────────
async function handleRoleChange(memberId: string, role: string) {
  try {
    await authPatch(`/workspaces/${workspaceId}/members/${memberId}/role`, { role })
    const m = members.value.find(m => m.id === memberId)
    if (m) m.role = role as Member['role']
  }
  catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    toast.error(err?.data?.message || '역할 변경에 실패했습니다.')
  }
}

// ─── 멤버 제거 ───────────────────────────────────────────
async function handleRemove(memberId: string, userName: string) {
  if (!confirm(`'${userName}'을(를) 워크스페이스에서 내보내시겠습니까?`)) return
  try {
    await authDelete(`/workspaces/${workspaceId}/members/${memberId}`)
    members.value = members.value.filter(m => m.id !== memberId)
  }
  catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    toast.error(err?.data?.message || '멤버 제거에 실패했습니다.')
  }
}

onMounted(() => { loadMembers() })
</script>

<template>
  <div class="max-w-3xl">
    <!-- 헤더 -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-bold text-foreground">
          멤버 관리
        </h2>
        <p class="text-sm text-muted-foreground mt-0.5">
          {{ members.length }}명 참여 중
        </p>
      </div>
      <Button
        v-if="isAdmin"
        @click="showInvite = !showInvite"
      >
        <Icon
          icon="heroicons:user-plus"
          class="w-4 h-4 mr-2"
        />
        멤버 초대
      </Button>
    </div>

    <!-- 초대 폼 -->
    <div
      v-if="showInvite && isAdmin"
      class="border border-border rounded-xl p-4 mb-6 bg-muted/20"
    >
      <p class="text-sm font-medium mb-3">
        이메일로 초대
      </p>
      <div class="flex gap-2">
        <Input
          v-model="inviteEmail"
          placeholder="이메일 주소 입력"
          type="email"
          class="flex-1"
          @keydown.enter="handleInvite"
        />
        <Button
          :disabled="!inviteEmail.trim() || isInviting"
          @click="handleInvite"
        >
          <Icon
            v-if="isInviting"
            icon="heroicons:arrow-path"
            class="w-4 h-4 animate-spin"
          />
          <span v-else>초대</span>
        </Button>
      </div>
    </div>

    <!-- 로딩 -->
    <div
      v-if="loading"
      class="space-y-3"
    >
      <div
        v-for="n in 3"
        :key="n"
        class="border border-border rounded-xl p-4 flex items-center gap-3"
      >
        <div class="h-10 w-10 rounded-full bg-muted animate-pulse" />
        <div class="flex-1 space-y-2">
          <div class="h-4 bg-muted animate-pulse rounded w-1/3" />
          <div class="h-3 bg-muted animate-pulse rounded w-1/4" />
        </div>
      </div>
    </div>

    <!-- 멤버 목록 -->
    <div
      v-else
      class="space-y-2"
    >
      <div
        v-for="m in members"
        :key="m.id"
        class="border border-border rounded-xl p-4 flex items-center gap-4 bg-card"
      >
        <!-- 아바타 -->
        <div class="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium overflow-hidden flex-shrink-0">
          <img
            v-if="m.user.avatarUrl"
            :src="m.user.avatarUrl"
            class="h-full w-full object-cover"
          >
          <span v-else>{{ (m.user.nickname ?? m.user.name).slice(0, 1) }}</span>
        </div>

        <!-- 이름/이메일 -->
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-foreground">
            {{ m.user.nickname ?? m.user.name }}
            <span
              v-if="m.user.id === authStore.currentUser?.id"
              class="text-xs text-muted-foreground ml-1"
            >(나)</span>
          </p>
          <p class="text-xs text-muted-foreground truncate">
            {{ m.user.email }}
          </p>
        </div>

        <!-- 역할 뱃지 / 변경 -->
        <div class="flex items-center gap-2 flex-shrink-0">
          <template v-if="isAdmin && m.user.id !== authStore.currentUser?.id && m.role !== 'ADMIN'">
            <select
              :value="m.role"
              class="h-8 px-2 text-xs border border-border rounded-md bg-background focus:outline-none"
              @change="handleRoleChange(m.id, ($event.target as HTMLSelectElement).value)"
            >
              <option value="MEMBER">
                멤버
              </option>
              <option value="MENTOR">
                멘토
              </option>
            </select>
          </template>
          <template v-else>
            <span
              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
              :class="ROLE_COLOR[m.role]"
            >
              {{ ROLE_LABEL[m.role] }}
            </span>
          </template>

          <!-- 내보내기 (관리자, 본인 및 다른 관리자 제외) -->
          <button
            v-if="isAdmin && m.user.id !== authStore.currentUser?.id && m.role !== 'ADMIN'"
            class="p-1 text-muted-foreground hover:text-destructive transition-colors"
            title="멤버 내보내기"
            @click="handleRemove(m.id, m.user.nickname ?? m.user.name)"
          >
            <Icon
              icon="heroicons:x-mark"
              class="w-4 h-4"
            />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
