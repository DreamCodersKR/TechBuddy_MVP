import { defineStore } from 'pinia'
import type { User, LoginRequest, SignupRequest, AuthResponse } from '~/types/auth'

interface AuthState {
  user: User | null
  accessToken: string | null
  isLoading: boolean
  isRefreshing: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    accessToken: null,
    isLoading: false,
    isRefreshing: false,
  }),

  getters: {
    isAuthenticated: (state): boolean => !!state.accessToken && !!state.user,
    currentUser: (state): User | null => state.user,
  },

  actions: {
    /**
     * 로그인
     * - credentials: 'include'로 HttpOnly Cookie(Refresh Token) 수신
     */
    async login(credentials: LoginRequest): Promise<void> {
      const config = useRuntimeConfig()
      this.isLoading = true

      try {
        const response = await $fetch<AuthResponse>(`${config.public.apiBaseUrl}/auth/login`, {
          method: 'POST',
          body: credentials,
          credentials: 'include', // HttpOnly Cookie 수신을 위해 필수
        })

        this.setAuth(response)
      }
      finally {
        this.isLoading = false
      }
    },

    /**
     * 회원가입
     * - credentials: 'include'로 HttpOnly Cookie(Refresh Token) 수신
     */
    async signup(data: SignupRequest): Promise<void> {
      const config = useRuntimeConfig()
      this.isLoading = true

      try {
        const response = await $fetch<AuthResponse>(`${config.public.apiBaseUrl}/auth/signup`, {
          method: 'POST',
          body: data,
          credentials: 'include', // HttpOnly Cookie 수신을 위해 필수
        })

        this.setAuth(response)
      }
      finally {
        this.isLoading = false
      }
    },

    /**
     * 로그아웃
     * - 서버에 로그아웃 요청하여 Refresh Token 무효화
     * - 프론트엔드 상태 초기화
     */
    async logout(): Promise<void> {
      const config = useRuntimeConfig()

      try {
        // 서버에 로그아웃 요청 (Refresh Token 무효화)
        await $fetch(`${config.public.apiBaseUrl}/auth/logout`, {
          method: 'POST',
          credentials: 'include', // HttpOnly Cookie 전송
        })
      }
      catch {
        // 서버 요청 실패해도 로컬 상태는 초기화
        console.warn('로그아웃 API 호출 실패')
      }

      // 프론트엔드 상태 초기화
      this.user = null
      this.accessToken = null

      // 쿠키에서 Access Token 제거
      const tokenCookie = useCookie('accessToken')
      tokenCookie.value = null

      // 로그인 페이지로 이동
      navigateTo('/auth/login')
    },

    /**
     * Access Token 갱신
     * - Refresh Token(HttpOnly Cookie)을 사용하여 새 Access Token 발급
     * - Token Rotation: 새 Refresh Token도 함께 발급됨
     */
    async refreshAccessToken(): Promise<boolean> {
      // 이미 갱신 중이면 중복 요청 방지
      if (this.isRefreshing) {
        return false
      }

      const config = useRuntimeConfig()
      this.isRefreshing = true

      try {
        const response = await $fetch<AuthResponse>(`${config.public.apiBaseUrl}/auth/refresh`, {
          method: 'POST',
          credentials: 'include', // HttpOnly Cookie(Refresh Token) 전송
        })

        this.setAuth(response)
        return true
      }
      catch {
        // Refresh Token도 만료되었거나 유효하지 않음
        // 전체 로그아웃 처리
        this.user = null
        this.accessToken = null
        const tokenCookie = useCookie('accessToken')
        tokenCookie.value = null
        return false
      }
      finally {
        this.isRefreshing = false
      }
    },

    /**
     * 인증 정보 설정
     */
    setAuth(response: AuthResponse): void {
      this.user = response.user
      this.accessToken = response.accessToken

      // 쿠키에 Access Token 저장 (15분 유지 - Access Token 만료 시간과 동일)
      const tokenCookie = useCookie('accessToken', {
        maxAge: 60 * 15, // 15분
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      })
      tokenCookie.value = response.accessToken
    },

    /**
     * 저장된 토큰으로 사용자 정보 복원
     * - Access Token 만료 시 자동으로 Refresh 시도
     */
    async restoreAuth(): Promise<void> {
      const tokenCookie = useCookie('accessToken')

      if (!tokenCookie.value) {
        // Access Token이 없으면 Refresh Token으로 갱신 시도
        const refreshed = await this.refreshAccessToken()
        if (!refreshed) {
          return
        }
      }

      const config = useRuntimeConfig()
      this.isLoading = true

      try {
        // 토큰으로 사용자 정보 조회
        const user = await $fetch<User>(`${config.public.apiBaseUrl}/auth/me`, {
          headers: {
            Authorization: `Bearer ${tokenCookie.value || this.accessToken}`,
          },
          credentials: 'include',
        })

        this.user = user
        this.accessToken = tokenCookie.value || this.accessToken
      }
      catch (error: unknown) {
        // 401 에러인 경우 토큰 갱신 시도
        if (error && typeof error === 'object' && 'statusCode' in error && (error as { statusCode: number }).statusCode === 401) {
          const refreshed = await this.refreshAccessToken()
          if (refreshed) {
            // 갱신 성공 시 재시도
            return this.restoreAuth()
          }
        }
        // 토큰이 유효하지 않으면 제거
        tokenCookie.value = null
        this.user = null
        this.accessToken = null
      }
      finally {
        this.isLoading = false
      }
    },
  },
})
