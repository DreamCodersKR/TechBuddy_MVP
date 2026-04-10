export interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  relatedId?: string
  createdAt: string
  sender?: {
    id: string
    name: string
    nickname: string
    avatarUrl?: string
  }
}

const TYPE_ICON: Record<string, string> = {
  COMMENT_ADDED: 'heroicons:chat-bubble-left',
  AGORA_ANSWERED: 'heroicons:chat-bubble-oval-left-ellipsis',
  AGORA_ACCEPTED: 'heroicons:check-badge',
  CREDIT_RECEIVED: 'heroicons:currency-dollar',
  TASK_ASSIGNED: 'heroicons:clipboard-document-list',
  TASK_STATUS_CHANGED: 'heroicons:arrow-path',
  HELP_REQUESTED: 'heroicons:question-mark-circle',
  COFFEE_CHAT_REQUESTED: 'heroicons:chat-bubble-left-right',
  COFFEE_CHAT_ACCEPTED: 'heroicons:check-circle',
  COFFEE_CHAT_DECLINED: 'heroicons:x-circle',
}

const TYPE_ROUTE: Record<string, (relatedId?: string) => string> = {
  COMMENT_ADDED: (id) => (id ? `/community/${id}` : '/community'),
  AGORA_ANSWERED: (id) => (id ? `/agora/${id}` : '/agora'),
  AGORA_ACCEPTED: (id) => (id ? `/agora/${id}` : '/agora'),
  CREDIT_RECEIVED: () => '/mypage',
  TASK_ASSIGNED: () => '/workspaces',
  TASK_STATUS_CHANGED: () => '/workspaces',
  HELP_REQUESTED: () => '/workspaces',
  COFFEE_CHAT_REQUESTED: () => '/coffee-chat',
  COFFEE_CHAT_ACCEPTED: () => '/coffee-chat',
  COFFEE_CHAT_DECLINED: () => '/coffee-chat',
}

export function useNotifications() {
  const authStore = useAuthStore()
  const { authFetch } = useAuthFetch()

  const notifications = ref<Notification[]>([])
  const unreadCount = ref(0)
  const loading = ref(false)
  let pollingTimer: ReturnType<typeof setInterval> | null = null

  const getIcon = (type: string) => TYPE_ICON[type] ?? 'heroicons:bell'
  const getRoute = (type: string, relatedId?: string) =>
    TYPE_ROUTE[type]?.(relatedId) ?? '/'

  async function fetchUnreadCount() {
    if (!authStore.isAuthenticated) return
    try {
      const res = await authFetch<{ count: number }>('/notifications/unread-count')
      unreadCount.value = res.count ?? 0
    } catch {}
  }

  async function fetchNotifications() {
    if (!authStore.isAuthenticated) return
    loading.value = true
    try {
      const res = await authFetch<{ data: Notification[]; meta: { unreadCount: number } }>('/notifications?limit=20')
      notifications.value = res.data ?? []
      unreadCount.value = res.meta?.unreadCount ?? 0
    } catch {
    } finally {
      loading.value = false
    }
  }

  async function markAsRead(id: string) {
    try {
      await authFetch(`/notifications/${id}/read`, { method: 'PATCH' })
      const n = notifications.value.find((n) => n.id === id)
      if (n && !n.isRead) {
        n.isRead = true
        unreadCount.value = Math.max(0, unreadCount.value - 1)
      }
    } catch {}
  }

  async function markAllAsRead() {
    try {
      await authFetch('/notifications/read-all', { method: 'PATCH' })
      notifications.value.forEach((n) => (n.isRead = true))
      unreadCount.value = 0
    } catch {}
  }

  function startPolling() {
    stopPolling()
    pollingTimer = setInterval(fetchUnreadCount, 30_000)
  }

  function stopPolling() {
    if (pollingTimer) {
      clearInterval(pollingTimer)
      pollingTimer = null
    }
  }

  onMounted(() => {
    if (authStore.isAuthenticated) {
      fetchUnreadCount()
      startPolling()
    }
  })

  onUnmounted(() => stopPolling())

  return {
    notifications,
    unreadCount,
    loading,
    getIcon,
    getRoute,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
  }
}
