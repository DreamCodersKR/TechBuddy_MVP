import type { FetchOptions } from 'ofetch'
import { useAuthStore } from '~/stores/auth'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface AuthFetchOptions extends Omit<FetchOptions, 'method'> {
  method?: HttpMethod
}

/**
 * 인증된 API 요청을 위한 composable
 * - Access Token을 Authorization 헤더에 자동 추가
 * - 401 에러 시 자동으로 토큰 갱신 후 재시도
 * - credentials: 'include'로 HttpOnly Cookie 전송
 */
export function useAuthFetch() {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()

  /**
   * 인증된 API 요청
   * @param endpoint - API 엔드포인트 (예: '/users/me')
   * @param options - fetch 옵션
   */
  async function authFetch<T>(endpoint: string, options: AuthFetchOptions = {}): Promise<T> {
    const url = `${config.public.apiBaseUrl}${endpoint}`

    const fetchOptions: FetchOptions = {
      ...options,
      credentials: 'include', // HttpOnly Cookie 전송
      headers: {
        ...options.headers,
        ...(authStore.accessToken && {
          Authorization: `Bearer ${authStore.accessToken}`,
        }),
      },
    }

    try {
      return await $fetch<T>(url, fetchOptions)
    }
    catch (error: unknown) {
      // 401 에러인 경우 토큰 갱신 시도
      if (
        error
        && typeof error === 'object'
        && 'statusCode' in error
        && (error as { statusCode: number }).statusCode === 401
      ) {
        // 토큰 갱신 시도
        const refreshed = await authStore.refreshAccessToken()

        if (refreshed) {
          // 갱신 성공 시 원래 요청 재시도
          const retryOptions: FetchOptions = {
            ...options,
            credentials: 'include',
            headers: {
              ...options.headers,
              Authorization: `Bearer ${authStore.accessToken}`,
            },
          }
          return await $fetch<T>(url, retryOptions)
        }
        else {
          // 갱신 실패 시 로그인 페이지로 이동
          navigateTo('/auth/login')
        }
      }
      throw error
    }
  }

  // HTTP 메서드별 헬퍼 함수
  const get = <T>(endpoint: string, options?: Omit<AuthFetchOptions, 'method'>) =>
    authFetch<T>(endpoint, { ...options, method: 'GET' })

  const post = <T>(endpoint: string, body?: unknown, options?: Omit<AuthFetchOptions, 'method' | 'body'>) =>
    authFetch<T>(endpoint, { ...options, method: 'POST', body })

  const put = <T>(endpoint: string, body?: unknown, options?: Omit<AuthFetchOptions, 'method' | 'body'>) =>
    authFetch<T>(endpoint, { ...options, method: 'PUT', body })

  const patch = <T>(endpoint: string, body?: unknown, options?: Omit<AuthFetchOptions, 'method' | 'body'>) =>
    authFetch<T>(endpoint, { ...options, method: 'PATCH', body })

  const del = <T>(endpoint: string, options?: Omit<AuthFetchOptions, 'method'>) =>
    authFetch<T>(endpoint, { ...options, method: 'DELETE' })

  return {
    authFetch,
    get,
    post,
    put,
    patch,
    delete: del,
  }
}
