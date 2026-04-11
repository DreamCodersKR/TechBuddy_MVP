<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { toast } from 'vue-sonner'

// ─── Props ───────────────────────────────────────────────
const props = defineProps<{
  nickname: string
  anchorEl?: HTMLElement | null
}>()

const emit = defineEmits<{
  close: []
}>()

// ─── 상태 ────────────────────────────────────────────────
const config = useRuntimeConfig()
const authStore = useAuthStore()

interface MiniProfile {
  id: string
  nickname: string
  name: string
  avatarUrl: string | null
  level: number
  techStack: string[]
  bio: string | null
  portfolioPublic: boolean
}

const profile = ref<MiniProfile | null>(null)
const loading = ref(true)
const error = ref(false)

// ─── 내 프로필 여부 ────────────────────────────────────
const isMe = computed(
  () => authStore.currentUser?.nickname === props.nickname,
)

// ─── 팝업 위치 ────────────────────────────────────────
const popupRef = ref<HTMLElement | null>(null)
const position = ref({ top: '0px', left: '0px' })

function calcPosition() {
  if (!props.anchorEl || !popupRef.value) return
  const rect = props.anchorEl.getBoundingClientRect()
  const popupW = popupRef.value.offsetWidth || 280
  const popupH = popupRef.value.offsetHeight || 200
  const winW = window.innerWidth
  const winH = window.innerHeight

  let top = rect.bottom + window.scrollY + 6
  let left = rect.left + window.scrollX

  // 오른쪽 넘침 방지
  if (left + popupW > winW - 8) {
    left = winW - popupW - 8
  }
  // 하단 넘침 방지
  if (rect.bottom + popupH + 6 > winH) {
    top = rect.top + window.scrollY - popupH - 6
  }

  position.value = { top: `${top}px`, left: `${left}px` }
}

// ─── 데이터 패칭 ─────────────────────────────────────
async function fetchProfile() {
  loading.value = true
  error.value = false
  try {
    profile.value = await $fetch<MiniProfile>(
      `${config.public.apiBaseUrl}/users/by-nickname/${encodeURIComponent(props.nickname)}/mini`,
    )
  }
  catch {
    error.value = true
  }
  finally {
    loading.value = false
    await nextTick()
    calcPosition()
  }
}

// ─── 외부 클릭 닫기 ──────────────────────────────────
function onOutsideClick(e: MouseEvent) {
  if (popupRef.value && !popupRef.value.contains(e.target as Node)) {
    emit('close')
  }
}

onMounted(async () => {
  await fetchProfile()
  document.addEventListener('mousedown', onOutsideClick)
  window.addEventListener('scroll', () => emit('close'), { once: true })
})

onUnmounted(() => {
  document.removeEventListener('mousedown', onOutsideClick)
})

// ─── 액션 ────────────────────────────────────────────
const router = useRouter()

function goPortfolio() {
  emit('close')
  router.push(`/portfolio/${props.nickname}`)
}

function goPosts() {
  emit('close')
  router.push(`/community?author=${props.nickname}`)
}

function report() {
  emit('close')
  // 신고 모달은 추후 구현
  toast.info(`${props.nickname} 사용자를 신고했습니다.`)
}

// ─── 레벨 색상 ───────────────────────────────────────
function levelColor(level: number) {
  if (level >= 5) return 'text-amber-500'
  if (level >= 3) return 'text-blue-500'
  return 'text-green-600'
}
</script>

<template>
  <Teleport to="body">
    <div
      ref="popupRef"
      class="fixed z-[9999] w-72 bg-popover border border-border rounded-xl shadow-xl overflow-hidden"
      :style="{ top: position.top, left: position.left }"
    >
      <!-- 로딩 -->
      <div v-if="loading" class="p-4 flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-muted animate-pulse shrink-0" />
        <div class="flex-1 space-y-2">
          <div class="h-3 bg-muted rounded animate-pulse w-24" />
          <div class="h-3 bg-muted rounded animate-pulse w-16" />
        </div>
      </div>

      <!-- 에러 -->
      <div v-else-if="error" class="p-4 text-sm text-muted-foreground text-center">
        프로필을 불러올 수 없습니다.
      </div>

      <!-- 프로필 -->
      <template v-else-if="profile">
        <!-- 상단: 아바타 + 기본 정보 -->
        <div class="px-4 pt-4 pb-3 flex items-start gap-3">
          <img
            v-if="profile.avatarUrl"
            :src="profile.avatarUrl"
            :alt="profile.nickname ?? profile.name"
            class="w-11 h-11 rounded-full object-cover border border-border shrink-0"
          >
          <div
            v-else
            class="w-11 h-11 rounded-full bg-muted flex items-center justify-center shrink-0 text-muted-foreground text-lg font-bold border border-border"
          >
            {{ (profile.nickname ?? profile.name).charAt(0).toUpperCase() }}
          </div>

          <div class="flex-1 min-w-0">
            <p class="font-semibold text-sm truncate">
              {{ profile.nickname ?? profile.name }}
            </p>
            <p class="text-xs text-muted-foreground">
              {{ profile.name }}
            </p>
            <span class="inline-flex items-center gap-0.5 text-xs font-medium mt-0.5" :class="levelColor(profile.level)">
              <Icon icon="heroicons:bolt" class="w-3.5 h-3.5" />
              Lv.{{ profile.level }}
            </span>
          </div>
        </div>

        <!-- bio -->
        <div v-if="profile.bio" class="px-4 pb-2">
          <p class="text-xs text-muted-foreground line-clamp-2">
            {{ profile.bio }}
          </p>
        </div>

        <!-- techStack -->
        <div v-if="profile.techStack?.length" class="px-4 pb-3 flex flex-wrap gap-1">
          <span
            v-for="tech in profile.techStack.slice(0, 5)"
            :key="tech"
            class="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
          >
            {{ tech }}
          </span>
          <span
            v-if="profile.techStack.length > 5"
            class="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
          >
            +{{ profile.techStack.length - 5 }}
          </span>
        </div>

        <!-- 구분선 -->
        <div class="border-t border-border" />

        <!-- 액션 버튼 -->
        <div class="flex flex-col">
          <!-- 포트폴리오 보기 -->
          <button
            class="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted/60 transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed"
            :disabled="!profile.portfolioPublic"
            @click="goPortfolio"
          >
            <Icon icon="heroicons:briefcase" class="w-4 h-4 text-muted-foreground" />
            <span>포트폴리오 보기</span>
            <span
              v-if="!profile.portfolioPublic"
              class="ml-auto text-[10px] text-muted-foreground"
            >비공개</span>
          </button>

          <!-- 작성 글 보기 -->
          <button
            class="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted/60 transition-colors text-left"
            @click="goPosts"
          >
            <Icon icon="heroicons:document-text" class="w-4 h-4 text-muted-foreground" />
            <span>작성 글 보기</span>
          </button>

          <!-- 신고하기 (내 프로필이 아닐 때만) -->
          <button
            v-if="!isMe"
            class="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 transition-colors text-left"
            @click="report"
          >
            <Icon icon="heroicons:flag" class="w-4 h-4" />
            <span>신고하기</span>
          </button>
        </div>
      </template>
    </div>
  </Teleport>
</template>
