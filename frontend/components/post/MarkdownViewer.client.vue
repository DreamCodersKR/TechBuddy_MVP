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
  color: hsl(var(--foreground));
  font-size: 1rem;
  line-height: 1.7;
}

.toastui-editor-contents p {
  margin: 0.75em 0;
}

.toastui-editor-contents h1,
.toastui-editor-contents h2,
.toastui-editor-contents h3 {
  color: hsl(var(--foreground));
  border-bottom: 1px solid hsl(var(--border));
  padding-bottom: 0.3em;
}

.toastui-editor-contents blockquote {
  border-left: 4px solid hsl(var(--border));
  color: hsl(var(--muted-foreground));
  padding-left: 1em;
}

.toastui-editor-contents pre {
  background-color: hsl(var(--muted));
  border-radius: calc(var(--radius) - 2px);
}

.toastui-editor-contents code {
  background-color: hsl(var(--muted));
  color: hsl(var(--foreground));
  border-radius: 3px;
  padding: 0.1em 0.3em;
}

.toastui-editor-contents a {
  color: hsl(var(--primary));
}
</style>
