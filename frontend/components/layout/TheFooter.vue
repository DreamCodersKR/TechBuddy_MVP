<script setup lang="ts">
</script>

<template>
  <footer class="border-t border-border bg-muted/30">
    <div class="container py-8">
      <!-- Company Info -->
      <div class="text-sm text-muted-foreground space-y-1">
        <p class="font-medium text-foreground">Copyright © FLOWIT. All Rights Reserved.</p>
        <p>사업자등록번호: 000-00-00000 | 대표: 000</p>
        <p>서울특별시 성북구 고려대로24길 32 5층</p>
        <p>전화: 010-0000-0000</p>
        <p>Email: contact@flowit.kr</p>
      </div>

      <!-- Footer Links -->
      <div class="mt-4 flex items-center gap-4 text-sm">
        <NuxtLink
          to="/terms"
          class="text-muted-foreground hover:text-foreground transition-colors"
        >
          이용약관
        </NuxtLink>
        <NuxtLink
          to="/privacy"
          class="text-muted-foreground hover:text-foreground transition-colors"
        >
          개인정보처리방침
        </NuxtLink>
      </div>
    </div>
  </footer>
</template>
