<script setup lang="ts">
import { Icon } from '@iconify/vue'

const props = defineProps<{
  targetType: 'POST' | 'COMMENT' | 'USER'
  targetId: string
}>()

const emit = defineEmits<{ close: [] }>()

const { post: authPost } = useAuthFetch()

const reason = ref('SPAM')
const detail = ref('')
const loading = ref(false)
const done = ref(false)

async function submit() {
  loading.value = true
  try {
    await authPost('/reports', {
      targetType: props.targetType,
      targetId: props.targetId,
      reason: reason.value,
      detail: detail.value || undefined,
    })
    done.value = true
    setTimeout(() => emit('close'), 1200)
  } catch {
    // 중복 신고 등 에러 무시
    emit('close')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" @click.self="emit('close')">
    <div class="bg-background border border-border rounded-xl p-5 w-full max-w-sm">
      <div v-if="done" class="text-center py-4">
        <Icon icon="heroicons:check-circle" class="w-10 h-10 text-emerald-500 mx-auto mb-2" />
        <p class="text-sm text-foreground">신고가 접수되었습니다.</p>
      </div>
      <template v-else>
        <div class="flex items-center justify-between mb-4">
          <p class="text-sm font-semibold text-foreground">신고하기</p>
          <button class="text-muted-foreground hover:text-foreground" @click="emit('close')">
            <Icon icon="heroicons:x-mark" class="w-4 h-4" />
          </button>
        </div>
        <div class="space-y-3">
          <div>
            <label class="text-xs font-medium text-foreground block mb-1">신고 사유</label>
            <select
              v-model="reason"
              class="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="SPAM">스팸</option>
              <option value="HARASSMENT">괴롭힘</option>
              <option value="INAPPROPRIATE">부적절한 콘텐츠</option>
              <option value="MISINFORMATION">허위 정보</option>
              <option value="COPYRIGHT">저작권 침해</option>
              <option value="OTHER">기타</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-foreground block mb-1">상세 사유 (선택)</label>
            <textarea
              v-model="detail"
              rows="3"
              placeholder="추가 설명을 입력해 주세요."
              class="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
        <div class="flex gap-2 justify-end mt-4">
          <button class="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-accent" @click="emit('close')">취소</button>
          <button
            :disabled="loading"
            class="px-3 py-1.5 text-xs bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 disabled:opacity-50"
            @click="submit"
          >신고 제출</button>
        </div>
      </template>
    </div>
  </div>
</template>
