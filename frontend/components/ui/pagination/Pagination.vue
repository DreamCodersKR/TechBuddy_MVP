<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface Props {
  modelValue: number
  total: number
  perPage?: number
  siblingCount?: number
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  perPage: 10,
  siblingCount: 1,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

const totalPages = computed(() => Math.ceil(props.total / props.perPage))

const pages = computed(() => {
  const current = props.modelValue
  const total = totalPages.value
  const sibling = props.siblingCount

  const range = (start: number, end: number) => {
    const length = end - start + 1
    return Array.from({ length }, (_, i) => start + i)
  }

  const startPages = range(1, Math.min(1, total))
  const endPages = range(Math.max(total, 1), total)

  const leftSiblingIndex = Math.max(current - sibling, 1)
  const rightSiblingIndex = Math.min(current + sibling, total)

  const shouldShowLeftDots = leftSiblingIndex > 2
  const shouldShowRightDots = rightSiblingIndex < total - 1

  if (!shouldShowLeftDots && shouldShowRightDots) {
    const leftItemCount = 3 + 2 * sibling
    const leftRange = range(1, Math.min(leftItemCount, total))
    return [...leftRange, '...', total]
  }

  if (shouldShowLeftDots && !shouldShowRightDots) {
    const rightItemCount = 3 + 2 * sibling
    const rightRange = range(Math.max(total - rightItemCount + 1, 1), total)
    return [1, '...', ...rightRange]
  }

  if (shouldShowLeftDots && shouldShowRightDots) {
    const middleRange = range(leftSiblingIndex, rightSiblingIndex)
    return [1, '...', ...middleRange, '...', total]
  }

  return range(1, total)
})

function goToPage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    emit('update:modelValue', page)
  }
}
</script>

<template>
  <nav
    :class="cn('flex items-center justify-center gap-1', props.class)"
    aria-label="pagination"
  >
    <Button
      variant="outline"
      size="icon"
      :disabled="modelValue <= 1"
      @click="goToPage(modelValue - 1)"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="m15 18-6-6 6-6" />
      </svg>
    </Button>

    <template v-for="(page, index) in pages" :key="index">
      <span v-if="page === '...'" class="px-2 text-muted-foreground">...</span>
      <Button
        v-else
        :variant="page === modelValue ? 'default' : 'outline'"
        size="icon"
        @click="goToPage(page as number)"
      >
        {{ page }}
      </Button>
    </template>

    <Button
      variant="outline"
      size="icon"
      :disabled="modelValue >= totalPages"
      @click="goToPage(modelValue + 1)"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="m9 18 6-6-6-6" />
      </svg>
    </Button>
  </nav>
</template>
