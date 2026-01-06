/**
 * 인증 상태 복원 플러그인 (클라이언트 전용)
 * - 앱 초기화 시 저장된 토큰으로 인증 상태 복원
 * - Refresh Token(HttpOnly Cookie)으로 세션 유지
 */
export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()

  // 이미 인증된 상태면 스킵 (SSR에서 이미 복원된 경우)
  if (authStore.isAuthenticated) {
    return
  }

  // SSR에서 user 정보가 있지만 accessToken만 없는 경우 (hydration 후)
  // 쿠키에서 토큰 복원
  const tokenCookie = useCookie('accessToken')
  if (tokenCookie.value && !authStore.accessToken) {
    authStore.accessToken = tokenCookie.value
  }

  // 사용자 정보가 없으면 복원 시도
  if (!authStore.user) {
    await authStore.restoreAuth()
  }
})
