<script setup lang="ts">
import { Icon } from '@iconify/vue'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: '유저 관리 - FLOWIT Admin' })

const { get: authGet } = useAuthFetch()

const search = ref('')
const planFilter = ref('')
const page = ref(1)

interface User {
  id: string; email: string; name: string; nickname: string | null
  role: string; plan: string; credit: number; level: number
  isBanned: boolean; createdAt: string
}
interface UsersResponse {
  users: User[]; total: number; totalPages: number
}

const data = ref<UsersResponse | null>(null)
const loading = ref(false)

async function loadUsers() {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (search.value) params.set('search', search.value)
    if (planFilter.value) params.set('plan', planFilter.value)
    params.set('page', String(page.value))
    data.value = await authGet<UsersResponse>(`/admin/users?${params}`)
  }
  finally { loading.value = false }
}

const PLAN_COLORS: Record<string, string> = {
  FREE: 'text-muted-foreground',
  PRO: 'text-blue-500',
  PREMIUM: 'text-violet-500',
}
const ROLE_COLORS: Record<string, string> = {
  USER: 'text-muted-foreground',
  MODERATOR: 'text-amber-500',
  ADMIN: 'text-blue-500',
  SUPER_ADMIN: 'text-red-500',
}

let searchTimer: ReturnType<typeof setTimeout>
watch(search, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { page.value = 1; loadUsers() }, 400)
})
watch([planFilter, page], loadUsers)
onMounted(loadUsers)
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-bold text-foreground">유저 관리</h1>
      <p v-if="data" class="text-sm text-muted-foreground">총 {{ data.total.toLocaleString() }}명</p>
    </div>

    <!-- 필터 -->
    <div class="flex gap-3 mb-4">
      <input
        v-model="search"
        type="text"
        placeholder="이름 / 이메일 / 닉네임 검색"
        class="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <select
        v-model="planFilter"
        class="px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none"
      >
        <option value="">전체 플랜</option>
        <option value="FREE">FREE</option>
        <option value="PRO">PRO</option>
        <option value="PREMIUM">PREMIUM</option>
      </select>
    </div>

    <!-- 테이블 -->
    <div class="bg-background border border-border rounded-xl overflow-hidden">
      <div v-if="loading" class="flex items-center justify-center h-40">
        <Icon icon="heroicons:arrow-path" class="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
      <table v-else class="w-full text-sm">
        <thead class="bg-muted/50">
          <tr>
            <th class="text-left px-4 py-3 text-xs font-medium text-muted-foreground">이름/이메일</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-muted-foreground">역할</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-muted-foreground">플랜</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-muted-foreground">크레딧</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-muted-foreground">가입일</th>
            <th class="px-4 py-3" />
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          <tr
            v-for="user in data?.users"
            :key="user.id"
            class="hover:bg-muted/30 transition-colors"
          >
            <td class="px-4 py-3">
              <p class="font-medium text-foreground">{{ user.name }}</p>
              <p class="text-xs text-muted-foreground">{{ user.email }}</p>
              <span v-if="user.isBanned" class="text-xs text-red-500 font-medium">정지됨</span>
            </td>
            <td class="px-4 py-3">
              <span class="text-xs font-medium" :class="ROLE_COLORS[user.role] ?? ''">{{ user.role }}</span>
            </td>
            <td class="px-4 py-3">
              <span class="text-xs font-medium" :class="PLAN_COLORS[user.plan] ?? ''">{{ user.plan }}</span>
            </td>
            <td class="px-4 py-3 text-xs text-foreground">{{ user.credit }}cr</td>
            <td class="px-4 py-3 text-xs text-muted-foreground">
              {{ new Date(user.createdAt).toLocaleDateString('ko-KR') }}
            </td>
            <td class="px-4 py-3">
              <NuxtLink :to="`/admin/users/${user.id}`" class="text-xs text-primary hover:underline">상세</NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 페이지네이션 -->
    <div v-if="data && data.totalPages > 1" class="flex justify-center gap-2 mt-4">
      <button
        v-for="p in data.totalPages"
        :key="p"
        class="w-8 h-8 text-sm rounded-lg border transition-colors"
        :class="p === page ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-accent'"
        @click="page = p"
      >{{ p }}</button>
    </div>
  </div>
</template>
