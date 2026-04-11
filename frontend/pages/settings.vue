<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'vue-sonner'

definePageMeta({ layout: 'default', middleware: 'auth' })
useHead({ title: '설정 - FLOWIT' })

const authStore = useAuthStore()
const { patch: authPatch, post: authPost, get: authGet } = useAuthFetch()

const user = computed(() => authStore.currentUser)

// ─── 프로필 수정 ──────────────────────────────────────────
const profileForm = reactive({
  nickname: user.value?.nickname ?? '',
  bio: (user.value as any)?.bio ?? '',
  avatarUrl: user.value?.avatarUrl ?? '',
  githubUrl: (user.value as any)?.githubUrl ?? '',
  portfolioUrl: (user.value as any)?.portfolioUrl ?? '',
  techStack: ((user.value as any)?.techStack ?? []) as string[],
})
const techInput = ref('')
const profileLoading = ref(false)
const profileSuccess = ref(false)
const profileError = ref('')

// ─── 아바타 업로드 ────────────────────────────────────────
const avatarFileInput = ref<HTMLInputElement | null>(null)
const avatarPreview = ref<string>(user.value?.avatarUrl ?? '')
const avatarFile = ref<File | null>(null)
const avatarUploading = ref(false)
const avatarError = ref('')

function onAvatarFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    avatarError.value = '이미지 파일만 업로드할 수 있습니다.'
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    avatarError.value = '파일 크기는 5MB 이하여야 합니다.'
    return
  }
  avatarError.value = ''
  avatarFile.value = file
  avatarPreview.value = URL.createObjectURL(file)
}

async function handleAvatarUpload() {
  if (!avatarFile.value) return
  avatarUploading.value = true
  avatarError.value = ''
  try {
    const formData = new FormData()
    formData.append('avatar', avatarFile.value)
    const updated = await authPost<any>('/users/me/avatar', formData)
    if (authStore.currentUser) {
      authStore.currentUser.avatarUrl = updated.avatarUrl
    }
    profileForm.avatarUrl = updated.avatarUrl
    avatarFile.value = null
  }
  catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    avatarError.value = err?.data?.message || '업로드에 실패했습니다.'
  }
  finally { avatarUploading.value = false }
}

function addTech() {
  const t = techInput.value.trim()
  if (t && !profileForm.techStack.includes(t)) {
    profileForm.techStack.push(t)
  }
  techInput.value = ''
}

function removeTech(tech: string) {
  profileForm.techStack = profileForm.techStack.filter(t => t !== tech)
}

async function handleProfileSave() {
  profileLoading.value = true
  profileSuccess.value = false
  profileError.value = ''
  try {
    const updated = await authPatch<any>('/users/me', {
      nickname: profileForm.nickname || undefined,
      bio: profileForm.bio || undefined,
      avatarUrl: profileForm.avatarUrl || undefined,
      githubUrl: profileForm.githubUrl || undefined,
      portfolioUrl: profileForm.portfolioUrl || undefined,
      techStack: profileForm.techStack,
    })
    // 스토어 갱신
    if (authStore.currentUser) {
      Object.assign(authStore.currentUser, updated)
    }
    profileSuccess.value = true
    setTimeout(() => { profileSuccess.value = false }, 3000)
  }
  catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    profileError.value = err?.data?.message || '저장에 실패했습니다.'
  }
  finally { profileLoading.value = false }
}

// ─── 비밀번호 변경 ────────────────────────────────────────
const pwForm = reactive({
  currentPassword: '',
  password: '',
  passwordConfirm: '',
})
const pwLoading = ref(false)
const pwSuccess = ref(false)
const pwError = ref('')

async function handlePasswordChange() {
  if (pwForm.password !== pwForm.passwordConfirm) {
    pwError.value = '새 비밀번호가 일치하지 않습니다.'
    return
  }
  if (pwForm.password.length < 8) {
    pwError.value = '비밀번호는 최소 8자 이상이어야 합니다.'
    return
  }
  pwLoading.value = true
  pwSuccess.value = false
  pwError.value = ''
  try {
    await authPatch('/users/me', {
      currentPassword: pwForm.currentPassword,
      password: pwForm.password,
    })
    pwSuccess.value = true
    pwForm.currentPassword = ''
    pwForm.password = ''
    pwForm.passwordConfirm = ''
    setTimeout(() => { pwSuccess.value = false }, 3000)
  }
  catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    pwError.value = err?.data?.message || '비밀번호 변경에 실패했습니다.'
  }
  finally { pwLoading.value = false }
}

const userInitials = computed(() => {
  if (!user.value?.nickname) return 'U'
  return user.value.nickname.slice(0, 2).toUpperCase()
})

// ─── 포트폴리오 공개 설정 ─────────────────────────────────
const authPatchPortfolio = authPatch
const portfolioPublic = ref(true)
const portfolioSections = reactive({
  stats: true,
  grass: true,
  projects: true,
  badges: true,
  recentTILs: true,
})
const portfolioSettingsLoading = ref(false)
const portfolioSettingsSaving = ref(false)
const portfolioSettingsSuccess = ref(false)
const portfolioNickname = ref('')

onMounted(async () => {
  try {
    portfolioSettingsLoading.value = true
    const data = await authGet<any>('/portfolio/settings')
    portfolioPublic.value = data.portfolioPublic ?? true
    portfolioNickname.value = data.nickname ?? ''
    if (data.portfolioSections) {
      Object.assign(portfolioSections, data.portfolioSections)
    }
  }
  catch { /* 조용히 실패 */ }
  finally { portfolioSettingsLoading.value = false }
})

async function savePortfolioSettings() {
  portfolioSettingsSaving.value = true
  portfolioSettingsSuccess.value = false
  try {
    await authPatchPortfolio('/portfolio/settings', {
      portfolioPublic: portfolioPublic.value,
      portfolioSections: { ...portfolioSections },
    })
    portfolioSettingsSuccess.value = true
    setTimeout(() => { portfolioSettingsSuccess.value = false }, 3000)
  }
  catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    toast.error(err?.data?.message || '저장 실패')
  }
  finally { portfolioSettingsSaving.value = false }
}

function copyPortfolioLink() {
  const link = `${window.location.origin}/portfolio/${portfolioNickname.value}`
  navigator.clipboard.writeText(link)
  toast.success('링크가 복사되었습니다!')
}

// ─── 이메일 수신 설정 ────────────────────────────────────
interface EmailPrefs {
  marketing: boolean
  commentReply: boolean
  projectActivity: boolean
  weeklySummary: boolean
}

const EMAIL_PREF_LABELS: Record<keyof EmailPrefs, { label: string; desc: string }> = {
  marketing: { label: '마케팅/뉴스레터', desc: '서비스 업데이트, 새 기능 안내' },
  commentReply: { label: '댓글/답변 알림', desc: '내 게시글 댓글, 아고라 답변' },
  projectActivity: { label: '프로젝트 활동', desc: '태스크 배정, 스프린트 변경' },
  weeklySummary: { label: '주간 활동 요약', desc: '매주 활동 정리 리포트' },
}

const emailPrefs = reactive<EmailPrefs>({
  marketing: true,
  commentReply: true,
  projectActivity: true,
  weeklySummary: true,
})
const emailPrefsLoading = ref(true)

onMounted(async () => {
  try {
    const data = await authGet<EmailPrefs>('/users/me/email-preferences')
    Object.assign(emailPrefs, data)
  }
  catch { /* 기본값 유지 */ }
  finally { emailPrefsLoading.value = false }
})

async function toggleEmailPref(key: keyof EmailPrefs) {
  emailPrefs[key] = !emailPrefs[key]
  try {
    await authPatch('/users/me/email-preferences', { [key]: emailPrefs[key] })
  }
  catch { emailPrefs[key] = !emailPrefs[key] }
}


</script>

<template>
  <div class="max-w-xl mx-auto py-8 px-4">
    <div class="flex items-center gap-3 mb-6">
      <NuxtLink to="/mypage">
        <Button variant="ghost" size="icon">
          <Icon icon="heroicons:arrow-left" class="w-4 h-4" />
        </Button>
      </NuxtLink>
      <h1 class="text-xl font-bold text-foreground">설정</h1>
    </div>

    <!-- 프로필 수정 -->
    <div class="bg-card border border-border rounded-xl p-6 mb-6">
      <h2 class="text-sm font-semibold text-foreground mb-4">프로필 수정</h2>

      <!-- 아바타 업로드 -->
      <div class="flex items-center gap-4 mb-4">
        <div class="relative">
          <Avatar class="h-16 w-16">
            <AvatarImage :src="avatarPreview || undefined" />
            <AvatarFallback>{{ userInitials }}</AvatarFallback>
          </Avatar>
          <button
            class="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow"
            @click="avatarFileInput?.click()"
          >
            <Icon icon="heroicons:camera" class="w-3.5 h-3.5" />
          </button>
        </div>
        <div class="flex-1">
          <p class="text-xs text-muted-foreground mb-2">프로필 이미지 (jpeg, png, gif, webp · 최대 5MB)</p>
          <input
            ref="avatarFileInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="onAvatarFileChange"
          />
          <div class="flex gap-2">
            <Button variant="outline" size="sm" class="text-xs" @click="avatarFileInput?.click()">
              <Icon icon="heroicons:arrow-up-tray" class="w-3.5 h-3.5 mr-1" />
              파일 선택
            </Button>
            <Button
              v-if="avatarFile"
              size="sm"
              class="text-xs"
              :disabled="avatarUploading"
              @click="handleAvatarUpload"
            >
              <Icon v-if="avatarUploading" icon="heroicons:arrow-path" class="w-3.5 h-3.5 mr-1 animate-spin" />
              {{ avatarUploading ? '업로드 중...' : '업로드' }}
            </Button>
          </div>
          <p v-if="avatarError" class="text-xs text-destructive mt-1">{{ avatarError }}</p>
          <p v-if="avatarFile && !avatarUploading" class="text-xs text-muted-foreground mt-1">{{ avatarFile.name }}</p>
        </div>
      </div>

      <div class="space-y-3">
        <div>
          <label class="text-xs text-muted-foreground mb-1 block">닉네임</label>
          <Input v-model="profileForm.nickname" placeholder="닉네임을 입력하세요" class="h-9" />
        </div>
        <div>
          <label class="text-xs text-muted-foreground mb-1 block">자기소개</label>
          <textarea
            v-model="profileForm.bio"
            rows="3"
            placeholder="간단한 자기소개를 입력하세요"
            class="w-full text-sm px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>
        <div>
          <label class="text-xs text-muted-foreground mb-1 block">GitHub URL</label>
          <Input v-model="profileForm.githubUrl" placeholder="https://github.com/username" class="h-9" />
        </div>
        <div>
          <label class="text-xs text-muted-foreground mb-1 block">포트폴리오 URL</label>
          <Input v-model="profileForm.portfolioUrl" placeholder="https://portfolio.example.com" class="h-9" />
        </div>
        <div>
          <label class="text-xs text-muted-foreground mb-1 block">기술 스택</label>
          <div class="flex flex-wrap gap-1 mb-2">
            <span
              v-for="tech in profileForm.techStack"
              :key="tech"
              class="flex items-center gap-1 px-2 py-0.5 text-xs bg-muted rounded-md"
            >
              {{ tech }}
              <button class="text-muted-foreground hover:text-destructive" @click="removeTech(tech)">×</button>
            </span>
          </div>
          <div class="flex gap-2">
            <Input
              v-model="techInput"
              placeholder="기술 스택 추가 (Enter)"
              class="h-8 text-sm"
              @keydown.enter.prevent="addTech"
            />
            <Button variant="outline" size="sm" @click="addTech">추가</Button>
          </div>
        </div>
      </div>

      <p v-if="profileError" class="text-xs text-destructive mt-3">{{ profileError }}</p>
      <p v-if="profileSuccess" class="text-xs text-green-600 mt-3">저장되었습니다.</p>

      <Button class="w-full mt-4" :disabled="profileLoading" @click="handleProfileSave">
        <Icon v-if="profileLoading" icon="heroicons:arrow-path" class="w-4 h-4 mr-2 animate-spin" />
        저장하기
      </Button>
    </div>

    <!-- 포트폴리오 공개 설정 -->
    <div class="bg-card border border-border rounded-xl p-6 mb-6">
      <h2 class="text-sm font-semibold text-foreground mb-1">포트폴리오 공개 설정</h2>
      <p class="text-xs text-muted-foreground mb-4">포트폴리오는 공개 링크로 누구나 볼 수 있습니다</p>

      <div v-if="portfolioSettingsLoading" class="text-xs text-muted-foreground py-4 text-center">불러오는 중...</div>

      <div v-else class="space-y-4">
        <!-- 공개 여부 토글 -->
        <label class="flex items-center justify-between cursor-pointer">
          <div>
            <p class="text-sm font-medium text-foreground">포트폴리오 공개</p>
            <p class="text-xs text-muted-foreground">비공개 시 링크로 접근 불가</p>
          </div>
          <div
            class="relative w-10 h-5 rounded-full transition-colors cursor-pointer"
            :class="portfolioPublic ? 'bg-primary' : 'bg-muted'"
            @click="portfolioPublic = !portfolioPublic"
          >
            <div
              class="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
              :class="portfolioPublic ? 'translate-x-5' : 'translate-x-0.5'"
            />
          </div>
        </label>

        <!-- 섹션 설정 -->
        <div>
          <p class="text-xs font-medium text-muted-foreground mb-2">표시할 섹션 선택</p>
          <div class="space-y-2">
            <label
              v-for="(label, key) in { stats: '활동 요약 (TIL/아고라/프로젝트)', grass: 'TIL 잔디', projects: '프로젝트 목록', badges: '뱃지', recentTILs: '최근 TIL' }"
              :key="key"
              class="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="checkbox"
                v-model="(portfolioSections as any)[key]"
                class="w-4 h-4 accent-primary"
              />
              <span class="text-sm text-foreground">{{ label }}</span>
            </label>
          </div>
        </div>

        <!-- 링크 섹션 -->
        <div v-if="portfolioNickname" class="border border-border rounded-lg p-3 bg-muted/30">
          <p class="text-xs text-muted-foreground mb-1">내 포트폴리오 링크</p>
          <p class="text-sm text-foreground font-mono truncate">
            {{ `${$nuxt ? '' : ''}flowit.co/portfolio/${portfolioNickname}` }}
          </p>
          <div class="flex gap-2 mt-2">
            <button
              class="flex items-center gap-1 text-xs px-2 py-1 border border-border rounded hover:bg-accent transition"
              @click="copyPortfolioLink"
            >
              <Icon icon="heroicons:clipboard" class="w-3.5 h-3.5" />
              링크 복사
            </button>
            <NuxtLink
              :to="`/portfolio/${portfolioNickname}`"
              target="_blank"
              class="flex items-center gap-1 text-xs px-2 py-1 border border-border rounded hover:bg-accent transition"
            >
              <Icon icon="heroicons:arrow-top-right-on-square" class="w-3.5 h-3.5" />
              미리보기
            </NuxtLink>
          </div>
        </div>

        <p v-if="portfolioSettingsSuccess" class="text-xs text-green-600">저장되었습니다.</p>

        <Button class="w-full" :disabled="portfolioSettingsSaving" @click="savePortfolioSettings">
          <Icon v-if="portfolioSettingsSaving" icon="heroicons:arrow-path" class="w-4 h-4 mr-2 animate-spin" />
          저장하기
        </Button>
      </div>
    </div>

    <!-- 이메일 수신 설정 -->
    <div class="bg-card border border-border rounded-xl p-6 mb-6">
      <h2 class="text-sm font-semibold text-foreground mb-1">이메일 수신 설정</h2>
      <p class="text-xs text-muted-foreground mb-4">받고 싶은 이메일 알림을 선택하세요</p>

      <div v-if="emailPrefsLoading" class="text-xs text-muted-foreground py-4 text-center">불러오는 중...</div>
      <div v-else class="space-y-3">
        <label
          v-for="(meta, key) in EMAIL_PREF_LABELS"
          :key="key"
          class="flex items-center justify-between cursor-pointer"
        >
          <div>
            <p class="text-sm font-medium text-foreground">{{ meta.label }}</p>
            <p class="text-xs text-muted-foreground">{{ meta.desc }}</p>
          </div>
          <div
            class="relative w-10 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0"
            :class="emailPrefs[key as keyof EmailPrefs] ? 'bg-primary' : 'bg-muted'"
            @click="toggleEmailPref(key as keyof EmailPrefs)"
          >
            <div
              class="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
              :class="emailPrefs[key as keyof EmailPrefs] ? 'translate-x-5' : 'translate-x-0.5'"
            />
          </div>
        </label>
      </div>
    </div>

    <!-- 비밀번호 변경 -->
    <div class="bg-card border border-border rounded-xl p-6">
      <h2 class="text-sm font-semibold text-foreground mb-4">비밀번호 변경</h2>
      <div class="space-y-3">
        <div>
          <label class="text-xs text-muted-foreground mb-1 block">현재 비밀번호</label>
          <Input v-model="pwForm.currentPassword" type="password" placeholder="현재 비밀번호" class="h-9" />
        </div>
        <div>
          <label class="text-xs text-muted-foreground mb-1 block">새 비밀번호</label>
          <Input v-model="pwForm.password" type="password" placeholder="새 비밀번호 (최소 8자)" class="h-9" />
        </div>
        <div>
          <label class="text-xs text-muted-foreground mb-1 block">새 비밀번호 확인</label>
          <Input v-model="pwForm.passwordConfirm" type="password" placeholder="새 비밀번호 확인" class="h-9" />
        </div>
      </div>

      <p v-if="pwError" class="text-xs text-destructive mt-3">{{ pwError }}</p>
      <p v-if="pwSuccess" class="text-xs text-green-600 mt-3">비밀번호가 변경되었습니다.</p>

      <Button class="w-full mt-4" variant="outline" :disabled="pwLoading" @click="handlePasswordChange">
        <Icon v-if="pwLoading" icon="heroicons:arrow-path" class="w-4 h-4 mr-2 animate-spin" />
        비밀번호 변경
      </Button>
    </div>
  </div>
</template>
