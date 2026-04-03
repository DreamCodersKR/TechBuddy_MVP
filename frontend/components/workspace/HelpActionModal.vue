<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'

interface Task {
  id: string
  title: string
  description: string | null
  taskType?: string | null
}

const props = defineProps<{ task: Task }>()
const emit = defineEmits<{ close: [] }>()

function goAiMentor() {
  const params = new URLSearchParams()
  params.set('taskId', props.task.id)
  params.set('title', props.task.title)
  if (props.task.description) params.set('description', props.task.description)
  if (props.task.taskType) params.set('taskType', props.task.taskType)
  navigateTo(`/ai-mentor/new?${params}`)
  emit('close')
}

function goAgora() {
  const params = new URLSearchParams()
  params.set('title', `[도움요청] ${props.task.title}`)
  if (props.task.description) params.set('content', props.task.description)
  navigateTo(`/agora/write?${params}`)
  emit('close')
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
    <div class="bg-background border border-border rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
      <!-- 헤더 -->
      <div class="flex items-start gap-3 mb-5">
        <div class="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <Icon icon="heroicons:hand-raised" class="w-5 h-5 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h2 class="text-base font-semibold text-foreground">
            도움이 필요한 태스크가 있어요
          </h2>
          <p class="text-sm text-muted-foreground mt-0.5 line-clamp-2">
            {{ task.title }}
          </p>
        </div>
      </div>

      <!-- 선택지 -->
      <div class="space-y-3 mb-5">
        <!-- AI 멘토 -->
        <button
          class="w-full flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors text-left group"
          @click="goAiMentor"
        >
          <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
            <Icon icon="heroicons:sparkles" class="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <p class="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
              AI 멘토에게 질문
            </p>
            <p class="text-xs text-muted-foreground mt-0.5">
              코드, 설계, 문서 등 다양한 AI 모델이 도와드려요
            </p>
          </div>
          <Icon icon="heroicons:arrow-right" class="w-4 h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        <!-- 아고라 -->
        <button
          class="w-full flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors text-left group"
          @click="goAgora"
        >
          <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Icon icon="heroicons:chat-bubble-left-right" class="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p class="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
              아고라에 질문 등록
            </p>
            <p class="text-xs text-muted-foreground mt-0.5">
              커뮤니티에 질문을 올리고 답변을 받아보세요
            </p>
          </div>
          <Icon icon="heroicons:arrow-right" class="w-4 h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>

      <!-- 나중에 -->
      <Button variant="ghost" class="w-full" @click="emit('close')">
        나중에 하기
      </Button>
    </div>
  </div>
</template>
