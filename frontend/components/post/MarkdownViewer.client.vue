<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'

interface Props {
  content?: string
}

const props = withDefaults(defineProps<Props>(), {
  content: '',
})

const viewerEl = ref<HTMLElement | null>(null)
let viewerInstance: any = null

onMounted(async () => {
  const { default: Viewer } = await import('@toast-ui/editor/dist/toastui-editor-viewer')
  await import('@toast-ui/editor/dist/toastui-editor-viewer.css')

  viewerInstance = new Viewer({
    el: viewerEl.value!,
    initialValue: props.content,
  })
})

onBeforeUnmount(() => {
  viewerInstance?.destroy()
  viewerInstance = null
})

watch(
  () => props.content,
  (newVal) => {
    if (!viewerInstance) return
    viewerInstance.setMarkdown(newVal || '')
  },
)
</script>

<template>
  <div class="markdown-viewer-wrapper">
    <div ref="viewerEl" />
  </div>
</template>

<style>
.toastui-editor-contents {
  color: hsl(var(--foreground)) !important;
  font-size: 1rem;
  line-height: 1.7;
  background-color: transparent !important;
}

.toastui-editor-contents p {
  margin: 0.75em 0;
  color: hsl(var(--foreground)) !important;
}

.toastui-editor-contents h1,
.toastui-editor-contents h2,
.toastui-editor-contents h3,
.toastui-editor-contents h4,
.toastui-editor-contents h5,
.toastui-editor-contents h6 {
  color: hsl(var(--foreground)) !important;
  border-bottom: 1px solid hsl(var(--border)) !important;
  padding-bottom: 0.3em;
  background-color: transparent !important;
}

.toastui-editor-contents blockquote {
  border-left: 4px solid hsl(var(--border)) !important;
  color: hsl(var(--muted-foreground)) !important;
  padding-left: 1em;
  background-color: transparent !important;
}

/* 코드 블록 (```로 감싼 블록) */
.toastui-editor-contents pre {
  background-color: hsl(var(--muted)) !important;
  border-radius: calc(var(--radius) - 2px) !important;
  border: 1px solid hsl(var(--border)) !important;
}

.toastui-editor-contents pre code {
  background-color: transparent !important;
  color: hsl(var(--foreground)) !important;
  padding: 0 !important;
  border: none !important;
}

/* 인라인 코드 (`code`) */
.toastui-editor-contents code {
  background-color: hsl(var(--muted)) !important;
  color: hsl(var(--foreground)) !important;
  border-radius: 3px !important;
  padding: 0.1em 0.3em !important;
  border: none !important;
}

.toastui-editor-contents a {
  color: hsl(var(--primary)) !important;
}

.toastui-editor-contents li {
  color: hsl(var(--foreground)) !important;
}

.toastui-editor-contents strong,
.toastui-editor-contents em {
  color: hsl(var(--foreground)) !important;
}

/* toast-ui 내부 wrapper 배경 제거 */
.toastui-editor-contents .toastui-editor-ww-code-block {
  background-color: hsl(var(--muted)) !important;
}

.markdown-viewer-wrapper .toastui-editor-main,
.markdown-viewer-wrapper .toastui-editor-defaultUI {
  background-color: transparent !important;
  border: none !important;
}
</style>
