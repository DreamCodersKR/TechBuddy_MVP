<script setup lang="ts">
definePageMeta({ layout: 'workspace', middleware: 'auth' })

const route = useRoute()
const workspaceId = computed(() => route.params.id as string)
const { get: authGet, delete: authDel } = useAuthFetch()
const authStore = useAuthStore()

// ─── 타입 ────────────────────────────────────────────────
type Category = 'ALL' | 'PLANNING' | 'DESIGN' | 'PRESENTATION' | 'OTHER'

interface DocumentItem {
  id: string
  fileName: string
  fileUrl: string
  fileSize: number
  fileType: string
  category: Exclude<Category, 'ALL'>
  createdAt: string
  uploadedBy: { id: string; name: string; avatarUrl?: string }
}

// ─── 상태 ────────────────────────────────────────────────
const documents = ref<DocumentItem[]>([])
const isLoading = ref(false)
const selectedIds = ref<Set<string>>(new Set())
const searchQuery = ref('')
const activeCategory = ref<Category>('ALL')

// 업로드
const isDragging = ref(false)
const uploadCategory = ref<Exclude<Category, 'ALL'>>('OTHER')
const isUploading = ref(false)
const uploadProgress = ref(0)
const fileInputRef = ref<HTMLInputElement>()

// 다운로드
const isZipDownloading = ref(false)

// ─── 카테고리 메타 ────────────────────────────────────────
const CATEGORY_META: Record<Category, { label: string; icon: string }> = {
  ALL: { label: '전체', icon: 'heroicons:squares-2x2' },
  PLANNING: { label: '기획서', icon: 'heroicons:clipboard-document-list' },
  DESIGN: { label: '설계서', icon: 'heroicons:pencil-square' },
  PRESENTATION: { label: '발표자료', icon: 'heroicons:presentation-chart-bar' },
  OTHER: { label: '기타', icon: 'heroicons:folder' },
}

// ─── 데이터 로드 ─────────────────────────────────────────
async function loadDocuments() {
  isLoading.value = true
  try {
    const params = activeCategory.value !== 'ALL' ? `?category=${activeCategory.value}` : ''
    documents.value = await authGet<DocumentItem[]>(`/workspaces/${workspaceId.value}/documents${params}`)
  } catch (e) {
    documents.value = []
  } finally {
    isLoading.value = false
  }
}

watch(workspaceId, loadDocuments, { immediate: true })
watch(activeCategory, loadDocuments)

// ─── 필터링 ──────────────────────────────────────────────
const filteredDocuments = computed(() => {
  const q = searchQuery.value.toLowerCase()
  if (!q) return documents.value
  return documents.value.filter(d => d.fileName.toLowerCase().includes(q))
})

// ─── 선택 ────────────────────────────────────────────────
const allSelected = computed(
  () => filteredDocuments.value.length > 0 && filteredDocuments.value.every(d => selectedIds.value.has(d.id))
)

function toggleSelectAll() {
  if (allSelected.value) {
    selectedIds.value = new Set()
  } else {
    selectedIds.value = new Set(filteredDocuments.value.map(d => d.id))
  }
}

function toggleSelect(id: string) {
  const s = new Set(selectedIds.value)
  s.has(id) ? s.delete(id) : s.add(id)
  selectedIds.value = s
}

// ─── 업로드 ──────────────────────────────────────────────
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.zip', '.png', '.jpg', '.jpeg', '.gif']
const MAX_SIZE = 50 * 1024 * 1024

function onDragOver(e: DragEvent) { e.preventDefault(); isDragging.value = true }
function onDragLeave() { isDragging.value = false }

function onDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
  const files = Array.from(e.dataTransfer?.files ?? [])
  if (files.length) uploadFile(files[0])
}

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) uploadFile(file)
}

async function uploadFile(file: File) {
  const ext = '.' + file.name.split('.').pop()?.toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    alert(`허용되지 않는 파일 형식입니다.\n허용: ${ALLOWED_EXTENSIONS.join(', ')}`)
    return
  }
  if (file.size > MAX_SIZE) {
    alert('파일 크기는 최대 50MB까지 허용됩니다.')
    return
  }

  isUploading.value = true
  uploadProgress.value = 0

  const formData = new FormData()
  formData.append('file', file)
  formData.append('category', uploadCategory.value)

  try {
    const apiBase = useRuntimeConfig().public.apiBase || 'http://localhost:8080'
    const token = authStore.accessToken

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) uploadProgress.value = Math.round((e.loaded / e.total) * 100)
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve()
        else reject(new Error(xhr.responseText))
      }
      xhr.onerror = () => reject(new Error('업로드 실패'))
      xhr.open('POST', `${apiBase}/workspaces/${workspaceId.value}/documents`)
      xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      xhr.send(formData)
    })

    await loadDocuments()
    if (fileInputRef.value) fileInputRef.value.value = ''
  } catch (e) {
    alert('업로드 중 오류가 발생했습니다.')
  } finally {
    isUploading.value = false
    uploadProgress.value = 0
  }
}

// ─── 다운로드 ─────────────────────────────────────────────
async function downloadSingle(doc: DocumentItem) {
  try {
    const apiBase = useRuntimeConfig().public.apiBase || 'http://localhost:8080'
    const token = authStore.accessToken
    const res = await fetch(`${apiBase}/workspaces/${workspaceId.value}/documents/${doc.id}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = doc.fileName
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    alert('다운로드 중 오류가 발생했습니다.')
  }
}

async function downloadZip() {
  if (!selectedIds.value.size) return
  isZipDownloading.value = true
  try {
    const apiBase = useRuntimeConfig().public.apiBase || 'http://localhost:8080'
    const token = authStore.accessToken
    const res = await fetch(`${apiBase}/workspaces/${workspaceId.value}/documents/download-zip`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ documentIds: Array.from(selectedIds.value) }),
    })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'documents.zip'
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    alert('ZIP 다운로드 중 오류가 발생했습니다.')
  } finally {
    isZipDownloading.value = false
  }
}

// ─── 삭제 ────────────────────────────────────────────────
async function deleteDocument(id: string) {
  if (!confirm('문서를 삭제하시겠습니까?')) return
  try {
    await authDel(`/workspaces/${workspaceId.value}/documents/${id}`)
    await loadDocuments()
    selectedIds.value.delete(id)
  } catch {
    alert('삭제 중 오류가 발생했습니다.')
  }
}

// ─── 유틸 ────────────────────────────────────────────────
function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}
</script>

<template>
  <div class="flex-1 overflow-auto p-6">
    <!-- 헤더 -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold">산출문서 보관함</h1>
        <p class="text-sm text-muted-foreground mt-1">프로젝트 산출물을 카테고리별로 관리하세요</p>
      </div>
    </div>

    <!-- 카테고리 탭 -->
    <div class="flex gap-1 mb-5 bg-muted p-1 rounded-lg w-fit">
      <button
        v-for="(meta, cat) in CATEGORY_META"
        :key="cat"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
        :class="activeCategory === cat
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground'"
        @click="activeCategory = cat as Category"
      >
        <Icon :icon="meta.icon" class="h-4 w-4" />
        {{ meta.label }}
      </button>
    </div>

    <!-- 업로드 드롭존 -->
    <div
      class="border-2 border-dashed rounded-xl p-6 mb-5 transition-colors"
      :class="isDragging ? 'border-primary bg-primary/5' : 'border-border'"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <div class="flex items-center gap-4">
        <div class="flex-1 flex items-center gap-3">
          <Icon icon="heroicons:cloud-arrow-up" class="h-8 w-8 text-muted-foreground flex-shrink-0" />
          <div>
            <p class="text-sm font-medium">파일을 드래그하거나 클릭하여 업로드</p>
            <p class="text-xs text-muted-foreground">PDF, DOCX, PPTX, XLSX, ZIP, 이미지 · 최대 50MB</p>
          </div>
        </div>
        <!-- 카테고리 선택 -->
        <select
          v-model="uploadCategory"
          class="text-sm border border-border rounded-lg px-3 py-2 bg-background"
        >
          <option v-for="(meta, cat) in CATEGORY_META" :key="cat" :value="cat" :disabled="cat === 'ALL'">
            {{ meta.label }}
          </option>
        </select>
        <!-- 파일 선택 버튼 -->
        <button
          class="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
          @click="fileInputRef?.click()"
        >
          파일 선택
        </button>
        <input ref="fileInputRef" type="file" class="hidden" @change="onFileChange" />
      </div>

      <!-- 업로드 진행률 -->
      <div v-if="isUploading" class="mt-4">
        <div class="flex justify-between text-xs text-muted-foreground mb-1">
          <span>업로드 중...</span>
          <span>{{ uploadProgress }}%</span>
        </div>
        <div class="w-full bg-muted rounded-full h-2">
          <div
            class="bg-primary h-2 rounded-full transition-all"
            :style="{ width: uploadProgress + '%' }"
          />
        </div>
      </div>
    </div>

    <!-- 액션 바 -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <!-- 검색 -->
        <div class="relative">
          <Icon icon="heroicons:magnifying-glass" class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="파일명 검색..."
            class="pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-background w-52"
          />
        </div>
        <!-- ZIP 다운로드 버튼 -->
        <button
          v-if="selectedIds.size > 0"
          :disabled="isZipDownloading"
          class="flex items-center gap-1.5 px-3 py-2 bg-secondary text-secondary-foreground text-sm font-medium rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-60"
          @click="downloadZip"
        >
          <Icon icon="heroicons:archive-box-arrow-down" class="h-4 w-4" />
          {{ isZipDownloading ? 'ZIP 생성 중...' : `선택 다운로드 (${selectedIds.size})` }}
        </button>
      </div>
      <p class="text-sm text-muted-foreground">총 {{ filteredDocuments.length }}개</p>
    </div>

    <!-- 파일 목록 테이블 -->
    <div class="border border-border rounded-xl overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-muted/50">
          <tr>
            <th class="w-10 px-4 py-3 text-left">
              <input type="checkbox" :checked="allSelected" class="rounded" @change="toggleSelectAll" />
            </th>
            <th class="px-4 py-3 text-left font-medium text-muted-foreground">파일명</th>
            <th class="px-4 py-3 text-left font-medium text-muted-foreground">카테고리</th>
            <th class="px-4 py-3 text-left font-medium text-muted-foreground">업로더</th>
            <th class="px-4 py-3 text-left font-medium text-muted-foreground">업로드일</th>
            <th class="px-4 py-3 text-left font-medium text-muted-foreground">크기</th>
            <th class="px-4 py-3 text-left font-medium text-muted-foreground">액션</th>
          </tr>
        </thead>
        <tbody>
          <!-- 로딩 -->
          <tr v-if="isLoading">
            <td colspan="7" class="px-4 py-12 text-center text-muted-foreground">
              <Icon icon="heroicons:arrow-path" class="h-5 w-5 animate-spin mx-auto mb-2" />
              불러오는 중...
            </td>
          </tr>
          <!-- 빈 상태 -->
          <tr v-else-if="filteredDocuments.length === 0">
            <td colspan="7" class="px-4 py-12 text-center text-muted-foreground">
              <Icon icon="heroicons:document" class="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>업로드된 문서가 없습니다.</p>
            </td>
          </tr>
          <!-- 파일 목록 -->
          <tr
            v-for="doc in filteredDocuments"
            :key="doc.id"
            class="border-t border-border hover:bg-muted/30 transition-colors"
          >
            <td class="px-4 py-3">
              <input
                type="checkbox"
                :checked="selectedIds.has(doc.id)"
                class="rounded"
                @change="toggleSelect(doc.id)"
              />
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <Icon icon="heroicons:document-text" class="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span class="font-medium truncate max-w-[200px]">{{ doc.fileName }}</span>
              </div>
            </td>
            <td class="px-4 py-3">
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                <Icon :icon="CATEGORY_META[doc.category].icon" class="h-3 w-3" />
                {{ CATEGORY_META[doc.category].label }}
              </span>
            </td>
            <td class="px-4 py-3 text-muted-foreground">{{ doc.uploadedBy.name }}</td>
            <td class="px-4 py-3 text-muted-foreground">{{ formatDate(doc.createdAt) }}</td>
            <td class="px-4 py-3 text-muted-foreground">{{ formatFileSize(doc.fileSize) }}</td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-1">
                <button
                  class="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  title="다운로드"
                  @click="downloadSingle(doc)"
                >
                  <Icon icon="heroicons:arrow-down-tray" class="h-4 w-4" />
                </button>
                <button
                  class="p-1.5 rounded-md hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                  title="삭제"
                  @click="deleteDocument(doc.id)"
                >
                  <Icon icon="heroicons:trash" class="h-4 w-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
