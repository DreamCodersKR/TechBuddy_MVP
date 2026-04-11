<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDateShort } from '@/utils/formatters'

definePageMeta({ layout: 'default', middleware: 'auth' })
useHead({ title: '친구 초대 - FLOWIT' })

const { get: authGet } = useAuthFetch()
const config = useRuntimeConfig()

interface CodeInfo {
  code: string
  usedCount: number
  referrerReward: number
  inviteeReward: number
}
interface Stats {
  code: string | null
  totalInvited: number
  totalEarned: number
  recentInvitees: { id: string; name: string; nickname: string | null; avatarUrl: string | null; createdAt: string }[]
}

const codeInfo = ref<CodeInfo | null>(null)
const stats = ref<Stats | null>(null)
const copied = ref(false)

async function load() {
  const [c, s] = await Promise.all([
    authGet<CodeInfo>('/referral/my-code'),
    authGet<Stats>('/referral/stats'),
  ])
  codeInfo.value = c
  stats.value = s
}

onMounted(() => load())

const inviteLink = computed(() => {
  const base = config.public.apiBase?.replace('/api', '') ?? 'https://flowit.co'
  return `${base}/auth/register?ref=${codeInfo.value?.code ?? ''}`
})

async function copyLink() {
  await navigator.clipboard.writeText(inviteLink.value)
  copied.value = true
  setTimeout(() => copied.value = false, 2000)
}

const formatDate = formatDateShort
</script>

<template>
  <div class="max-w-2xl mx-auto py-8 px-4">
    <div class="flex items-center gap-2 mb-6">
      <NuxtLink to="/mypage" class="text-muted-foreground hover:text-foreground">
        <Icon icon="heroicons:arrow-left" class="w-5 h-5" />
      </NuxtLink>
      <h1 class="text-xl font-bold">친구 초대</h1>
    </div>

    <!-- 보상 안내 -->
    <div class="bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20 rounded-xl p-5 mb-6">
      <h2 class="font-semibold mb-3">🎁 초대 보상</h2>
      <div class="grid grid-cols-2 gap-3">
        <div class="bg-card rounded-lg p-3 text-center">
          <div class="text-2xl font-bold text-violet-500">+{{ codeInfo?.referrerReward ?? 50 }}cr</div>
          <div class="text-xs text-muted-foreground mt-1">친구 초대 성공 시</div>
        </div>
        <div class="bg-card rounded-lg p-3 text-center">
          <div class="text-2xl font-bold text-blue-500">+{{ codeInfo?.inviteeReward ?? 30 }}cr</div>
          <div class="text-xs text-muted-foreground mt-1">초대받아 가입 시</div>
        </div>
      </div>
    </div>

    <!-- 초대 링크 -->
    <div class="bg-card border border-border rounded-xl p-5 mb-6">
      <h2 class="font-semibold mb-3">내 초대 링크</h2>
      <div class="flex gap-2">
        <div class="flex-1 bg-muted rounded-lg px-3 py-2 text-sm font-mono text-muted-foreground truncate">
          {{ codeInfo ? inviteLink : '로딩 중...' }}
        </div>
        <Button @click="copyLink" :variant="copied ? 'default' : 'outline'" size="sm" class="shrink-0">
          <Icon :icon="copied ? 'heroicons:check' : 'heroicons:clipboard'" class="w-4 h-4 mr-1" />
          {{ copied ? '복사됨!' : '복사' }}
        </Button>
      </div>
      <p class="text-xs text-muted-foreground mt-2">
        초대 코드: <span class="font-mono font-medium text-foreground">{{ codeInfo?.code ?? '...' }}</span>
      </p>
    </div>

    <!-- 통계 -->
    <div class="bg-card border border-border rounded-xl p-5">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-semibold">초대 현황</h2>
        <div class="text-sm text-muted-foreground">
          총 <span class="font-medium text-foreground">{{ stats?.totalInvited ?? 0 }}명</span> 초대 /
          <span class="font-medium text-violet-500">+{{ stats?.totalEarned ?? 0 }}cr</span> 획득
        </div>
      </div>

      <div v-if="stats?.recentInvitees?.length" class="space-y-2">
        <div
          v-for="u in stats.recentInvitees" :key="u.id"
          class="flex items-center gap-3 text-sm"
        >
          <Avatar class="h-7 w-7">
            <AvatarImage :src="u.avatarUrl ?? ''" />
            <AvatarFallback class="text-xs">{{ (u.nickname || u.name).slice(0, 1) }}</AvatarFallback>
          </Avatar>
          <span>{{ u.nickname || u.name }}</span>
          <span class="ml-auto text-xs text-muted-foreground">{{ formatDate(u.createdAt) }} 가입</span>
        </div>
      </div>
      <div v-else class="text-center py-6 text-muted-foreground text-sm">
        아직 초대한 친구가 없어요. 링크를 공유해보세요!
      </div>
    </div>
  </div>
</template>
