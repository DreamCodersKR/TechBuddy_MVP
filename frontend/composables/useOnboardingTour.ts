export function useOnboardingTour() {
  const authStore = useAuthStore()
  const { patch: authPatch } = useAuthFetch()

  async function startTour() {
    const { driver } = await import('driver.js')
    await import('driver.js/dist/driver.css')

    const driverObj = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      nextBtnText: '다음',
      prevBtnText: '이전',
      doneBtnText: '시작하기',
      progressText: '{{current}} / {{total}}',
      popoverClass: 'flowit-onboarding',
      steps: [
        {
          popover: {
            title: 'FLOWIT에 오신 것을 환영합니다!',
            description: 'IT 프로젝트 팀을 위한 올인원 플랫폼입니다. 주요 기능을 안내해드릴게요.',
          },
        },
        {
          element: '[data-onboarding="nav-community"]',
          popover: {
            title: '커뮤니티',
            description: '자유 게시판, 취업/진로 이야기 등 다양한 주제로 소통할 수 있어요.',
          },
        },
        {
          element: '[data-onboarding="nav-project"]',
          popover: {
            title: '프로젝트',
            description: '팀원 모집, 칸반보드, 스프린트 등 PM 도구를 무료로 사용하세요.',
          },
        },
        {
          element: '[data-onboarding="nav-ai"]',
          popover: {
            title: 'FLOWIT AI',
            description: 'Claude, GPT, Gemini 등 다양한 AI 멘토에게 코드, 설계, 기획을 질문해보세요.',
          },
        },
        {
          element: '[data-onboarding="nav-profile"]',
          popover: {
            title: '프로필 설정',
            description: '프로필을 완성하면 팀원 매칭과 포트폴리오 생성에 활용됩니다.',
            side: 'left' as const,
          },
        },
        {
          popover: {
            title: '준비 완료!',
            description: '이제 FLOWIT을 자유롭게 탐험해보세요. 설정에서 투어를 다시 볼 수 있어요.',
          },
        },
      ],
      onDestroyStarted: async () => {
        driverObj.destroy()
        try {
          await authPatch('/users/me/onboarding', {})
          if (authStore.currentUser) {
            authStore.currentUser.onboardingCompleted = true
          }
        }
        catch { /* 실패해도 투어는 닫힘 */ }
      },
    })

    driverObj.drive()
  }

  function shouldShowTour(): boolean {
    if (!authStore.currentUser) return false
    return !authStore.currentUser.onboardingCompleted
  }

  return { startTour, shouldShowTour }
}
