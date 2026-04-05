<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'

definePageMeta({ layout: 'default', middleware: 'auth' })
useHead({ title: '크레딧 - FLOWIT' })

const authStore = useAuthStore()
const { get: authGet } = useAuthFetch()

type TxType = 'EARN' | 'SPEND' | 'REFUND'

interface CreditTransaction {
  id: string
  amount: number
  type: TxType
  description: string
  relatedId: string | null
  createdAt: string
}

const credit = computed(() => (authStore.currentUser as any)?.credit ?? 0)
const plan = computed(() => (authStore.currentUser as any)?.plan ?? 'FREE')

const transactions = ref<CreditTransaction[]>([])
const loading = ref(true)
const page = ref(1)
const meta = ref({ total: 0, totalPages: 1 })

async function loadHistory() {
  loading.value = true
  try {
    const res = await authGet<{ data: CreditTransaction[], meta: typeof meta.value }>(
      `/credits/history?page=${page.value}&limit=20`,
    )
    transactions.value = res.data
    meta.value = res.meta
  }
  catch { transactions.value = [] }
  finally { loading.value = false }
}

watch(page, () => loadHistory())
onMounted(() => loadHistory())

const TX_META: Record<TxType, { label: string; icon: string; color: string; amountColor: string }> = {
  EARN: { label: '획득', icon: 'heroicons:arrow-down-circle', color: 'text-green-500', amountColor: 'text-green-600' },
  SPEND: { label: '소비', icon: 'heroicons:arrow-up-circle', color: 'text-red-500', amountColor: 'text-red-600' },
  REFUND: { label: '환불', icon: 'heroicons:arrow-path', color: 'text-blue-500', amountColor: 'text-blue-600' },
}

const CHARGE_PACKAGES = [
  { credits: 1000, price: '₩5,500' },
  { credits: 5000, price: '₩22,000' },
  { credits: 10000, price: '₩38,500' },
]

const PLAN_LABEL: Record<string, string> = { FREE: 'Free', PRO: 'Pro', PREMIUM: 'Premium' }
const PLAN_COLOR: Record<string, string> = {
  FREE: 'bg-muted text-muted-foreground',
  PRO: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  PREMIUM: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
}
</script>

<template>
  <div class="max-w-2xl mx-auto py-8 px-4">
    <!-- 헤더 -->
    <div class="flex items-center gap-3 mb-6">
      <NuxtLink to="/mypage">
        <Button variant="ghost" size="icon">
          <Icon icon="heroicons:arrow-left" class="w-4 h-4" />
        </Button>
      </NuxtLink>
      <h1 class="text-xl font-bold text-foreground">크레딧</h1>
    </div>

    <!-- 섹션 1: 크레딧 현황 -->
    <div class="bg-card border border-border rounded-xl p-6 mb-6">
      <div class="flex items-start justify-between">
        <div>
          <p class="text-sm text-muted-foreground mb-1">현재 잔액</p>
          <div class="flex items-center gap-2">
            <Icon icon="heroicons:currency-dollar" class="w-7 h-7 text-yellow-500" />
            <span class="text-3xl font-bold text-foreground">{{ credit.toLocaleString() }}</span>
            <span class="text-base text-muted-foreground">cr</span>
          </div>
        </div>
        <span
          class="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full"
          :class="PLAN_COLOR[plan] ?? PLAN_COLOR.FREE"
        >
          {{ PLAN_LABEL[plan] ?? plan }}
        </span>
      </div>
    </div>

    <!-- 섹션 3: 충전 패키지 (Mock) -->
    <div class="bg-card border border-border rounded-xl p-6 mb-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-sm font-semibold text-foreground">크레딧 충전</h2>
        <span class="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">준비중</span>
      </div>
      <div class="grid grid-cols-3 gap-3">
        <div
          v-for="pkg in CHARGE_PACKAGES"
          :key="pkg.credits"
          class="border border-border rounded-xl p-4 text-center opacity-60 cursor-not-allowed"
        >
          <div class="flex items-center justify-center gap-1 mb-1">
            <Icon icon="heroicons:currency-dollar" class="w-4 h-4 text-yellow-500" />
            <span class="text-lg font-bold text-foreground">{{ pkg.credits.toLocaleString() }}</span>
          </div>
          <p class="text-xs text-muted-foreground mb-3">크레딧</p>
          <p class="text-sm font-semibold text-foreground">{{ pkg.price }}</p>
        </div>
      </div>
    </div>

    <!-- 섹션 2: 거래 내역 -->
    <div class="bg-card border border-border rounded-xl p-6">
      <h2 class="text-sm font-semibold text-foreground mb-4">
        거래 내역
        <span v-if="!loading" class="text-muted-foreground font-normal">({{ meta.total }}건)</span>
      </h2>

      <!-- 로딩 -->
      <div v-if="loading" class="space-y-3">
        <div
          v-for="n in 5"
          :key="n"
          class="flex items-center gap-3 py-2"
        >
          <div class="h-8 w-8 rounded-full bg-muted animate-pulse flex-shrink-0" />
          <div class="flex-1">
            <div class="h-3.5 bg-muted animate-pulse rounded w-1/2 mb-1.5" />
            <div class="h-3 bg-muted animate-pulse rounded w-1/4" />
          </div>
          <div class="h-4 w-16 bg-muted animate-pulse rounded" />
        </div>
      </div>

      <!-- 내역 목록 -->
      <div v-else-if="transactions.length > 0" class="divide-y divide-border">
        <div
          v-for="tx in transactions"
          :key="tx.id"
          class="flex items-center gap-3 py-3"
        >
          <div
            class="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0"
          >
            <Icon
              :icon="TX_META[tx.type]?.icon ?? 'heroicons:currency-dollar'"
              class="w-4 h-4"
              :class="TX_META[tx.type]?.color"
            />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm text-foreground truncate">{{ tx.description }}</p>
            <p class="text-xs text-muted-foreground">{{ useRelativeTime(tx.createdAt) }}</p>
          </div>
          <span
            class="text-sm font-semibold flex-shrink-0"
            :class="TX_META[tx.type]?.amountColor"
          >
            {{ tx.amount > 0 ? '+' : '' }}{{ tx.amount.toLocaleString() }} cr
          </span>
        </div>

        <!-- 페이지네이션 -->
        <div v-if="meta.totalPages > 1" class="flex justify-center gap-2 pt-4">
          <Button variant="outline" size="sm" :disabled="page <= 1" @click="page--">
            이전
          </Button>
          <span class="text-sm text-muted-foreground flex items-center px-2">
            {{ page }} / {{ meta.totalPages }}
          </span>
          <Button variant="outline" size="sm" :disabled="page >= meta.totalPages" @click="page++">
            다음
          </Button>
        </div>
      </div>

      <!-- 빈 상태 -->
      <div
        v-else
        class="flex flex-col items-center justify-center py-12 text-center"
      >
        <Icon icon="heroicons:currency-dollar" class="w-8 h-8 text-muted-foreground mb-2" />
        <p class="text-sm text-muted-foreground">아직 거래 내역이 없습니다.</p>
      </div>
    </div>
  </div>
</template>
