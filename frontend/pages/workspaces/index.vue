<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'

definePageMeta({ layout: 'default', middleware: 'auth' })
useHead({ title: '워크스페이스 - FLOWIT' })

const { get: authGet } = useAuthFetch()

interface Workspace {
  id: string
  name: string
  type: 'PROJECT' | 'STUDY'
  description: string | null
  techStack: string[]
  status: string
  createdAt: string
  members: { role: string, user: { id: string, nickname: string | null, avatarUrl: string | null } }[]
  _count?: { tasks: number, members: number }
}

const workspaces = ref<Workspace[]>([])
const loading = ref(true)
const tab = ref<'ALL' | 'PROJECT' | 'STUDY'>('ALL')

async function loadWorkspaces() {
  loading.value = true
  try {
    const res = await authGet<{ data: Workspace[], meta: { total: number } }>('/workspaces?limit=50')
    workspaces.value = res.data
  }
  catch { workspaces.value = [] }
  finally { loading.value = false }
}

const filtered = computed(() =>
  tab.value === 'ALL' ? workspaces.value : workspaces.value.filter(w => w.type === tab.value),
)

onMounted(() => { loadWorkspaces() })
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- 헤더 -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-foreground">
          워크스페이스
        </h1>
        <p class="text-muted-foreground text-sm mt-1">
          참여 중인 프로젝트와 스터디를 확인하세요
        </p>
      </div>
      <Button @click="navigateTo('/workspaces/new')">
        <Icon
          icon="heroicons:plus"
          class="w-4 h-4 mr-2"
        />
        새 워크스페이스
      </Button>
    </div>

    <!-- 탭 -->
    <nav class="flex gap-1 mb-6">
      <button
        v-for="t in [{ label: '전체', value: 'ALL' }, { label: '프로젝트', value: 'PROJECT' }, { label: '스터디', value: 'STUDY' }]"
        :key="t.value"
        class="px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
        :class="tab === t.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent'"
        @click="tab = t.value as typeof tab"
      >
        {{ t.label }}
      </button>
    </nav>

    <!-- 로딩 -->
    <template v-if="loading">
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="n in 3"
          :key="n"
          class="border border-border rounded-xl p-5 space-y-3"
        >
          <div class="h-4 bg-muted animate-pulse rounded w-1/3" />
          <div class="h-5 bg-muted animate-pulse rounded w-3/4" />
          <div class="h-3 bg-muted animate-pulse rounded w-1/2" />
        </div>
      </div>
    </template>

    <!-- 목록 -->
    <template v-else-if="filtered.length > 0">
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="ws in filtered"
          :key="ws.id"
          class="border border-border rounded-xl p-5 hover:bg-accent/30 cursor-pointer transition-colors group"
          @click="navigateTo(`/workspaces/${ws.id}`)"
        >
          <!-- 타입 뱃지 -->
          <div class="flex items-center justify-between mb-3">
            <span
              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
              :class="ws.type === 'PROJECT'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'"
            >
              {{ ws.type === 'PROJECT' ? '프로젝트' : '스터디' }}
            </span>
            <span
              class="text-xs font-medium px-2 py-0.5 rounded"
              :class="ws.status === 'ACTIVE'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'text-muted-foreground bg-muted'"
            >
              {{ ws.status === 'ACTIVE' ? '진행중' : ws.status === 'COMPLETED' ? '완료' : '보관됨' }}
            </span>
          </div>

          <!-- 이름 + 설명 -->
          <h3 class="font-semibold text-foreground mb-1 line-clamp-1">
            {{ ws.name }}
          </h3>
          <p class="text-xs text-muted-foreground line-clamp-2 mb-4 min-h-[2rem]">
            {{ ws.description || '설명이 없습니다.' }}
          </p>

          <!-- 기술 스택 -->
          <div
            v-if="ws.techStack.length > 0"
            class="flex flex-wrap gap-1 mb-3"
          >
            <span
              v-for="tech in ws.techStack.slice(0, 3)"
              :key="tech"
              class="inline-block px-1.5 py-0.5 text-xs rounded bg-secondary text-secondary-foreground"
            >
              {{ tech }}
            </span>
            <span
              v-if="ws.techStack.length > 3"
              class="text-xs text-muted-foreground self-center"
            >
              +{{ ws.techStack.length - 3 }}
            </span>
          </div>

          <!-- 멤버 아바타 -->
          <div class="flex items-center justify-between">
            <div class="flex -space-x-2">
              <div
                v-for="m in ws.members.slice(0, 4)"
                :key="m.user.id"
                class="h-7 w-7 rounded-full border-2 border-card bg-muted flex items-center justify-center text-xs font-medium overflow-hidden"
              >
                <img
                  v-if="m.user.avatarUrl"
                  :src="m.user.avatarUrl"
                  :alt="m.user.nickname ?? ''"
                  class="h-full w-full object-cover"
                >
                <span v-else>{{ (m.user.nickname ?? '?').slice(0, 1) }}</span>
              </div>
              <div
                v-if="ws.members.length > 4"
                class="h-7 w-7 rounded-full border-2 border-card bg-muted flex items-center justify-center text-xs text-muted-foreground"
              >
                +{{ ws.members.length - 4 }}
              </div>
            </div>
            <Icon
              icon="heroicons:arrow-right"
              class="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </div>
        </div>
      </div>
    </template>

    <!-- 빈 상태 -->
    <div
      v-else
      class="flex flex-col items-center justify-center py-20 text-center"
    >
      <Icon
        icon="heroicons:folder-plus"
        class="w-12 h-12 text-muted-foreground mb-4"
      />
      <h2 class="text-lg font-semibold text-foreground mb-2">
        {{ tab === 'ALL' ? '아직 워크스페이스가 없어요' : `${tab === 'PROJECT' ? '프로젝트' : '스터디'}가 없어요` }}
      </h2>
      <p class="text-muted-foreground text-sm mb-4">
        팀원을 모집하거나 새 워크스페이스를 만들어보세요
      </p>
      <Button @click="navigateTo('/workspaces/new')">
        <Icon
          icon="heroicons:plus"
          class="w-4 h-4 mr-2"
        />
        새 워크스페이스 만들기
      </Button>
    </div>
  </div>
</template>
