/**
 * 스토어 초기화 플러그인 (SSR + CSR 공통)
 * - 미들웨어보다 먼저 실행되어 authStore.apiBaseUrl을 설정
 * - useRuntimeConfig()를 async 컨텍스트 밖에서 안전하게 호출
 */
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()
  authStore.init(config.public.apiBaseUrl as string)
})
