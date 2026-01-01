<script setup lang="ts">
import { Card, CardContent } from '@/components/ui/card'

interface Props {
  count?: number
}

withDefaults(defineProps<Props>(), {
  count: 5,
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <Card
      v-for="i in count"
      :key="i"
    >
      <CardContent class="p-4 sm:p-5">
        <div class="flex flex-col gap-3 animate-pulse">
          <!-- Header Skeleton -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 bg-muted rounded-full" />
              <div class="w-20 h-4 bg-muted rounded" />
            </div>
            <div class="w-16 h-3 bg-muted rounded" />
          </div>

          <!-- Title Skeleton -->
          <div class="w-3/4 h-6 bg-muted rounded" />

          <!-- Content Skeleton -->
          <div class="space-y-2">
            <div class="w-full h-4 bg-muted rounded" />
            <div class="w-2/3 h-4 bg-muted rounded" />
          </div>

          <!-- Tags Skeleton -->
          <div class="flex gap-2">
            <div class="w-14 h-5 bg-muted rounded-full" />
            <div class="w-16 h-5 bg-muted rounded-full" />
          </div>

          <!-- Footer Skeleton -->
          <div class="flex items-center gap-4">
            <div class="w-10 h-4 bg-muted rounded" />
            <div class="w-10 h-4 bg-muted rounded" />
            <div class="w-10 h-4 bg-muted rounded" />
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
