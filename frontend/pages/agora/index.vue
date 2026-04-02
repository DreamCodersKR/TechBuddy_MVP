<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'

definePageMeta({
  layout: 'default',
})

useHead({
  title: '아고라 - FLOWIT',
})
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- 헤더 -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-foreground">아고라</h1>
        <p class="text-muted-foreground mt-1">크레딧을 걸고 현실적인 답변을 얻어보세요</p>
      </div>
      <Button>
        <Icon icon="heroicons:pencil" class="w-4 h-4 mr-2" />
        질문 작성
      </Button>
    </div>

    <!-- 준비중 안내 -->
    <div class="flex flex-col items-center justify-center py-24 text-center">
      <Icon icon="heroicons:clock" class="w-12 h-12 text-muted-foreground mb-4" />
      <h2 class="text-lg font-semibold text-foreground mb-2">준비 중입니다</h2>
      <p class="text-muted-foreground text-sm">아고라 기능이 곧 오픈됩니다.</p>
    </div>
  </div>
</template>
