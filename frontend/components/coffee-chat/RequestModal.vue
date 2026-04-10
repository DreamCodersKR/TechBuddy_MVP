<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const props = defineProps<{
  receiverId: string
  receiverNickname: string
  open: boolean
}>()

const emit = defineEmits<{
  close: []
  success: []
}>()

const { requestChat } = useCoffeeChat()

const message = ref('')
const loading = ref(false)
const error = ref('')

const charCount = computed(() => message.value.length)

async function handleSubmit() {
  if (!message.value.trim()) {
    error.value = '메시지를 입력해주세요.'
    return
  }

  loading.value = true
  error.value = ''

  try {
    await requestChat(props.receiverId, message.value.trim())
    message.value = ''
    emit('success')
    emit('close')
  }
  catch (e: any) {
    error.value = e?.data?.message || '커피챗 요청에 실패했습니다.'
  }
  finally {
    loading.value = false
  }
}

function handleOpenChange(open: boolean) {
  if (!open) {
    emit('close')
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ receiverNickname }}님에게 커피챗 요청</DialogTitle>
        <DialogDescription>
          간단한 자기소개와 이야기하고 싶은 주제를 적어주세요.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <div>
          <textarea
            v-model="message"
            rows="5"
            maxlength="500"
            placeholder="간단한 자기소개와 이야기하고 싶은 주제를 적어주세요"
            class="w-full text-sm px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          <div class="flex items-center justify-between mt-1">
            <p v-if="error" class="text-xs text-destructive">{{ error }}</p>
            <span v-else />
            <span class="text-xs text-muted-foreground">{{ charCount }}/500</span>
          </div>
        </div>

        <div class="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50 border border-border">
          <Icon icon="heroicons:information-circle" class="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <p class="text-xs text-muted-foreground">
            10 크레딧이 차감됩니다. 거절 시 환불됩니다.
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" :disabled="loading" @click="emit('close')">
          취소
        </Button>
        <Button :disabled="loading || !message.trim()" @click="handleSubmit">
          <Icon v-if="loading" icon="heroicons:arrow-path" class="w-4 h-4 mr-2 animate-spin" />
          요청 보내기
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
