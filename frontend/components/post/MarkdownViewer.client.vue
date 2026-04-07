<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue'

interface Props {
  content?: string
}

const props = withDefaults(defineProps<Props>(), {
  content: '',
})

const viewerEl = ref<HTMLElement | null>(null)
let viewerInstance: any = null

function injectCopyButtons() {
  if (!viewerEl.value) return
  const preElements = viewerEl.value.querySelectorAll<HTMLElement>('.toastui-editor-contents pre')
  preElements.forEach((pre) => {
    if (pre.querySelector('.copy-code-btn')) return
    pre.style.position = 'relative'

    const btn = document.createElement('button')
    btn.className = 'copy-code-btn'
    btn.setAttribute('aria-label', '코드 복사')
    btn.textContent = '복사'

    btn.addEventListener('click', async (e: Event) => {
      e.stopPropagation()
      const code = pre.querySelector('code')?.textContent ?? ''
      try {
        await navigator.clipboard.writeText(code)
        btn.textContent = '복사됨 ✓'
        setTimeout(() => { btn.textContent = '복사' }, 2000)
      } catch {
        btn.textContent = '실패'
        setTimeout(() => { btn.textContent = '복사' }, 2000)
      }
    })

    pre.appendChild(btn)
  })
}

onMounted(async () => {
  const { default: Viewer } = await import('@toast-ui/editor/dist/toastui-editor-viewer')
  await import('@toast-ui/editor/dist/toastui-editor-viewer.css')

  viewerInstance = new Viewer({
    el: viewerEl.value!,
    initialValue: props.content,
  })
  await nextTick()
  injectCopyButtons()
})

onBeforeUnmount(() => {
  viewerInstance?.destroy()
  viewerInstance = null
})

watch(
  () => props.content,
  async (newVal) => {
    if (!viewerInstance) return
    viewerInstance.setMarkdown(newVal || '')
    await nextTick()
    injectCopyButtons()
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

/* 테이블 */
.toastui-editor-contents table {
  border-collapse: collapse !important;
  width: 100% !important;
}

.toastui-editor-contents table th {
  background-color: hsl(var(--muted)) !important;
  color: hsl(var(--foreground)) !important;
  border: 1px solid hsl(var(--border)) !important;
  padding: 0.5em 1em !important;
}

.toastui-editor-contents table td {
  background-color: transparent !important;
  color: hsl(var(--foreground)) !important;
  border: 1px solid hsl(var(--border)) !important;
  padding: 0.5em 1em !important;
}

.toastui-editor-contents table tr {
  background-color: transparent !important;
}

.toastui-editor-contents table tr:nth-child(even) td {
  background-color: hsl(var(--muted) / 0.4) !important;
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

/* 코드블록 복사 버튼 */
.copy-code-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 3px 8px;
  font-size: 11px;
  font-family: inherit;
  border: 1px solid rgba(128, 128, 128, 0.3);
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.45);
  color: #e0e0e0;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
  line-height: 1.4;
  white-space: nowrap;
  z-index: 1;
}

.toastui-editor-contents pre:hover .copy-code-btn {
  opacity: 1;
}

.markdown-viewer-wrapper .toastui-editor-main,
.markdown-viewer-wrapper .toastui-editor-defaultUI {
  background-color: transparent !important;
  border: none !important;
}

/* ===== 다크모드 전용: --border와 --muted가 배경색과 동일해 안 보이는 문제 해결 ===== */

/* h2/h3 제목 구분선 */
.dark .toastui-editor-contents h1,
.dark .toastui-editor-contents h2,
.dark .toastui-editor-contents h3,
.dark .toastui-editor-contents h4 {
  border-bottom-color: rgba(255, 255, 255, 0.12) !important;
}

/* 인용구 좌측 선 */
.dark .toastui-editor-contents blockquote {
  border-left-color: rgba(255, 255, 255, 0.2) !important;
}

/* 코드 블록 테두리 */
.dark .toastui-editor-contents pre {
  background-color: rgba(0, 0, 0, 0.35) !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
}

/* 테이블 테두리 */
.dark .toastui-editor-contents table th {
  background-color: rgba(255, 255, 255, 0.08) !important;
  border-color: rgba(255, 255, 255, 0.15) !important;
}

.dark .toastui-editor-contents table td {
  border-color: rgba(255, 255, 255, 0.1) !important;
}

.dark .toastui-editor-contents table tr:nth-child(even) td {
  background-color: rgba(255, 255, 255, 0.04) !important;
}
</style>
