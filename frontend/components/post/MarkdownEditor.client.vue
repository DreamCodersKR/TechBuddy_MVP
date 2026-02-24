<script setup lang="ts">
import '@toast-ui/editor/dist/toastui-editor.css'
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'

interface Props {
  modelValue?: string
  height?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  height: '500px',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const editorEl = ref<HTMLElement | null>(null)
let editorInstance: any = null
let editorReady = false

onMounted(async () => {
  const { default: Editor } = await import('@toast-ui/editor')

  editorInstance = new Editor({
    el: editorEl.value!,
    height: props.height,
    initialValue: props.modelValue,
    initialEditType: 'wysiwyg',
    previewStyle: 'vertical',
    toolbarItems: [
      ['heading', 'bold', 'italic', 'strike'],
      ['hr', 'quote'],
      ['ul', 'ol', 'task'],
      ['table', 'link'],
      ['code', 'codeblock'],
    ],
    events: {
      change: () => {
        emit('update:modelValue', editorInstance.getMarkdown())
      },
    },
  })

  editorReady = true
})

onBeforeUnmount(() => {
  editorInstance?.destroy()
  editorInstance = null
})

// edit 페이지: 비동기로 로드된 초기값 반영
watch(
  () => props.modelValue,
  (newVal) => {
    if (!editorReady || !editorInstance) return
    if (newVal !== editorInstance.getMarkdown()) {
      editorInstance.setMarkdown(newVal || '')
    }
  },
)
</script>

<template>
  <div class="markdown-editor-wrapper">
    <div ref="editorEl" />
  </div>
</template>

<style>
.toastui-editor-defaultUI {
  border: 1px solid hsl(var(--border));
  border-radius: calc(var(--radius) - 2px);
  font-family: inherit;
}

.toastui-editor-toolbar {
  background-color: hsl(var(--muted));
  border-bottom: 1px solid hsl(var(--border));
}

.toastui-editor-md-container,
.toastui-editor-ww-container {
  background-color: hsl(var(--background));
}

.toastui-editor-contents {
  color: hsl(var(--foreground));
}

.ProseMirror {
  color: hsl(var(--foreground));
}
</style>
