<script setup lang="ts">
interface Props {
  count?: number
}

withDefaults(defineProps<Props>(), {
  count: 5,
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <UCard
      v-for="i in count"
      :key="i"
      :ui="{
        body: { padding: 'px-4 py-4 sm:px-5 sm:py-5' },
      }"
    >
      <div class="flex flex-col gap-3 animate-pulse">
        <!-- Header Skeleton -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div class="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
          <div class="w-16 h-3 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>

        <!-- Title Skeleton -->
        <div class="w-3/4 h-6 bg-gray-200 dark:bg-gray-700 rounded" />

        <!-- Content Skeleton -->
        <div class="space-y-2">
          <div class="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded" />
          <div class="w-2/3 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>

        <!-- Tags Skeleton -->
        <div class="flex gap-2">
          <div class="w-14 h-5 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div class="w-16 h-5 bg-gray-200 dark:bg-gray-700 rounded-full" />
        </div>

        <!-- Footer Skeleton -->
        <div class="flex items-center gap-4">
          <div class="w-10 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
          <div class="w-10 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
          <div class="w-10 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    </UCard>
  </div>
</template>
