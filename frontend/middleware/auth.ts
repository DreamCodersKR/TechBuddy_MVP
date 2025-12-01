/**
 * 인증 확인 미들웨어
 * 로그인이 필요한 페이지에서 사용
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()

  // 아직 인증 상태를 확인하지 않았다면 복원 시도
  if (!authStore.isAuthenticated) {
    await authStore.restoreAuth()
  }

  // 인증되지 않은 경우 로그인 페이지로 리다이렉트
  if (!authStore.isAuthenticated) {
    return navigateTo({
      path: '/auth/login',
      query: { redirect: to.fullPath },
    })
  }
})
