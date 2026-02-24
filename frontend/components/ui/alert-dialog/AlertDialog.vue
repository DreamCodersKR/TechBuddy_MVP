<script setup lang="ts">
import { AlertDialogRoot } from 'reka-ui'

// AlertDialog는 Trigger/Action/Cancel이 열림/닫힘을 자동으로 제어
// 외부에서 open 제어가 필요하면 v-model:open 사용
const props = defineProps<{
  open?: boolean
  defaultOpen?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()
</script>

<template>
  <AlertDialogRoot
    :open="props.open"
    :default-open="props.defaultOpen"
    @update:open="emit('update:open', $event)"
  >
    <slot />
  </AlertDialogRoot>
</template>
