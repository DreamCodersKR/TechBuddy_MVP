// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  // Modules
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt', 'shadcn-nuxt'],

  // Tailwind CSS
  tailwindcss: {
    cssPath: './assets/css/main.css',
    configPath: 'tailwind.config.js',
  },
  devtools: { enabled: true },

  // App Config
  app: {
    head: {
      title: 'FLOWIT',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'IT 부트캠프 수료생과 취업 준비생을 위한 커뮤니티·협업 플랫폼. 팀 빌딩, 프로젝트 관리, AI 멘토링까지 한 곳에서.' },
        // OG (Open Graph)
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'FLOWIT' },
        { property: 'og:title', content: 'FLOWIT - IT 부트캠프 커뮤니티·협업 플랫폼' },
        { property: 'og:description', content: 'IT 부트캠프 수료생과 취업 준비생을 위한 커뮤니티·협업 플랫폼. 팀 빌딩, 프로젝트 관리, AI 멘토링까지 한 곳에서.' },
        { property: 'og:image', content: '/og-image.svg' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        // Twitter Card
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'FLOWIT - IT 부트캠프 커뮤니티·협업 플랫폼' },
        { name: 'twitter:description', content: 'IT 부트캠프 수료생과 취업 준비생을 위한 커뮤니티·협업 플랫폼.' },
        { name: 'twitter:image', content: '/og-image.svg' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      ],
    },
  },

  // CSS (handled by @nuxtjs/tailwindcss)
  css: [],

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

  // Shadcn-vue Configuration
  shadcn: {
    prefix: '',
    componentDir: './components/ui',
  },
})