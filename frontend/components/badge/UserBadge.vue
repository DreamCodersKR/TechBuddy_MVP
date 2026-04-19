<script setup lang="ts">
import { getBadgeInfo } from '~/utils/badge'

const props = defineProps<{
  badgeType: string | null | undefined
  size?: 'sm' | 'md'
}>()

const badge = computed(() => getBadgeInfo(props.badgeType))
const imgError = ref(false)

const imgSize = computed(() => props.size === 'md' ? 20 : 16)

watch(() => props.badgeType, () => { imgError.value = false })
</script>

<template>
  <span
    v-if="badge"
    class="relative inline-flex items-center group cursor-default shrink-0"
    :title="`${badge.label} — ${badge.description}`"
  >
    <img
      v-if="!imgError"
      :src="badge.imageUrl"
      :alt="badge.label"
      :width="imgSize"
      :height="imgSize"
      class="rounded-full object-cover"
      @error="imgError = true"
    >
    <span v-else :class="size === 'md' ? 'text-base' : 'text-sm'">{{ badge.icon }}</span>
    <!-- Tooltip -->
    <span
      class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs rounded-md bg-popover border border-border text-popover-foreground shadow-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50"
    >
      {{ badge.label }} — {{ badge.description }}
    </span>
  </span>
</template>
