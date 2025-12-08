<script setup lang="ts">
// 랜딩 페이지 - 비로그인 상태 서비스 소개

useHead({
  title: 'TechBuddy - IT 부트캠프 학생 커뮤니티',
  meta: [
    {
      name: 'description',
      content: 'IT 부트캠프 학생과 취준생을 위한 커뮤니티 기반 성장 플랫폼',
    },
  ],
})
</script>

<template>
  <div class="min-h-screen bg-gray-950 text-white">
    <!-- Header -->
    <header class="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
      <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <!-- Logo -->
        <NuxtLink to="/" class="text-xl font-bold">
          TechBuddy
        </NuxtLink>

        <!-- Navigation -->
        <nav class="hidden md:flex items-center gap-8">
          <a href="#community" class="text-gray-400 hover:text-white transition-colors">
            커뮤니티
          </a>
          <a href="#project" class="text-gray-400 hover:text-white transition-colors">
            프로젝트
          </a>
          <span class="text-gray-600 cursor-not-allowed flex items-center gap-1">
            멘토링
            <span class="text-xs px-1.5 py-0.5 bg-gray-800 rounded text-gray-500">Coming Soon</span>
          </span>
          <NuxtLink to="/about" class="text-gray-400 hover:text-white transition-colors">
            소개
          </NuxtLink>
        </nav>

        <!-- CTA -->
        <div class="flex items-center gap-4">
          <NuxtLink
            to="/auth/login"
            class="hidden sm:block text-gray-400 hover:text-white transition-colors"
          >
            로그인
          </NuxtLink>
          <NuxtLink
            to="/auth/signup"
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition-colors"
          >
            시작하기
          </NuxtLink>
        </div>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="pt-32 pb-20 px-6">
      <div class="max-w-4xl mx-auto text-center">
        <h1 class="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          TechBuddy
        </h1>
        <p class="text-2xl md:text-3xl text-gray-300 mb-4">
          IT인들을 위한 커뮤니티
        </p>
        <p class="text-lg text-gray-500 mb-10">
          인사이트 공유, 프로젝트 관리, 멘토링까지
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <NuxtLink
            to="/auth/signup"
            class="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold text-lg transition-colors"
          >
            시작하기
          </NuxtLink>
          <NuxtLink
            to="/about"
            class="px-8 py-4 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold text-lg transition-colors"
          >
            자세히 보기
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Community Section -->
    <section id="community" class="py-20 px-6 bg-gray-900/50">
      <div class="max-w-6xl mx-auto">
        <div class="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 class="text-3xl md:text-4xl font-bold mb-4">
              커뮤니티
            </h2>
            <p class="text-xl text-gray-400 mb-6">
              인사이트를 나누고, 네트워크를 넓히세요
            </p>
            <ul class="space-y-3 text-gray-300">
              <li class="flex items-center gap-3">
                <span class="w-6 h-6 rounded-full bg-indigo-600/20 flex items-center justify-center">
                  <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
                </span>
                자유롭게 정보 공유
              </li>
              <li class="flex items-center gap-3">
                <span class="w-6 h-6 rounded-full bg-indigo-600/20 flex items-center justify-center">
                  <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
                </span>
                프로젝트 팀원 모집
              </li>
              <li class="flex items-center gap-3">
                <span class="w-6 h-6 rounded-full bg-indigo-600/20 flex items-center justify-center">
                  <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
                </span>
                취업/진로 상담
              </li>
            </ul>
          </div>
          <div class="bg-gray-800 rounded-2xl p-8 border border-gray-700">
            <div class="space-y-4">
              <div class="h-4 bg-gray-700 rounded w-3/4"></div>
              <div class="h-4 bg-gray-700 rounded w-1/2"></div>
              <div class="h-20 bg-gray-700/50 rounded mt-4"></div>
              <div class="flex gap-2 mt-4">
                <div class="h-8 w-16 bg-indigo-600/30 rounded"></div>
                <div class="h-8 w-16 bg-gray-700 rounded"></div>
              </div>
            </div>
            <p class="text-center text-gray-500 mt-4 text-sm">앱 스크린샷 (개발 후 추가)</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Project Section -->
    <section id="project" class="py-20 px-6">
      <div class="max-w-6xl mx-auto">
        <div class="grid md:grid-cols-2 gap-12 items-center">
          <div class="order-2 md:order-1 bg-gray-800 rounded-2xl p-8 border border-gray-700">
            <div class="space-y-4">
              <div class="flex gap-4">
                <div class="flex-1 bg-gray-700/50 rounded p-3">
                  <div class="text-xs text-gray-500 mb-2">Todo</div>
                  <div class="h-12 bg-gray-600/50 rounded mb-2"></div>
                  <div class="h-12 bg-gray-600/50 rounded"></div>
                </div>
                <div class="flex-1 bg-gray-700/50 rounded p-3">
                  <div class="text-xs text-gray-500 mb-2">In Progress</div>
                  <div class="h-12 bg-indigo-600/30 rounded"></div>
                </div>
                <div class="flex-1 bg-gray-700/50 rounded p-3">
                  <div class="text-xs text-gray-500 mb-2">Done</div>
                  <div class="h-12 bg-green-600/30 rounded"></div>
                </div>
              </div>
            </div>
            <p class="text-center text-gray-500 mt-4 text-sm">앱 스크린샷 (개발 후 추가)</p>
          </div>
          <div class="order-1 md:order-2">
            <h2 class="text-3xl md:text-4xl font-bold mb-4">
              프로젝트
            </h2>
            <p class="text-xl text-gray-400 mb-6">
              팀을 구성하고 함께 만들어가세요
            </p>
            <ul class="space-y-3 text-gray-300">
              <li class="flex items-center gap-3">
                <span class="w-6 h-6 rounded-full bg-indigo-600/20 flex items-center justify-center">
                  <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
                </span>
                칸반 보드로 태스크 관리
              </li>
              <li class="flex items-center gap-3">
                <span class="w-6 h-6 rounded-full bg-indigo-600/20 flex items-center justify-center">
                  <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
                </span>
                팀원 초대 및 역할 관리
              </li>
              <li class="flex items-center gap-3">
                <span class="w-6 h-6 rounded-full bg-indigo-600/20 flex items-center justify-center">
                  <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
                </span>
                실시간 협업
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Mentoring Section (Coming Soon) -->
    <section id="mentoring" class="py-20 px-6 bg-gray-900/50">
      <div class="max-w-6xl mx-auto">
        <div class="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div class="flex items-center gap-3 mb-4">
              <h2 class="text-3xl md:text-4xl font-bold">
                멘토링
              </h2>
              <span class="px-3 py-1 bg-indigo-600/20 text-indigo-400 rounded-full text-sm font-medium">
                Coming Soon
              </span>
            </div>
            <p class="text-xl text-gray-400 mb-6">
              현직자에게 조언을 받아보세요
            </p>
            <ul class="space-y-3 text-gray-300">
              <li class="flex items-center gap-3">
                <span class="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center">
                  <span class="w-2 h-2 rounded-full bg-gray-500"></span>
                </span>
                1:1 멘토링 매칭
              </li>
              <li class="flex items-center gap-3">
                <span class="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center">
                  <span class="w-2 h-2 rounded-full bg-gray-500"></span>
                </span>
                커리어 상담
              </li>
              <li class="flex items-center gap-3">
                <span class="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center">
                  <span class="w-2 h-2 rounded-full bg-gray-500"></span>
                </span>
                이력서/포트폴리오 피드백
              </li>
            </ul>
          </div>
          <div class="bg-gray-800/50 rounded-2xl p-8 border border-gray-700/50">
            <div class="text-center py-12">
              <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-700 flex items-center justify-center">
                <svg class="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <p class="text-gray-500">준비 중입니다</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="py-12 px-6 border-t border-gray-800">
      <div class="max-w-6xl mx-auto">
        <div class="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 class="text-lg font-bold mb-4">TechBuddy</h3>
            <p class="text-gray-500 text-sm">
              IT 부트캠프 학생과 취준생을 위한<br />
              커뮤니티 기반 성장 플랫폼
            </p>
          </div>
          <div>
            <h4 class="font-semibold mb-4 text-gray-300">서비스</h4>
            <ul class="space-y-2 text-gray-500 text-sm">
              <li><a href="#community" class="hover:text-white transition-colors">커뮤니티</a></li>
              <li><a href="#project" class="hover:text-white transition-colors">프로젝트</a></li>
              <li><span class="text-gray-600">멘토링 (Coming Soon)</span></li>
            </ul>
          </div>
          <div>
            <h4 class="font-semibold mb-4 text-gray-300">소개</h4>
            <ul class="space-y-2 text-gray-500 text-sm">
              <li><NuxtLink to="/about" class="hover:text-white transition-colors">TechBuddy 소개</NuxtLink></li>
            </ul>
          </div>
        </div>
        <div class="pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
          &copy; 2024 TechBuddy. All rights reserved.
        </div>
      </div>
    </footer>
  </div>
</template>
