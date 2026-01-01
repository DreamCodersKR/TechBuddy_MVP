<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})
</script>

<template>
  <span
    :class="cn('flex h-full w-full items-center justify-center bg-muted', props.class)"
    v-bind="delegatedProps"
  >
    <slot />
  </span>
</template>
