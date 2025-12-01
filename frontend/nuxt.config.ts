// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  // Modules
  modules: ['@nuxt/ui', '@pinia/nuxt'],
  devtools: { enabled: true },

  // App Config
  app: {
    head: {
      title: 'TechBuddy',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'IT 부트캠프 학생과 취준생을 위한 커뮤니티 플랫폼',
        },
      ],
    },
  },

  // CSS - Nuxt UI v4 requires explicit import
  css: ['~/assets/css/main.css'],

  // Runtime Config
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:8080',
      environment: process.env.NUXT_PUBLIC_ENVIRONMENT || 'development',
    },
  },

  // Route Rules
  routeRules: {
    // API routes with CORS
    '/api/**': { cors: true },
  },
  compatibilityDate: '2025-07-15',

  // TypeScript
  typescript: {
    strict: true,
    typeCheck: false, // MVP 단계에서는 빌드 속도 우선
  },
})
