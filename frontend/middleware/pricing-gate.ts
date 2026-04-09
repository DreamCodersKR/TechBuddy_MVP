/**
 * 비로그인 사용자를 /pricing으로 먼저 안내하는 미들웨어
 * FLOWIT AI, 워크스페이스 등 핵심 기능 진입점에서 사용
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()

  if (!authStore.isAuthenticated) {
    await authStore.restoreAuth()
  }

  if (!authStore.isAuthenticated) {
    return navigateTo({
      path: '/pricing',
      query: { redirect: to.fullPath },
    })
  }
})
