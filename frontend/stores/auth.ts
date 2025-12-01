import { defineStore } from 'pinia'
import type { User, LoginRequest, SignupRequest, AuthResponse } from '~/types/auth'

interface AuthState {
  user: User | null
  accessToken: string | null
  isLoading: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    accessToken: null,
    isLoading: false,
  }),

  getters: {
    isAuthenticated: (state): boolean => !!state.accessToken && !!state.user,
    currentUser: (state): User | null => state.user,
  },

  actions: {
    /**
     * 로그인
     */
    async login(credentials: LoginRequest): Promise<void> {
      const config = useRuntimeConfig()
      this.isLoading = true

      try {
        const response = await $fetch<AuthResponse>(`${config.public.apiBaseUrl}/auth/login`, {
          method: 'POST',
          body: credentials,
        })

        this.setAuth(response)
      }
      finally {
        this.isLoading = false
      }
    },

    /**
     * 회원가입
     */
    async signup(data: SignupRequest): Promise<void> {
      const config = useRuntimeConfig()
      this.isLoading = true

      try {
        const response = await $fetch<AuthResponse>(`${config.public.apiBaseUrl}/auth/signup`, {
          method: 'POST',
          body: data,
        })

        this.setAuth(response)
      }
      finally {
        this.isLoading = false
      }
    },

    /**
     * 로그아웃
     */
    logout(): void {
      this.user = null
      this.accessToken = null

      // 쿠키에서 토큰 제거
      const tokenCookie = useCookie('accessToken')
      tokenCookie.value = null

      // 로그인 페이지로 이동
      navigateTo('/auth/login')
    },

    /**
     * 인증 정보 설정
     */
    setAuth(response: AuthResponse): void {
      this.user = response.user
      this.accessToken = response.accessToken

      // 쿠키에 토큰 저장 (7일 유지)
      const tokenCookie = useCookie('accessToken', {
        maxAge: 60 * 60 * 24 * 7,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      })
      tokenCookie.value = response.accessToken
    },

    /**
     * 저장된 토큰으로 사용자 정보 복원
     */
    async restoreAuth(): Promise<void> {
      const tokenCookie = useCookie('accessToken')

      if (!tokenCookie.value) {
        return
      }

      const config = useRuntimeConfig()
      this.isLoading = true

      try {
        // 토큰으로 사용자 정보 조회
        const user = await $fetch<User>(`${config.public.apiBaseUrl}/auth/me`, {
          headers: {
            Authorization: `Bearer ${tokenCookie.value}`,
          },
        })

        this.user = user
        this.accessToken = tokenCookie.value
      }
      catch {
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
