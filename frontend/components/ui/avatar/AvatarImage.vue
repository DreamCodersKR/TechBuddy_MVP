<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  src?: string
  alt?: string
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})
</script>

<template>
  <img
    v-if="src"
    :class="cn('absolute inset-0 w-full h-full object-cover object-center', props.class)"
    :src="src"
    :alt="alt"
    v-bind="delegatedProps"
  >
</template>
