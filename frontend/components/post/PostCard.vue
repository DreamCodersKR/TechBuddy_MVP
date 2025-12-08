<script setup lang="ts">
import type { PostListItem } from '~/types/post'

interface Props {
  post: PostListItem
}

defineProps<Props>()

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return '방금 전'
  if (diffMins < 60) return `${diffMins}분 전`
  if (diffHours < 24) return `${diffHours}시간 전`
  if (diffDays < 7) return `${diffDays}일 전`

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function truncateContent(content: string, maxLength: number = 150): string {
  if (content.length <= maxLength) return content
  return content.slice(0, maxLength) + '...'
}
</script>

<template>
  <NuxtLink :to="`/post/${post.id}`" class="block">
    <UCard
      :ui="{
        base: 'hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer',
        body: { padding: 'px-4 py-4 sm:px-5 sm:py-5' },
      }"
    >
      <div class="flex flex-col gap-3">
        <!-- Header: Author & Date -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UAvatar
              :src="post.author.avatarUrl || undefined"
              :alt="post.author.nickname || post.author.name"
              size="xs"
            />
            <span class="text-sm text-gray-600 dark:text-gray-400">
              {{ post.author.nickname || post.author.name }}
            </span>
          </div>
          <span class="text-xs text-gray-500 dark:text-gray-500">
            {{ formatDate(post.createdAt) }}
          </span>
        </div>

        <!-- Title -->
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
          {{ post.title }}
        </h3>

        <!-- Content Preview -->
        <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
          {{ truncateContent(post.content) }}
        </p>

        <!-- Tags -->
        <div v-if="post.tags && post.tags.length > 0" class="flex flex-wrap gap-1.5">
          <UBadge
            v-for="tag in post.tags.slice(0, 3)"
            :key="tag.id"
            color="gray"
            variant="subtle"
            size="xs"
          >
            {{ tag.name }}
          </UBadge>
          <UBadge
            v-if="post.tags.length > 3"
            color="gray"
            variant="subtle"
            size="xs"
          >
            +{{ post.tags.length - 3 }}
          </UBadge>
        </div>

        <!-- Footer: Stats -->
        <div class="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
          <div class="flex items-center gap-1">
            <UIcon name="i-heroicons-eye" class="w-4 h-4" />
            <span>{{ post.viewCount }}</span>
          </div>
          <div class="flex items-center gap-1">
            <UIcon name="i-heroicons-chat-bubble-left" class="w-4 h-4" />
            <span>{{ post._count.comments }}</span>
          </div>
          <div class="flex items-center gap-1">
            <UIcon name="i-heroicons-heart" class="w-4 h-4" />
            <span>{{ post._count.likes }}</span>
          </div>
        </div>
      </div>
    </UCard>
  </NuxtLink>
</template>
