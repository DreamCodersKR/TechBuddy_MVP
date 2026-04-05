<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'

definePageMeta({ layout: 'default', middleware: 'auth' })
useHead({ title: '크레딧 내역 - FLOWIT' })

const authStore = useAuthStore()
const { get: authGet } = useAuthFetch()

interface CreditTransaction {
  id: string
  amount: number
  type: 'EARN' | 'SPEND' | 'REFUND'
  description: string
  createdAt: string
}

const transactions = ref<CreditTransaction[]>([])
const loading = ref(true)
const page = ref(1)
const meta = ref({ total: 0, totalPages: 1 })

async function loadHistory() {
  loading.value = true
  try {
    const result = await authGet<{ data: CreditTransaction[]; meta: typeof meta.value }>(
      `/credits/history?page=${page.value}&limit=20`,
    )
    transactions.value = result.data
    meta.value = result.meta
  }
  catch { transactions.value = [] }
  finally { loading.value = false }
}

watch(page, () => loadHistory())
onMounted(() => loadHistory())

const credit = computed(() => (authStore.currentUser as any)?.credit ?? 0)

const TYPE_META: Record<string, { label: string; color: string; sign: string }> = {
  EARN: { label: '획득', color: 'text-green-600', sign: '+' },
  SPEND: { label: '사용', color: 'text-red-600', sign: '-' },
  REFUND: { label: '환불', color: 'text-blue-600', sign: '+' },
}
</script>

<template>
  <div class="max-w-xl mx-auto py-8 px-4">
    <div class="flex items-center gap-3 mb-6">
      <NuxtLink to="/mypage">
        <Button variant="ghost" size="icon">
          <Icon icon="heroicons:arrow-left" class="w-4 h-4" />
        </Button>
      </NuxtLink>
      <h1 class="text-xl font-bold text-foreground">크레딧</h1>
    </div>

    <!-- 잔액 카드 -->
    <div class="bg-card border border-border rounded-xl p-6 mb-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-muted-foreground mb-1">현재 잔액</p>
          <p class="text-3xl font-bold text-foreground">{{ credit.toLocaleString() }}<span class="text-base font-normal text-muted-foreground ml-1">크레딧</span></p>
        </div>
        <Icon icon="heroicons:currency-dollar" class="w-10 h-10 text-muted-foreground" />
      </div>
      <Button
        class="w-full mt-4"
        variant="outline"
        @click="$toast?.('준비 중인 기능입니다.') || alert('크레딧 충전은 준비 중입니다.')"
      >
        <Icon icon="heroicons:plus-circle" class="w-4 h-4 mr-2" />
        크레딧 충전
      </Button>
    </div>

    <!-- 거래 내역 -->
    <h2 class="text-sm font-semibold text-foreground mb-3">거래 내역</h2>

    <div v-if="loading" class="space-y-2">
      <div v-for="n in 5" :key="n" class="border border-border rounded-xl p-4">
        <div class="h-4 bg-muted animate-pulse rounded w-1/2 mb-2" />
        <div class="h-3 bg-muted animate-pulse rounded w-1/4" />
      </div>
    </div>

    <div v-else-if="transactions.length > 0" class="space-y-2">
      <div
        v-for="tx in transactions"
        :key="tx.id"
        class="border border-border rounded-xl p-4 flex items-center justify-between"
      >
        <div>
          <p class="text-sm font-medium text-foreground">{{ tx.description }}</p>
          <p class="text-xs text-muted-foreground mt-0.5">{{ useRelativeTime(tx.createdAt) }}</p>
        </div>
        <div class="text-right">
          <p class="text-sm font-bold" :class="TYPE_META[tx.type]?.color">
            {{ TYPE_META[tx.type]?.sign }}{{ Math.abs(tx.amount).toLocaleString() }}
          </p>
          <p class="text-xs text-muted-foreground">{{ TYPE_META[tx.type]?.label }}</p>
        </div>
      </div>

      <div v-if="meta.totalPages > 1" class="flex justify-center gap-2 mt-4">
        <Button variant="outline" size="sm" :disabled="page <= 1" @click="page--">이전</Button>
        <span class="text-sm text-muted-foreground flex items-center px-2">{{ page }} / {{ meta.totalPages }}</span>
        <Button variant="outline" size="sm" :disabled="page >= meta.totalPages" @click="page++">다음</Button>
      </div>
    </div>

    <div v-else class="flex flex-col items-center justify-center py-16 text-center border border-border rounded-xl">
      <Icon icon="heroicons:currency-dollar" class="w-10 h-10 text-muted-foreground mb-3" />
      <p class="text-sm font-medium text-foreground">거래 내역이 없습니다</p>
    </div>
  </div>
</template>
