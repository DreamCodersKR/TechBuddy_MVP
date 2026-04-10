export function useCoffeeChat() {
  const { get: authGet, post: authPost, patch: authPatch } = useAuthFetch()

  async function requestChat(receiverId: string, message: string) {
    return authPost<any>('/coffee-chat', { receiverId, message })
  }

  async function listChats(role?: 'sent' | 'received') {
    const query = role ? `?role=${role}` : ''
    return authGet<any[]>(`/coffee-chat${query}`)
  }

  async function acceptChat(id: string, meetingUrl?: string) {
    return authPatch<any>(`/coffee-chat/${id}/accept`, { meetingUrl })
  }

  async function declineChat(id: string) {
    return authPatch<any>(`/coffee-chat/${id}/decline`, {})
  }

  async function cancelChat(id: string) {
    return authPatch<any>(`/coffee-chat/${id}/cancel`, {})
  }

  return { requestChat, listChats, acceptChat, declineChat, cancelChat }
}
