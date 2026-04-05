<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

definePageMeta({ layout: 'default', middleware: 'auth' })
useHead({ title: '설정 - FLOWIT' })

const authStore = useAuthStore()
const { patch: authPatch } = useAuthFetch()

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
  catch (e: any) {
    profileError.value = e?.data?.message || '저장에 실패했습니다.'
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
  catch (e: any) {
    pwError.value = e?.data?.message || '비밀번호 변경에 실패했습니다.'
  }
  finally { pwLoading.value = false }
}

const userInitials = computed(() => {
  if (!user.value?.nickname) return 'U'
  return user.value.nickname.slice(0, 2).toUpperCase()
})
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

      <!-- 아바타 미리보기 -->
      <div class="flex items-center gap-4 mb-4">
        <Avatar class="h-14 w-14">
          <AvatarImage :src="profileForm.avatarUrl || undefined" />
          <AvatarFallback>{{ userInitials }}</AvatarFallback>
        </Avatar>
        <div class="flex-1">
          <label class="text-xs text-muted-foreground mb-1 block">프로필 이미지 URL</label>
          <Input v-model="profileForm.avatarUrl" placeholder="https://example.com/avatar.jpg" class="h-8 text-sm" />
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
