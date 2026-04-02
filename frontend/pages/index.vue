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

// D-day 스타일 클래스
function getDdayClass(dDay: string) {
  if (dDay === '모집 마감') return 'bg-muted text-muted-foreground'
  if (dDay === '오늘 마감') return 'bg-destructive/10 text-destructive'
  return 'bg-primary/10 text-primary'
}
</script>

<template>
  <div class="container py-8 space-y-12">
    <!-- 소개 배너 -->
    <section>
      <div class="bg-muted rounded-lg p-12 text-center">
        <p class="text-muted-foreground">소개 배너</p>
      </div>
    </section>

    <!-- 실시간 인기글 -->
    <section>
      <h2 class="text-lg font-bold text-foreground mb-4">실시간 인기글</h2>
      <div class="border border-border rounded-lg bg-card">
        <!-- 로딩 스켈레톤 -->
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

    <!-- 프로젝트 기능 소개 배너 -->
    <section>
      <div class="bg-amber-50 rounded-lg p-12 text-center">
        <p class="text-amber-800">프로젝트 기능 소개 배너</p>
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

      <!-- 모집 카드 그리드 -->
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
            <!-- 타입 배지 -->
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs px-2 py-1 bg-primary/10 text-primary rounded font-medium">
                {{ recruit.type === 'PROJECT' ? '프로젝트' : '스터디' }}
              </span>
            </div>

            <!-- 마감일 + D-day -->
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

            <!-- 제목 -->
            <p class="text-sm text-foreground line-clamp-2 mb-3 leading-relaxed">{{ recruit.title }}</p>

            <!-- 조회수/댓글 + 포지션 -->
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
