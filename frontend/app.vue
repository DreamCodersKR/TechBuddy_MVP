<script setup lang="ts">
useHead({
  htmlAttrs: { lang: 'ko' },
  meta: [
    { name: 'description', content: 'IT 부트캠프 수료생을 위한 커뮤니티 + PM툴 + AI 멘토링' },
    { property: 'og:site_name', content: 'FLOWIT' },
    { property: 'og:type', content: 'website' },
    { property: 'og:image', content: 'https://flowit.co/og-default.png' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ],
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
