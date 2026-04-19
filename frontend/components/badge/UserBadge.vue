<script setup lang="ts">
import { getBadgeInfo } from '~/utils/badge'

const props = defineProps<{
  badgeType: string | null | undefined
  size?: 'sm' | 'md'
}>()

const badge = computed(() => getBadgeInfo(props.badgeType))
const sizeClass = computed(() => props.size === 'md' ? 'text-base' : 'text-sm')
</script>

<template>
  <span
    v-if="badge"
    class="relative inline-flex items-center group cursor-default shrink-0"
    :class="sizeClass"
    :title="`${badge.label} — ${badge.description}`"
  >
    {{ badge.icon }}
    <!-- Tooltip -->
    <span
      class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs rounded-md bg-popover border border-border text-popover-foreground shadow-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50"
    >
      {{ badge.label }} — {{ badge.description }}
    </span>
  </span>
</template>
