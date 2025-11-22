<template>
  <div class="min-h-screen bg-background">
    <!-- Navigation Bar -->
    <nav class="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center gap-8">
            <span class="text-xl font-bold text-foreground">TechBuddy</span>
            <div class="hidden md:flex items-center gap-6">
              <a
                href="#"
                class="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                커뮤니티
              </a>
              <a
                href="#"
                class="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                교육기관
              </a>
              <a
                href="#"
                class="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                멘토링
              </a>
              <a
                href="#"
                class="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                프로젝트
              </a>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <button class="px-4 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors">
              로그인
            </button>
            <button class="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors">
              회원가입
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
      <div class="max-w-4xl mx-auto text-center space-y-8">
        <h1 class="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-balance">
          IT 부트캠프 학생을 위한 <span class="text-emerald-600">성장 플랫폼</span>
        </h1>
        <p class="text-lg sm:text-xl text-muted-foreground">
          커뮤니티 · 멘토링 · 프로젝트 관리
        </p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button class="w-full sm:w-auto px-6 py-3 text-base font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors">
            무료로 시작하기
          </button>
          <button class="w-full sm:w-auto px-6 py-3 text-base font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md transition-colors">
            둘러보기
          </button>
        </div>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 pt-8 text-sm text-muted-foreground">
          <div class="flex items-center gap-2">
            <span class="font-semibold text-foreground">300+</span>
            <span>활성 사용자</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="font-semibold text-foreground">50+</span>
            <span>진행 중인 프로젝트</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="font-semibold text-foreground">10+</span>
            <span>인증 멘토</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        <!-- Feature Card 1 -->
        <div class="transition-all duration-300 hover:shadow-lg border border-border bg-card text-card-foreground rounded-lg">
          <div class="p-6 space-y-4">
            <div class="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <MessageSquare
                :size="24"
                class="text-emerald-600"
              />
            </div>
            <h3 class="text-xl font-semibold text-foreground">
              주제별 커뮤니티
            </h3>
            <p class="text-muted-foreground leading-relaxed">
              자유게시판, 프로젝트 구인, 취업/진로별 맞춤 정보 공유
            </p>
          </div>
        </div>

        <!-- Feature Card 2 -->
        <div class="transition-all duration-300 hover:shadow-lg border border-border bg-card text-card-foreground rounded-lg">
          <div class="p-6 space-y-4">
            <div class="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Users
                :size="24"
                class="text-emerald-600"
              />
            </div>
            <h3 class="text-xl font-semibold text-foreground">
              멘토링 매칭
            </h3>
            <p class="text-muted-foreground leading-relaxed">
              시니어 개발자와 1:1 실시간 채팅으로 성장하세요
            </p>
          </div>
        </div>

        <!-- Feature Card 3 -->
        <div class="transition-all duration-300 hover:shadow-lg border border-border bg-card text-card-foreground rounded-lg">
          <div class="p-6 space-y-4">
            <div class="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Folder
                :size="24"
                class="text-emerald-600"
              />
            </div>
            <h3 class="text-xl font-semibold text-foreground">
              초보자용 프로젝트 관리
            </h3>
            <p class="text-muted-foreground leading-relaxed">
              쉬운 칸반보드와 Help 상태로 막힌 부분 즉시 해결
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works Section -->
    <section class="container mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-muted/30">
      <div class="max-w-4xl mx-auto space-y-12">
        <h2 class="text-3xl sm:text-4xl font-bold text-center text-foreground">
          시작하는 방법
        </h2>
        <div class="space-y-8">
          <div class="flex gap-6 items-start">
            <div class="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
              <span class="text-lg font-bold text-white">1</span>
            </div>
            <div class="space-y-2 pt-2">
              <h3 class="text-xl font-semibold text-foreground">
                회원가입
              </h3>
              <p class="text-muted-foreground leading-relaxed">
                이메일 또는 소셜 로그인으로 간편하게 시작
              </p>
            </div>
          </div>

          <div class="flex gap-6 items-start">
            <div class="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
              <span class="text-lg font-bold text-white">2</span>
            </div>
            <div class="space-y-2 pt-2">
              <h3 class="text-xl font-semibold text-foreground">
                커뮤니티 참여
              </h3>
              <p class="text-muted-foreground leading-relaxed">
                게시판에서 정보 공유하고 멘토 찾기
              </p>
            </div>
          </div>

          <div class="flex gap-6 items-start">
            <div class="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
              <span class="text-lg font-bold text-white">3</span>
            </div>
            <div class="space-y-2 pt-2">
              <h3 class="text-xl font-semibold text-foreground">
                프로젝트 시작
              </h3>
              <p class="text-muted-foreground leading-relaxed">
                팀을 구성하고 프로젝트를 체계적으로 관리
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Trusted By Section -->
    <section class="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div class="max-w-4xl mx-auto space-y-8">
        <h2 class="text-2xl font-semibold text-center text-foreground">
          파트너 교육기관
        </h2>
        <div class="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
          <span class="text-lg text-muted-foreground">스마트인재개발원</span>
          <span class="text-lg text-muted-foreground">코드스테이츠</span>
          <span class="text-lg text-muted-foreground">엘리스</span>
          <span class="text-lg text-muted-foreground">제로베이스</span>
        </div>
      </div>
    </section>

    <!-- Final CTA Section -->
    <section class="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div class="max-w-4xl mx-auto bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
        <div class="p-12 text-center space-y-6">
          <h2 class="text-3xl sm:text-4xl font-bold text-foreground">
            지금 바로 시작하세요
          </h2>
          <p class="text-lg text-muted-foreground">
            300명의 개발자가 함께 성장하고 있습니다
          </p>
          <button class="px-6 py-3 text-base font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors">
            무료로 시작하기
          </button>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-border">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="flex flex-col md:flex-row items-center justify-between gap-6">
          <div class="text-center md:text-left">
            <span class="text-lg font-bold text-foreground">TechBuddy</span>
            <p class="text-sm text-muted-foreground mt-1">
              IT 부트캠프 학생을 위한 성장 플랫폼
            </p>
          </div>
          <div class="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <a
              href="#"
              class="hover:text-foreground transition-colors"
            >
              서비스 소개
            </a>
            <a
              href="#"
              class="hover:text-foreground transition-colors"
            >
              이용약관
            </a>
            <a
              href="#"
              class="hover:text-foreground transition-colors"
            >
              개인정보처리방침
            </a>
            <a
              href="#"
              class="hover:text-foreground transition-colors"
            >
              문의하기
            </a>
          </div>
        </div>
        <div class="text-center mt-8 text-sm text-muted-foreground">
          © 2025 TechBuddy. All rights reserved.
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { MessageSquare, Users, Folder } from 'lucide-vue-next'

useHead({
  title: 'TechBuddy - IT 부트캠프 학생을 위한 성장 플랫폼',
  meta: [
    {
      name: 'description',
      content: '커뮤니티, 멘토링, 프로젝트 관리를 통해 IT 부트캠프 학생과 주니어 개발자가 함께 성장하는 플랫폼',
    },
  ],
})
</script>
