<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'

definePageMeta({ layout: 'default' })
useHead({ title: '플랜 업그레이드 - FLOWIT' })

const route = useRoute()
const authStore = useAuthStore()
const isLoggedIn = computed(() => authStore.isAuthenticated)
const currentPlan = computed(() => authStore.currentUser?.plan ?? 'FREE')

// pricing-gate에서 넘겨준 redirect 경로 (비로그인 진입 시)
const redirectAfterLogin = computed(() => route.query.redirect as string || '/workspaces')

const plans = [
  {
    name: 'FREE',
    label: '무료',
    price: '₩0',
    period: '/ 월',
    description: '커뮤니티와 기본 기능을 무료로 사용하세요',
    features: [
      { label: '커뮤니티 무제한 이용' },
      { label: 'AI 멘토링 기본 티어 (1cr/회)' },
      { label: '아고라 질문 월 3회' },
      { label: '팀원 모집 월 1회' },
      { label: 'PM 툴 (1개 워크스페이스)' },
      { label: '월 크레딧 100cr 지급' },
    ],
    highlight: false,
    color: 'text-muted-foreground',
    badge: null,
  },
  {
    name: 'PRO',
    label: 'Pro',
    price: '₩14,900',
    period: '/ 월',
    description: '더 많은 AI 기능과 협업 도구를 활용하세요',
    features: [
      { label: 'FREE 모든 기능 포함' },
      { label: 'AI 멘토링 심화 티어 해금' },
      { label: '아고라 질문 무제한' },
      { label: '팀원 모집 무제한' },
      { label: 'PM 툴 무제한 워크스페이스 (팀원 5명/워크스페이스)' },
      { label: '월 크레딧 3,000cr 지급' },
    ],
    highlight: true,
    color: 'text-primary',
    badge: '인기',
  },
  {
    name: 'PREMIUM',
    label: 'Premium',
    price: '₩24,900',
    period: '/ 월',
    description: '팀 단위 협업과 고급 AI 기능이 필요한 분께',
    features: [
      { label: 'PRO 모든 기능 포함' },
      { label: 'AI 멘토링 전문가 티어 해금 (모든 티어)' },
      { label: '워크스페이스 팀원 무제한' },
      { label: '커스텀 컬럼 PM 툴', comingSoon: true },
      { label: '월 크레딧 5,000cr 지급' },
    ],
    highlight: false,
    color: 'text-violet-500',
    badge: null,
  },
]

function handleCta(planName: string) {
  // 비로그인 상태 → 로그인 페이지로 (redirect 파라미터 유지)
  if (!isLoggedIn.value) {
    navigateTo({
      path: '/auth/login',
      query: { redirect: redirectAfterLogin.value },
    })
    return
  }
  // 현재 플랜이면 무시
  if (currentPlan.value === planName) return
  // 무료 플랜 → 이미 로그인 상태이면 해당 없음
  if (planName === 'FREE') return
  // TODO: 결제 모듈 연동 (토스페이먼츠)
  alert('결제 서비스 준비 중입니다. 곧 오픈 예정이에요!')
}
</script>

<template>
  <div class="max-w-5xl mx-auto py-12 px-4">
    <!-- 비로그인 안내 배너 -->
    <div
      v-if="!isLoggedIn"
      class="mb-8 p-4 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 flex items-center justify-between gap-4"
    >
      <div class="flex items-center gap-3">
        <Icon icon="heroicons:sparkles" class="w-5 h-5 text-violet-500 flex-shrink-0" />
        <p class="text-sm text-violet-700 dark:text-violet-300">
          FLOWIT의 모든 기능을 사용하려면 회원가입이 필요합니다. 무료로 시작하세요!
        </p>
      </div>
      <button
        class="text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline flex-shrink-0"
        @click="navigateTo({ path: '/auth/login', query: { redirect: redirectAfterLogin } })"
      >
        로그인 →
      </button>
    </div>

    <!-- 헤더 -->
    <div class="text-center mb-12">
      <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-xs font-medium mb-4">
        <Icon icon="heroicons:sparkles" class="w-3.5 h-3.5" />
        플랜 업그레이드
      </div>
      <h1 class="text-3xl font-bold text-foreground mb-3">
        당신의 성장에 맞는 플랜을 선택하세요
      </h1>
      <p class="text-muted-foreground max-w-md mx-auto">
        더 많은 AI 기능과 협업 도구로 프로젝트를 한 단계 업그레이드하세요
      </p>
    </div>

    <!-- 플랜 카드 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div
        v-for="plan in plans"
        :key="plan.name"
        class="relative bg-card border rounded-2xl p-6 flex flex-col"
        :class="[
          plan.highlight ? 'border-primary shadow-lg shadow-primary/10' : 'border-border',
          currentPlan === plan.name ? 'ring-2 ring-primary/30' : '',
        ]"
      >
        <!-- 배지 -->
        <div v-if="plan.badge" class="absolute -top-3 left-1/2 -translate-x-1/2">
          <span class="px-3 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-full">
            {{ plan.badge }}
          </span>
        </div>
        <!-- 현재 플랜 배지 -->
        <div v-if="currentPlan === plan.name" class="absolute -top-3 right-4">
          <span class="px-3 py-1 text-xs font-medium bg-muted text-muted-foreground border border-border rounded-full">
            현재 플랜
          </span>
        </div>

        <!-- 플랜 정보 -->
        <div class="mb-5">
          <p class="text-sm font-semibold" :class="plan.color">{{ plan.label }}</p>
          <div class="flex items-baseline gap-1 mt-1.5">
            <span class="text-3xl font-bold text-foreground">{{ plan.price }}</span>
            <span class="text-sm text-muted-foreground">{{ plan.period }}</span>
          </div>
          <p class="text-sm text-muted-foreground mt-2 leading-relaxed">{{ plan.description }}</p>
        </div>

        <!-- 기능 목록 -->
        <ul class="space-y-2.5 flex-1 mb-6">
          <li
            v-for="feature in plan.features"
            :key="feature.label"
            class="flex items-start gap-2.5 text-sm"
          >
            <Icon
              :icon="feature.comingSoon ? 'heroicons:clock' : 'heroicons:check-circle'"
              class="w-4 h-4 flex-shrink-0 mt-0.5"
              :class="feature.comingSoon ? 'text-muted-foreground' : 'text-green-500'"
            />
            <span :class="feature.comingSoon ? 'text-muted-foreground' : 'text-foreground'">
              {{ feature.label }}
              <span v-if="feature.comingSoon" class="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-muted">출시 예정</span>
            </span>
          </li>
        </ul>

        <!-- CTA 버튼 -->
        <Button
          :variant="plan.highlight ? 'default' : 'outline'"
          class="w-full"
          :disabled="isLoggedIn && currentPlan === plan.name"
          @click="handleCta(plan.name)"
        >
          <Icon
            v-if="!isLoggedIn || (plan.name !== 'FREE' && currentPlan !== plan.name)"
            :icon="!isLoggedIn ? 'heroicons:arrow-right' : 'heroicons:sparkles'"
            class="w-4 h-4 mr-2"
          />
          {{
            !isLoggedIn
              ? (plan.name === 'FREE' ? '무료로 시작하기' : '시작하기')
              : isLoggedIn && currentPlan === plan.name
                ? '현재 사용 중'
                : plan.name === 'FREE'
                  ? '무료로 시작'
                  : '업그레이드'
          }}
        </Button>
      </div>
    </div>

    <!-- 부가 정보 -->
    <div class="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="flex items-start gap-3 p-4 rounded-xl bg-muted/30">
        <Icon icon="heroicons:shield-check" class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
        <div>
          <p class="text-sm font-medium text-foreground">언제든 취소 가능</p>
          <p class="text-xs text-muted-foreground mt-0.5">구독은 언제든지 취소할 수 있습니다. 위약금 없음.</p>
        </div>
      </div>
      <div class="flex items-start gap-3 p-4 rounded-xl bg-muted/30">
        <Icon icon="heroicons:credit-card" class="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <p class="text-sm font-medium text-foreground">안전한 결제</p>
          <p class="text-xs text-muted-foreground mt-0.5">토스페이먼츠를 통한 안전한 결제를 지원합니다.</p>
        </div>
      </div>
      <div class="flex items-start gap-3 p-4 rounded-xl bg-muted/30">
        <Icon icon="heroicons:bolt" class="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p class="text-sm font-medium text-foreground">즉시 사용 가능</p>
          <p class="text-xs text-muted-foreground mt-0.5">결제 즉시 크레딧이 지급되고 기능이 해금됩니다.</p>
        </div>
      </div>
    </div>

    <p class="text-center text-xs text-muted-foreground mt-8">
      모든 요금제는 부가세 포함 가격입니다 · 결제 서비스 오픈 준비 중
    </p>
  </div>
</template>
