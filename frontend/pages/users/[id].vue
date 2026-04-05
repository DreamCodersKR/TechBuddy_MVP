<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

definePageMeta({ layout: 'default' })

const route = useRoute()
const userId = route.params.id as string

interface PublicUser {
  id: string
  name: string
  nickname: string | null
  avatarUrl: string | null
  bio: string | null
  techStack: string[]
  xp: number
  level: number
  githubUrl: string | null
  portfolioUrl: string | null
  createdAt: string
}

const user = ref<PublicUser | null>(null)
const loading = ref(true)
const error = ref(false)

async function loadUser() {
  try {
    user.value = await $fetch<PublicUser>(`${useRuntimeConfig().public.apiBaseUrl}/users/${userId}`)
    useHead({ title: `${user.value.nickname || user.value.name} - FLOWIT` })
  }
  catch {
    error.value = true
    useHead({ title: '사용자를 찾을 수 없음 - FLOWIT' })
  }
  finally { loading.value = false }
}

onMounted(() => loadUser())

const userInitials = computed(() => {
  if (!user.value) return 'U'
  const name = user.value.nickname || user.value.name
  return name.slice(0, 2).toUpperCase()
})

const xpForNextLevel = computed(() => (user.value?.level ?? 1) * 100)
const xpProgress = computed(() => {
  if (!user.value) return 0
  return Math.min(100, (user.value.xp % xpForNextLevel.value) / xpForNextLevel.value * 100)
})

const BADGE_META: Record<string, { label: string; icon: string; color: string }> = {
  NEW_MEMBER: { label: '신규 회원', icon: 'heroicons:star', color: 'text-yellow-500' },
  ACTIVITY: { label: '활동가', icon: 'heroicons:fire', color: 'text-orange-500' },
  SUBSCRIBER: { label: '구독자', icon: 'heroicons:heart', color: 'text-pink-500' },
  LOYALTY: { label: '충성 회원', icon: 'heroicons:trophy', color: 'text-purple-500' },
  ORGANIZATION: { label: '조직 멤버', icon: 'heroicons:building-office', color: 'text-blue-500' },
}
</script>

<template>
  <div class="max-w-2xl mx-auto py-8 px-4">
    <!-- 로딩 -->
    <div v-if="loading" class="bg-card border border-border rounded-xl p-6">
      <div class="flex items-start gap-4">
        <div class="h-16 w-16 rounded-full bg-muted animate-pulse" />
        <div class="flex-1 space-y-2">
          <div class="h-5 bg-muted animate-pulse rounded w-1/3" />
          <div class="h-4 bg-muted animate-pulse rounded w-1/2" />
        </div>
      </div>
    </div>

    <!-- 에러 -->
    <div v-else-if="error" class="text-center py-20">
      <Icon icon="heroicons:user-x-mark" class="w-12 h-12 text-muted-foreground mx-auto mb-3" />
      <p class="text-foreground font-medium">사용자를 찾을 수 없습니다</p>
    </div>

    <!-- 프로필 -->
    <template v-else-if="user">
      <div class="bg-card border border-border rounded-xl p-6 mb-6">
        <div class="flex items-start gap-4">
          <Avatar class="h-16 w-16">
            <AvatarImage :src="user.avatarUrl ?? undefined" :alt="user.nickname ?? undefined" />
            <AvatarFallback class="text-lg">{{ userInitials }}</AvatarFallback>
          </Avatar>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1 flex-wrap">
              <h1 class="text-xl font-bold text-foreground">
                {{ user.nickname || user.name }}
              </h1>
              <span class="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
                Lv.{{ user.level }}
              </span>
            </div>
            <p v-if="user.bio" class="text-sm text-muted-foreground mt-1">{{ user.bio }}</p>
            <div v-if="user.techStack?.length" class="flex flex-wrap gap-1 mt-2">
              <span
                v-for="tech in user.techStack"
                :key="tech"
                class="px-2 py-0.5 text-xs bg-muted rounded-md"
              >{{ tech }}</span>
            </div>
            <div class="flex items-center gap-3 mt-3">
              <a
                v-if="user.githubUrl"
                :href="user.githubUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <Icon icon="mdi:github" class="w-4 h-4" />
                GitHub
              </a>
              <a
                v-if="user.portfolioUrl"
                :href="user.portfolioUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <Icon icon="heroicons:link" class="w-4 h-4" />
                포트폴리오
              </a>
            </div>
          </div>
        </div>

        <!-- XP 바 -->
        <div class="mt-4">
          <div class="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>XP {{ user.xp }}</span>
            <span>Lv.{{ user.level }}</span>
          </div>
          <div class="h-2 bg-muted rounded-full overflow-hidden">
            <div
              class="h-full bg-primary rounded-full"
              :style="{ width: `${xpProgress}%` }"
            />
          </div>
        </div>
      </div>

      <!-- 가입일 -->
      <p class="text-xs text-muted-foreground text-center">
        {{ useRelativeTime(user.createdAt) }} 가입
      </p>
    </template>
  </div>
</template>
