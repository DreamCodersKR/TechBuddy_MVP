<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'

const props = defineProps<{
  submitting?: boolean
}>()

const emit = defineEmits<{
  submit: [content: string]
}>()

const content = ref('')

function handleSubmit() {
  const trimmed = content.value.trim()
  if (!trimmed || props.submitting) return
  emit('submit', trimmed)
  content.value = ''
}

function handleKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    handleSubmit()
  }
}
</script>

<template>
  <div class="flex gap-3">
    <div class="flex-1">
      <textarea
        v-model="content"
        placeholder="댓글을 작성하세요. (Ctrl+Enter로 등록)"
        rows="3"
        class="w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        :disabled="submitting"
        @keydown="handleKeydown"
      />
      <div class="flex justify-end mt-2">
        <Button
          size="sm"
          :disabled="!content.trim() || submitting"
          @click="handleSubmit"
        >
          <Icon v-if="submitting" icon="heroicons:arrow-path" class="mr-1.5 w-3.5 h-3.5 animate-spin" />
          {{ submitting ? '등록 중...' : '댓글 등록' }}
        </Button>
      </div>
    </div>
  </div>
</template>
