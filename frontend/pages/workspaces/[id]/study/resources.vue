<script setup lang="ts">
import { Icon } from '@iconify/vue'

definePageMeta({ layout: 'workspace' })

const route = useRoute()
const { get: authGet, post: authPost, delete: authDel } = useAuthFetch()
const authStore = useAuthStore()

const workspaceId = computed(() => route.params.id as string)

interface Resource {
  id: string
  title: string
  url: string | null
  fileUrl: string | null
  category: 'LINK' | 'FILE' | 'VIDEO' | 'OTHER'
  createdAt: string
  uploadedBy: { id: string; nickname: string; avatarUrl: string | null }
}

const CATEGORIES = [
  { value: '', label: '전체' },
  { value: 'LINK', label: '링크' },
  { value: 'FILE', label: '파일' },
  { value: 'VIDEO', label: '영상' },
  { value: 'OTHER', label: '기타' },
]

const CATEGORY_ICONS: Record<string, string> = {
  LINK: 'heroicons:link',
  FILE: 'heroicons:document',
  VIDEO: 'heroicons:play-circle',
  OTHER: 'heroicons:folder',
}

const resources = ref<Resource[]>([])
const loading = ref(true)
const selectedCategory = ref('')
const showModal = ref(false)
const form = ref({ title: '', url: '', category: 'LINK' })
const saving = ref(false)
const myId = computed(() => (authStore.currentUser as any)?.id)

async function load() {
  loading.value = true
  try {
    const query = selectedCategory.value ? `?category=${selectedCategory.value}` : ''
    resources.value = await authGet<Resource[]>(`/workspaces/${workspaceId.value}/study/resources${query}`)
  }
  finally { loading.value = false }
}

onMounted(load)
watch(selectedCategory, load)

async function addResource() {
  if (!form.value.title.trim()) return
  if (form.value.category === 'LINK' && !form.value.url.trim()) {
    alert('링크 URL을 입력하세요')
    return
  }
  saving.value = true
  try {
    await authPost(`/workspaces/${workspaceId.value}/study/resources`, {
      title: form.value.title,
      url: form.value.url || undefined,
      category: form.value.category,
    })
    showModal.value = false
    form.value = { title: '', url: '', category: 'LINK' }
    await load()
  }
  catch (e: any) { alert(e.message || '추가 실패') }
  finally { saving.value = false }
}

async function deleteResource(id: string) {
  if (!confirm('자료를 삭제하시겠습니까?')) return
  await authDel(`/workspaces/${workspaceId.value}/study/resources/${id}`)
  await load()
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}
</script>

<template>
  <div>
    <!-- 헤더 -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-xl font-bold text-foreground">자료 모음</h1>
        <p class="text-sm text-muted-foreground mt-0.5">스터디 관련 자료를 공유합니다</p>
      </div>
      <button
        class="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition"
        @click="showModal = true"
      >
        <Icon icon="heroicons:plus" class="w-4 h-4" />
        자료 추가
      </button>
    </div>

    <!-- 카테고리 필터 -->
    <div class="flex gap-2 mb-5">
      <button
        v-for="cat in CATEGORIES"
        :key="cat.value"
        class="px-3 py-1.5 text-xs rounded-full border transition-colors"
        :class="selectedCategory === cat.value
          ? 'bg-primary text-primary-foreground border-primary'
          : 'border-border text-muted-foreground hover:bg-accent'"
        @click="selectedCategory = cat.value"
      >
        {{ cat.label }}
      </button>
    </div>

    <!-- 로딩 -->
    <div v-if="loading" class="flex justify-center py-16">
      <Icon icon="heroicons:arrow-path" class="w-6 h-6 animate-spin text-muted-foreground" />
    </div>

    <!-- 빈 상태 -->
    <div v-else-if="resources.length === 0" class="flex flex-col items-center py-20 text-center">
      <Icon icon="heroicons:folder-open" class="w-12 h-12 text-muted-foreground opacity-30 mb-3" />
      <p class="text-sm text-muted-foreground">아직 자료가 없습니다</p>
      <p class="text-xs text-muted-foreground mt-1">위의 버튼으로 자료를 추가하세요</p>
    </div>

    <!-- 자료 그리드 -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <div
        v-for="res in resources"
        :key="res.id"
        class="border border-border rounded-xl bg-card p-4 hover:shadow-sm transition-shadow group"
      >
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon :icon="CATEGORY_ICONS[res.category] || 'heroicons:folder'" class="w-5 h-5 text-primary" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-foreground truncate">{{ res.title }}</p>
            <a
              v-if="res.url || res.fileUrl"
              :href="res.url ?? res.fileUrl ?? '#'"
              target="_blank"
              class="text-xs text-primary hover:underline truncate block mt-0.5"
            >
              {{ res.url ?? res.fileUrl }}
            </a>
          </div>
        </div>
        <div class="flex items-center justify-between mt-3">
          <div class="flex items-center gap-1.5">
            <div class="w-5 h-5 rounded-full bg-muted overflow-hidden flex items-center justify-center flex-shrink-0">
              <img v-if="res.uploadedBy.avatarUrl" :src="res.uploadedBy.avatarUrl" class="w-full h-full object-cover" />
              <span v-else class="text-[10px] text-muted-foreground">{{ (res.uploadedBy.nickname ?? '?').slice(0, 1) }}</span>
            </div>
            <span class="text-xs text-muted-foreground">{{ res.uploadedBy.nickname }}</span>
            <span class="text-xs text-muted-foreground">· {{ formatDate(res.createdAt) }}</span>
          </div>
          <button
            v-if="res.uploadedBy.id === myId"
            class="p-1 rounded text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition"
            @click="deleteResource(res.id)"
          >
            <Icon icon="heroicons:trash" class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- 자료 추가 모달 -->
  <Teleport to="body">
    <div
      v-if="showModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      @click.self="showModal = false"
    >
      <div class="bg-card border border-border rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div class="flex items-center justify-between mb-5">
          <h3 class="text-base font-semibold">자료 추가</h3>
          <button class="text-muted-foreground hover:text-foreground" @click="showModal = false">
            <Icon icon="heroicons:x-mark" class="w-5 h-5" />
          </button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-muted-foreground mb-1.5">분류</label>
            <div class="flex gap-2 flex-wrap">
              <button
                v-for="cat in CATEGORIES.slice(1)"
                :key="cat.value"
                class="px-3 py-1.5 text-xs rounded-lg border transition-colors"
                :class="form.category === cat.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:bg-accent'"
                @click="form.category = cat.value"
              >
                {{ cat.label }}
              </button>
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-muted-foreground mb-1.5">제목 <span class="text-destructive">*</span></label>
            <input
              v-model="form.title"
              type="text"
              placeholder="자료 제목"
              class="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div v-if="form.category === 'LINK' || form.category === 'VIDEO'">
            <label class="block text-xs font-medium text-muted-foreground mb-1.5">URL <span class="text-destructive">*</span></label>
            <input
              v-model="form.url"
              type="url"
              placeholder="https://..."
              class="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-6">
          <button
            class="px-4 py-2 text-sm border border-border rounded-lg hover:bg-accent transition"
            @click="showModal = false"
          >
            취소
          </button>
          <button
            :disabled="!form.title.trim() || saving"
            class="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition"
            @click="addResource"
          >
            {{ saving ? '추가 중...' : '추가' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
