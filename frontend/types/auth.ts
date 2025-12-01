// 사용자 정보 타입
export interface User {
  id: string
  email: string
  name: string
  nickname: string | null
  avatarUrl: string | null
  bio: string | null
  role: 'USER' | 'ADMIN'
  techStack: string[]
  createdAt: string
  updatedAt: string
}

// 로그인 요청
export interface LoginRequest {
  email: string
  password: string
}

// 회원가입 요청
export interface SignupRequest {
  email: string
  password: string
  name: string
  nickname?: string
  techStack?: string[]
}

// 인증 응답
export interface AuthResponse {
  user: User
  accessToken: string
}

// API 에러 응답
export interface ApiError {
  statusCode: number
  message: string | string[]
  error?: string
}
