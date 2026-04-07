export default defineNuxtRouteMiddleware(async () => {
  const authStore = useAuthStore()

  if (!authStore.isAuthenticated) {
    await authStore.restoreAuth()
  }

  if (!authStore.isAuthenticated) {
    return navigateTo('/auth/login')
  }

  const role = authStore.currentUser?.role
  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    return navigateTo('/')
  }
})
