<script setup lang="ts">
import type { PostListItem } from '~/types/post'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@iconify/vue'

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

function getInitials(name: string): string {
  return name.charAt(0).toUpperCase()
}
</script>

<template>
  <NuxtLink :to="`/post/${post.id}`" class="block">
    <Card class="hover:bg-accent/50 transition-colors cursor-pointer">
      <CardContent class="p-4 sm:p-5">
        <div class="flex flex-col gap-3">
          <!-- Header: Author & Date -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Avatar size="sm">
                <AvatarImage
                  v-if="post.author.avatarUrl"
                  :src="post.author.avatarUrl"
                  :alt="post.author.nickname || post.author.name"
                />
                <AvatarFallback>
                  {{ getInitials(post.author.nickname || post.author.name) }}
                </AvatarFallback>
              </Avatar>
              <span class="text-sm text-muted-foreground">
                {{ post.author.nickname || post.author.name }}
              </span>
            </div>
            <span class="text-xs text-muted-foreground">
              {{ formatDate(post.createdAt) }}
            </span>
          </div>

          <!-- Title -->
          <h3 class="text-lg font-semibold text-foreground line-clamp-2">
            {{ post.title }}
          </h3>

          <!-- Content Preview -->
          <p class="text-sm text-muted-foreground line-clamp-2">
            {{ truncateContent(post.content) }}
          </p>

          <!-- Tags -->
          <div v-if="post.tags && post.tags.length > 0" class="flex flex-wrap gap-1.5">
            <Badge
              v-for="tag in post.tags.slice(0, 3)"
              :key="tag.id"
              variant="secondary"
              class="text-xs"
            >
              {{ tag.name }}
            </Badge>
            <Badge
              v-if="post.tags.length > 3"
              variant="secondary"
              class="text-xs"
            >
              +{{ post.tags.length - 3 }}
            </Badge>
          </div>

          <!-- Footer: Stats -->
          <div class="flex items-center gap-4 text-xs text-muted-foreground">
            <div class="flex items-center gap-1">
              <Icon icon="heroicons:eye" class="w-4 h-4" />
              <span>{{ post.viewCount }}</span>
            </div>
            <div class="flex items-center gap-1">
              <Icon icon="heroicons:chat-bubble-left" class="w-4 h-4" />
              <span>{{ post._count.comments }}</span>
            </div>
            <div class="flex items-center gap-1">
              <Icon icon="heroicons:heart" class="w-4 h-4" />
              <span>{{ post._count.likes }}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </NuxtLink>
</template>
