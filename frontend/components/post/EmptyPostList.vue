<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Icon } from '@iconify/vue'

interface Props {
  title?: string
  description?: string
  showWriteButton?: boolean
  boardSlug?: string
}

withDefaults(defineProps<Props>(), {
  title: '게시글이 없습니다',
  description: '첫 번째 게시글을 작성해보세요!',
  showWriteButton: true,
})
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 px-4">
    <div class="w-16 h-16 mb-4 text-muted-foreground">
      <Icon icon="heroicons:document-text" class="w-full h-full" />
    </div>
    <h3 class="text-lg font-medium text-foreground mb-2">
      {{ title }}
    </h3>
    <p class="text-sm text-muted-foreground text-center mb-6">
      {{ description }}
    </p>
    <Button
      v-if="showWriteButton"
      as="a"
      :href="boardSlug ? `/board/${boardSlug}/write` : '/post/write'"
    >
      <Icon icon="heroicons:pencil" class="w-4 h-4 mr-1" />
      글쓰기
    </Button>
  </div>
</template>
