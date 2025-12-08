<script setup lang="ts">
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
    <div class="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600">
      <UIcon name="i-heroicons-document-text" class="w-full h-full" />
    </div>
    <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
      {{ title }}
    </h3>
    <p class="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
      {{ description }}
    </p>
    <UButton
      v-if="showWriteButton"
      :to="boardSlug ? `/board/${boardSlug}/write` : '/post/write'"
      color="primary"
      size="md"
    >
      <UIcon name="i-heroicons-pencil" class="w-4 h-4 mr-1" />
      글쓰기
    </UButton>
  </div>
</template>
