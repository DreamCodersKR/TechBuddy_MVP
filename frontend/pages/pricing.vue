<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'

definePageMeta({ layout: 'default' })
useHead({ title: '프라이싱 - FLOWIT' })

const plans = [
  {
    name: 'FREE',
    label: '무료',
    price: '₩0',
    period: '/ 월',
    description: '커뮤니티와 기본 기능을 무료로 사용하세요',
    features: [
      '커뮤니티 무제한 이용',
      'AI 멘토링 월 5회',
      '아고라 질문 월 3회 (크레딧 필요)',
      '팀원 모집 월 1회',
      '기본 PM 툴 (1개 워크스페이스)',
    ],
    cta: '현재 플랜',
    highlight: false,
  },
  {
    name: 'PRO',
    label: 'Pro',
    price: '₩9,900',
    period: '/ 월',
    description: '더 많은 AI 기능과 협업 도구를 활용하세요',
    features: [
      'FREE 모든 기능 포함',
      'AI 멘토링 월 50회',
      '아고라 질문 무제한 (크레딧 필요)',
      '팀원 모집 무제한',
      'PM 툴 무제한 (5개 워크스페이스)',
      '월 크레딧 500 지급',
    ],
    cta: '준비 중',
    highlight: true,
  },
  {
    name: 'PREMIUM',
    label: 'Premium',
    price: '₩29,900',
    period: '/ 월',
    description: '팀 단위 협업과 고급 AI 기능이 필요한 분께',
    features: [
      'PRO 모든 기능 포함',
      'AI 멘토링 무제한',
      'PM 툴 무제한 (무제한 워크스페이스)',
      '월 크레딧 2,000 지급',
      '우선 고객 지원',
      '팀 관리 기능',
    ],
    cta: '준비 중',
    highlight: false,
  },
]
</script>

<template>
  <div class="max-w-4xl mx-auto py-12 px-4">
    <div class="text-center mb-12">
      <h1 class="text-3xl font-bold text-foreground mb-3">플랜 및 요금제</h1>
      <p class="text-muted-foreground">당신의 성장 단계에 맞는 플랜을 선택하세요</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div
        v-for="plan in plans"
        :key="plan.name"
        class="bg-card border rounded-2xl p-6 flex flex-col"
        :class="plan.highlight ? 'border-primary shadow-lg relative' : 'border-border'"
      >
        <div v-if="plan.highlight" class="absolute -top-3 left-1/2 -translate-x-1/2">
          <span class="px-3 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-full">
            추천
          </span>
        </div>
        <div class="mb-4">
          <p class="text-sm font-medium text-muted-foreground">{{ plan.label }}</p>
          <div class="flex items-baseline gap-1 mt-1">
            <span class="text-3xl font-bold text-foreground">{{ plan.price }}</span>
            <span class="text-sm text-muted-foreground">{{ plan.period }}</span>
          </div>
          <p class="text-sm text-muted-foreground mt-2">{{ plan.description }}</p>
        </div>

        <ul class="space-y-2 flex-1 mb-6">
          <li v-for="feature in plan.features" :key="feature" class="flex items-start gap-2 text-sm">
            <Icon icon="heroicons:check-circle" class="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
            <span class="text-foreground">{{ feature }}</span>
          </li>
        </ul>

        <Button
          :variant="plan.highlight ? 'default' : 'outline'"
          class="w-full"
          :disabled="plan.name !== 'FREE'"
          @click="plan.name !== 'FREE' && alert('준비 중인 기능입니다.')"
        >
          {{ plan.cta }}
        </Button>
      </div>
    </div>

    <p class="text-center text-xs text-muted-foreground mt-8">
      모든 요금제는 부가세 포함 가격입니다. 구독은 언제든지 취소할 수 있습니다.
    </p>
  </div>
</template>
