<template>
  <div class="min-h-screen flex items-center justify-center bg-background">
    <div class="max-w-2xl mx-auto px-4 text-center">
      <h1 class="text-4xl font-bold text-foreground mb-4">
        TechBuddy
      </h1>
      <p class="text-xl text-muted-foreground mb-8">
        IT 부트캠프 학생과 취준생을 위한 커뮤니티 플랫폼
      </p>
      <div class="flex gap-4 justify-center">
        <button class="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
          시작하기
        </button>
        <button class="px-6 py-3 border border-border rounded-md hover:bg-accent transition-colors">
          자세히 보기
        </button>
      </div>
      <div class="mt-12 p-6 bg-card border border-border rounded-lg">
        <h2 class="text-xl font-semibold mb-4">프로젝트 셋업 완료!</h2>
        <ul class="text-left space-y-2 text-muted-foreground">
          <li>✅ Nuxt 3 + TypeScript</li>
          <li>✅ Tailwind CSS</li>
          <li>✅ Pinia (상태관리)</li>
          <li>✅ shadcn-vue 준비</li>
        </ul>
      </div>

      <!-- Pinia Store 테스트 -->
      <div class="mt-8 p-6 bg-card border border-border rounded-lg">
        <h2 class="text-xl font-semibold mb-4">Pinia Store 테스트</h2>
        <div class="flex items-center justify-center gap-4 mb-4">
          <button
            @click="counterStore.decrement()"
            class="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors"
          >
            -
          </button>
          <div class="text-3xl font-bold">{{ counterStore.count }}</div>
          <button
            @click="counterStore.increment()"
            class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            +
          </button>
        </div>
        <p class="text-sm text-muted-foreground">
          Double Count: {{ counterStore.doubleCount }}
        </p>
        <button
          @click="counterStore.reset()"
          class="mt-4 px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCounterStore } from '~/stores/counter';

// Pinia store 사용
const counterStore = useCounterStore();

// 페이지 메타데이터
useHead({
  title: 'TechBuddy - IT 부트캠프 학생 커뮤니티',
  meta: [
    {
      name: 'description',
      content: 'IT 부트캠프 학생과 취준생을 위한 커뮤니티 기반 성장 플랫폼',
    },
  ],
});
</script>
