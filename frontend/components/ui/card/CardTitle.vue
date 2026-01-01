<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  class?: HTMLAttributes['class']
  as?: string
}

const props = withDefaults(defineProps<Props>(), {
  as: 'h3',
})

const delegatedProps = computed(() => {
  const { class: _, as: __, ...delegated } = props
  return delegated
})
</script>

<template>
  <component
    :is="as"
    :class="cn('text-2xl font-semibold leading-none tracking-tight', props.class)"
    v-bind="delegatedProps"
  >
    <slot />
  </component>
</template>
