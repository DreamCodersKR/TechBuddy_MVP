<script setup lang="ts">
/**
 * OAuth 콜백 페이지
 * - 백엔드에서 OAuth 인증 후 리다이렉트되는 페이지
 * - URL 파라미터에서 accessToken과 isNewUser 추출
 * - 토큰 저장 후 메인 페이지로 이동
 */

definePageMeta({
  layout: 'auth',
})

const route = useRoute()
const authStore = useAuthStore()

const isProcessing = ref(true)
const errorMessage = ref<string | null>(null)

onMounted(async () => {
  try {
    // URL 파라미터에서 토큰 추출
    const accessToken = route.query.accessToken as string
    const isNewUser = route.query.isNewUser === 'true'
    const error = route.query.error as string

    // 에러 체크
    if (error) {
      errorMessage.value = error
      console.error('OAuth error:', error)
      return
    }

    // 토큰 유효성 체크
    if (!accessToken) {
      errorMessage.value = '인증 토큰이 없습니다.'
      console.error('No access token')
      return
    }

    // 토큰 저장 및 사용자 정보 복원
    await authStore.setOAuthToken(accessToken)

    // 성공 로그
    if (isNewUser) {
      console.log('회원가입 완료')
    }
    else {
      console.log('로그인 성공')
    }

    // 메인 페이지로 이동
    navigateTo('/')
  }
  catch (err) {
    console.error('OAuth callback error:', err)
    errorMessage.value = '인증 처리 중 오류가 발생했습니다.'
  }
  finally {
    isProcessing.value = false
  }
})
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-[300px]">
    <!-- 로딩 상태 -->
    <template v-if="isProcessing">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4" />
      <p class="text-gray-400">
        로그인 처리 중...
      </p>
    </template>

    <!-- 에러 상태 -->
    <template v-else-if="errorMessage">
      <div class="text-center">
        <div class="text-red-500 text-5xl mb-4">
          !
        </div>
        <h2 class="text-xl font-semibold text-white mb-2">
          로그인 실패
        </h2>
        <p class="text-gray-400 mb-6">
          {{ errorMessage }}
        </p>
        <NuxtLink
          to="/auth/login"
          class="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
        >
          로그인 페이지로 돌아가기
        </NuxtLink>
      </div>
    </template>
  </div>
</template>
