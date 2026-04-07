<script setup lang="ts">
import { Icon } from '@iconify/vue'

definePageMeta({
  layout: 'default',
})

useHead({
  title: 'FLOWIT - IT 커뮤니티 플랫폼',
  meta: [
    {
      name: 'description',
      content: 'IT 개발자를 위한 커뮤니티 플랫폼. 인사이트 공유, Q&A, 팀원 모집까지.',
    },
  ],
})

const {
  popularPosts,
  popularAgora,
  insightPosts,
  waitingAgora,
  recruitPosts,
  loading,
  fetchAll,
  getBoardName,
  agoraIsNew,
  postIsNew,
} = useHome()

await fetchAll()

const features = [
  {
    icon: 'heroicons:chat-bubble-left-right',
    title: '커뮤니티',
    desc: '인사이트 공유 · 아고라 Q&A',
    to: '/community',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    icon: 'heroicons:user-group',
    title: '팀원 모집',
    desc: '함께할 개발자 찾기',
    to: '/recruit',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: 'heroicons:squares-2x2',
    title: 'PM 툴',
    desc: '칸반보드 · 스프린트 관리',
    to: '/workspaces',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
  },
  {
    icon: 'heroicons:sparkles',
    title: 'FLOWIT AI',
    desc: 'Task 맞춤 AI 어시스턴트',
    to: '/ai-mentor',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
]

function getDdayClass(dDay: string) {
  if (dDay === '모집 마감') return 'bg-muted text-muted-foreground'
  if (dDay === '오늘 마감') return 'bg-destructive/10 text-destructive'
  return 'bg-primary/10 text-primary'
}
</script>

<template>
  <!-- ─── 히어로 배너 (full-width, container 외부) ─────────────────── -->
  <section class="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
    <!-- 배경 글로우 -->
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      <div class="absolute bottom-0 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
    </div>

    <div class="container relative py-16 md:py-20">
      <!-- 배지 -->
      <div class="flex justify-center mb-5">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-medium">
          <Icon icon="heroicons:bolt" class="w-3.5 h-3.5" />
          IT 부트캠프 수료생을 위한 올인원 플랫폼
        </span>
      </div>

      <!-- 타이틀 -->
      <h1 class="text-center text-3xl md:text-5xl font-bold text-white leading-tight mb-4">
        배우고, 연결하고,<br class="hidden md:block" />
        <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">함께 성장하세요</span>
      </h1>

      <!-- 서브타이틀 -->
      <p class="text-center text-slate-400 text-sm md:text-base max-w-lg mx-auto mb-8 leading-relaxed">
        커뮤니티 · 팀원모집 · 프로젝트 관리 · AI 멘토링까지<br />
        부트캠프 수료 후 성장에 필요한 모든 것을 한 곳에서
      </p>

      <!-- CTA 버튼 -->
      <div class="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
        <NuxtLink
          to="/auth/signup"
          class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
        >
          무료로 시작하기
          <Icon icon="heroicons:arrow-right" class="w-4 h-4" />
        </NuxtLink>
        <NuxtLink
          to="/community"
          class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg border border-slate-600 text-slate-300 font-semibold text-sm hover:bg-slate-800 transition-colors"
        >
          커뮤니티 둘러보기
        </NuxtLink>
      </div>

      <!-- 기능 카드 4개 -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <NuxtLink
          v-for="feature in features"
          :key="feature.title"
          :to="feature.to"
          class="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-700/60 bg-slate-800/40 hover:bg-slate-800/80 hover:border-slate-600 transition-all text-center group"
        >
          <div :class="['w-10 h-10 rounded-lg flex items-center justify-center', feature.bg]">
            <Icon :icon="feature.icon" :class="['w-5 h-5', feature.color]" />
          </div>
          <div>
            <p class="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">{{ feature.title }}</p>
            <p class="text-xs text-slate-500 mt-0.5">{{ feature.desc }}</p>
          </div>
        </NuxtLink>
      </div>
    </div>
  </section>

  <!-- ─── 본문 컨텐츠 ──────────────────────────────────────────────── -->
  <div class="container py-8 space-y-12">

    <!-- 실시간 인기글 -->
    <section>
      <h2 class="text-lg font-bold text-foreground mb-4">실시간 인기글</h2>
      <div class="border border-border rounded-lg bg-card">
        <template v-if="loading">
          <div v-for="n in 5" :key="n" class="flex items-center gap-4 px-4 py-3 border-b border-border last:border-0">
            <div class="w-6 h-4 bg-muted animate-pulse rounded" />
            <div class="w-16 h-4 bg-muted animate-pulse rounded" />
            <div class="flex-1 h-4 bg-muted animate-pulse rounded" />
          </div>
        </template>
        <template v-else-if="popularPosts.length > 0">
          <ul class="divide-y divide-border">
            <li
              v-for="(post, index) in popularPosts"
              :key="post.id"
              class="flex items-center gap-4 px-4 py-3 hover:bg-accent/50 cursor-pointer transition-colors"
              @click="navigateTo(`/community/${post.id}`)"
            >
              <span
                class="flex-shrink-0 w-6 text-sm font-bold text-center"
                :class="index < 3 ? 'text-primary' : 'text-muted-foreground'"
              >
                {{ index + 1 }}
              </span>
              <span class="flex-shrink-0 text-sm text-muted-foreground">[{{ getBoardName(post) }}]</span>
              <span class="flex-1 text-sm text-foreground truncate">{{ post.title }}</span>
              <div class="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{{ post.author.nickname ?? post.author.name }}</span>
                <span>{{ useRelativeTime(post.createdAt) }}</span>
                <span class="flex items-center gap-1">
                  <Icon icon="heroicons:eye" class="w-4 h-4" />
                  {{ post.viewCount }}
                </span>
                <span class="flex items-center gap-1">
                  <Icon icon="heroicons:chat-bubble-left" class="w-4 h-4" />
                  {{ post._count.comments }}
                </span>
              </div>
            </li>
          </ul>
        </template>
        <div v-else class="py-8 text-center text-sm text-muted-foreground">
          아직 게시글이 없습니다.
        </div>
      </div>
    </section>

    <!-- 실시간 인기 아고라 -->
    <section>
      <h2 class="text-lg font-bold text-foreground mb-4">실시간 인기 아고라</h2>
      <div class="border border-border rounded-lg bg-card">
        <template v-if="loading">
          <div v-for="n in 5" :key="n" class="flex items-center gap-4 px-4 py-3 border-b border-border last:border-0">
            <div class="w-6 h-4 bg-muted animate-pulse rounded" />
            <div class="flex-1 h-4 bg-muted animate-pulse rounded" />
          </div>
        </template>
        <template v-else-if="popularAgora.length > 0">
          <ul class="divide-y divide-border">
            <li
              v-for="(item, index) in popularAgora"
              :key="item.id"
              class="flex items-center gap-4 px-4 py-3 hover:bg-accent/50 cursor-pointer transition-colors"
              @click="navigateTo(`/agora/${item.id}`)"
            >
              <span
                class="flex-shrink-0 w-6 text-sm font-bold text-center"
                :class="index < 3 ? 'text-primary' : 'text-muted-foreground'"
              >
                {{ index + 1 }}
              </span>
              <span class="flex-shrink-0 text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">
                {{ item.bounty }}C
              </span>
              <span class="flex-1 text-sm text-foreground truncate">{{ item.title }}</span>
              <div class="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{{ item.author.nickname ?? item.author.name }}</span>
                <span>{{ useRelativeTime(item.createdAt) }}</span>
                <span class="flex items-center gap-1">
                  <Icon icon="heroicons:eye" class="w-4 h-4" />
                  {{ item.viewCount }}
                </span>
                <span class="flex items-center gap-1">
                  <Icon icon="heroicons:chat-bubble-left" class="w-4 h-4" />
                  {{ item._count.answers }}
                </span>
              </div>
            </li>
          </ul>
        </template>
        <div v-else class="py-8 text-center text-sm text-muted-foreground">
          아직 아고라 질문이 없습니다.
        </div>
      </div>
    </section>

    <!-- 새로운 인사이트를 얻어가세요 -->
    <section>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-bold text-foreground">새로운 인사이트를 얻어가세요</h2>
        <NuxtLink to="/community" class="text-sm text-muted-foreground hover:text-foreground">
          더보기 >
        </NuxtLink>
      </div>
      <div class="border border-border rounded-lg bg-card">
        <template v-if="loading">
          <div v-for="n in 5" :key="n" class="flex items-center gap-4 px-4 py-3 border-b border-border last:border-0">
            <div class="w-16 h-4 bg-muted animate-pulse rounded" />
            <div class="flex-1 h-4 bg-muted animate-pulse rounded" />
          </div>
        </template>
        <template v-else-if="insightPosts.length > 0">
          <ul class="divide-y divide-border">
            <li
              v-for="post in insightPosts"
              :key="post.id"
              class="flex items-center gap-4 px-4 py-3 hover:bg-accent/50 cursor-pointer transition-colors"
              @click="navigateTo(`/community/${post.id}`)"
            >
              <span class="flex-shrink-0 text-sm text-muted-foreground">[{{ getBoardName(post) }}]</span>
              <span class="flex-1 text-sm text-foreground truncate">{{ post.title }}</span>
              <span v-if="postIsNew(post)" class="flex-shrink-0 text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">N</span>
              <div class="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{{ post.author.nickname ?? post.author.name }}</span>
                <span>{{ useRelativeTime(post.createdAt) }}</span>
                <span class="flex items-center gap-1">
                  <Icon icon="heroicons:eye" class="w-4 h-4" />
                  {{ post.viewCount }}
                </span>
                <span class="flex items-center gap-1">
                  <Icon icon="heroicons:chat-bubble-left" class="w-4 h-4" />
                  {{ post._count.comments }}
                </span>
              </div>
            </li>
          </ul>
        </template>
        <div v-else class="py-8 text-center text-sm text-muted-foreground">
          아직 게시글이 없습니다.
        </div>
      </div>
    </section>

    <!-- 현재 답변을 기다리고 있어요 -->
    <section>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-bold text-foreground">현재 답변을 기다리고 있어요</h2>
        <NuxtLink to="/agora" class="text-sm text-muted-foreground hover:text-foreground">
          더보기 >
        </NuxtLink>
      </div>
      <div class="border border-border rounded-lg bg-card">
        <template v-if="loading">
          <div v-for="n in 5" :key="n" class="flex items-center gap-4 px-4 py-3 border-b border-border last:border-0">
            <div class="w-16 h-4 bg-muted animate-pulse rounded" />
            <div class="flex-1 h-4 bg-muted animate-pulse rounded" />
          </div>
        </template>
        <template v-else-if="waitingAgora.length > 0">
          <ul class="divide-y divide-border">
            <li
              v-for="item in waitingAgora"
              :key="item.id"
              class="flex items-center gap-4 px-4 py-3 hover:bg-accent/50 cursor-pointer transition-colors"
              @click="navigateTo(`/agora/${item.id}`)"
            >
              <span class="flex-shrink-0 text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">
                {{ item.bounty }}C
              </span>
              <span class="flex-1 text-sm text-foreground truncate">{{ item.title }}</span>
              <span v-if="agoraIsNew(item)" class="flex-shrink-0 text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">N</span>
              <div class="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{{ item.author.nickname ?? item.author.name }}</span>
                <span>{{ useRelativeTime(item.createdAt) }}</span>
                <span class="flex items-center gap-1">
                  <Icon icon="heroicons:eye" class="w-4 h-4" />
                  {{ item.viewCount }}
                </span>
                <span class="flex items-center gap-1">
                  <Icon icon="heroicons:chat-bubble-left" class="w-4 h-4" />
                  {{ item._count.answers }}
                </span>
              </div>
            </li>
          </ul>
        </template>
        <div v-else class="py-8 text-center text-sm text-muted-foreground">
          아직 답변 대기 중인 질문이 없습니다.
        </div>
      </div>
    </section>

    <!-- PM 툴 소개 배너 -->
    <section>
      <div class="relative overflow-hidden rounded-xl border border-violet-500/20 bg-gradient-to-r from-violet-950/60 to-slate-900/60 p-8">
        <div class="absolute right-0 top-0 w-64 h-full opacity-10 pointer-events-none">
          <Icon icon="heroicons:squares-2x2" class="w-full h-full text-violet-400" />
        </div>
        <div class="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <span class="inline-flex items-center gap-1 text-xs font-medium text-violet-400 mb-2">
              <Icon icon="heroicons:squares-2x2" class="w-3.5 h-3.5" />
              PM 툴
            </span>
            <h3 class="text-lg font-bold text-white mb-1">워크스페이스로 프로젝트를 관리하세요</h3>
            <p class="text-sm text-slate-400">칸반보드, 스프린트, 이슈 트래킹, 산출문서까지 — 팀 프로젝트의 시작부터 끝까지</p>
          </div>
          <NuxtLink
            to="/workspaces"
            class="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-violet-600 text-white font-semibold text-sm hover:bg-violet-500 transition-colors"
          >
            워크스페이스 열기
            <Icon icon="heroicons:arrow-right" class="w-4 h-4" />
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- 지금, 함께 할 개발자를 찾고 있어요 -->
    <section>
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg font-bold text-foreground">지금, 함께 할 개발자를 찾고 있어요</h2>
        <NuxtLink to="/recruit" class="text-sm text-muted-foreground hover:text-foreground">
          더보기 >
        </NuxtLink>
      </div>

      <template v-if="loading">
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div v-for="n in 4" :key="n" class="border border-border rounded-lg bg-card p-4">
            <div class="h-4 bg-muted animate-pulse rounded mb-3 w-16" />
            <div class="h-4 bg-muted animate-pulse rounded mb-2" />
            <div class="h-10 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </template>
      <template v-else-if="recruitPosts.length > 0">
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            v-for="recruit in recruitPosts"
            :key="recruit.id"
            class="border border-border rounded-lg bg-card p-4 hover:border-primary/50 transition-colors cursor-pointer"
            @click="navigateTo(`/recruit/${recruit.id}`)"
          >
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs px-2 py-1 bg-primary/10 text-primary rounded font-medium">
                {{ recruit.type === 'PROJECT' ? '프로젝트' : '스터디' }}
              </span>
            </div>
            <div class="flex items-center justify-between text-xs mb-2">
              <span class="text-muted-foreground">
                {{ recruit.deadline ? `마감일 ${new Date(recruit.deadline).toLocaleDateString('ko-KR')}` : '마감일 미정' }}
              </span>
              <span
                v-if="recruit.deadline || recruit.isClosed"
                class="px-2 py-0.5 rounded font-medium"
                :class="getDdayClass(calcDDay(recruit.deadline, recruit.isClosed))"
              >
                {{ calcDDay(recruit.deadline, recruit.isClosed) }}
              </span>
            </div>
            <p class="text-sm text-foreground line-clamp-2 mb-3 leading-relaxed">{{ recruit.title }}</p>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 text-xs text-muted-foreground">
                <span class="flex items-center gap-1">
                  <Icon icon="heroicons:users" class="w-3 h-3" />
                  {{ recruit._count.applications }}명 지원
                </span>
              </div>
              <div class="flex gap-1 flex-wrap justify-end">
                <span
                  v-for="position in recruit.positions.slice(0, 2)"
                  :key="position"
                  class="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded"
                >
                  {{ position }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </template>
      <div v-else class="py-8 text-center text-sm text-muted-foreground">
        현재 모집 중인 팀이 없습니다.
      </div>
    </section>

  </div>
</template>
