<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

definePageMeta({ layout: "default", middleware: "auth" });
useHead({ title: "커피챗 - FLOWIT" });

const authStore = useAuthStore();
const { listChats, acceptChat, declineChat, cancelChat } = useCoffeeChat();

// ─── 탭 상태 ──────────────────────────────────────────────
type TabType = "received" | "sent";
const activeTab = ref<TabType>("received");

// ─── 데이터 ──────────────────────────────────────────────
const chats = ref<any[]>([]);
const loading = ref(false);
const error = ref("");

async function fetchChats() {
  loading.value = true;
  error.value = "";
  try {
    const res = await listChats(activeTab.value);
    chats.value = (res as any)?.data ?? res ?? [];
  } catch (e: any) {
    error.value = e?.data?.message || "커피챗 목록을 불러오는데 실패했습니다.";
  } finally {
    loading.value = false;
  }
}

watch(activeTab, () => fetchChats());
onMounted(() => fetchChats());

// ─── 수락 모달 ─────────────────────────────────────────
const acceptDialogOpen = ref(false);
const acceptTargetId = ref("");
const acceptMeetingUrl = ref("");
const acceptLoading = ref(false);

function openAcceptDialog(chatId: string) {
  acceptTargetId.value = chatId;
  acceptMeetingUrl.value = "";
  acceptDialogOpen.value = true;
}

async function handleAccept() {
  acceptLoading.value = true;
  try {
    await acceptChat(acceptTargetId.value, acceptMeetingUrl.value || undefined);
    acceptDialogOpen.value = false;
    await fetchChats();
  } catch (e: any) {
    alert(e?.data?.message || "수락에 실패했습니다.");
  } finally {
    acceptLoading.value = false;
  }
}

// ─── 거절 ──────────────────────────────────────────────
const actionLoading = ref<string | null>(null);

async function handleDecline(chatId: string) {
  actionLoading.value = chatId;
  try {
    await declineChat(chatId);
    await fetchChats();
  } catch (e: any) {
    alert(e?.data?.message || "거절에 실패했습니다.");
  } finally {
    actionLoading.value = null;
  }
}

// ─── 취소 ──────────────────────────────────────────────
async function handleCancel(chatId: string) {
  actionLoading.value = chatId;
  try {
    await cancelChat(chatId);
    await fetchChats();
  } catch (e: any) {
    alert(e?.data?.message || "취소에 실패했습니다.");
  } finally {
    actionLoading.value = null;
  }
}

// ─── 유틸리티 ───────────────────────────────────────────
function formatRelativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING: "대기중",
    ACCEPTED: "수락됨",
    DECLINED: "거절됨",
    CANCELLED: "취소됨",
  };
  return labels[status] ?? status;
}

function getStatusClasses(status: string) {
  const classes: Record<string, string> = {
    PENDING:
      "border-yellow-500/50 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
    ACCEPTED:
      "border-green-500/50 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400",
    DECLINED:
      "border-red-500/50 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
    CANCELLED:
      "border-gray-500/50 bg-gray-50 text-gray-500 dark:bg-gray-900/20 dark:text-gray-400",
  };
  return classes[status] ?? "";
}

/**
 * 현재 탭 기준 상대방 정보를 반환
 */
function getOtherUser(chat: any) {
  return activeTab.value === "received" ? chat.requester : chat.receiver;
}

function getUserInitials(user: any) {
  if (!user?.nickname) return "?";
  return user.nickname.slice(0, 2).toUpperCase();
}
</script>

<template>
  <div class="max-w-2xl px-4 py-8 mx-auto">
    <!-- 페이지 헤더 -->
    <div class="flex items-center gap-3 mb-6">
      <div
        class="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10"
      >
        <Icon
          icon="heroicons:chat-bubble-left-right"
          class="w-5 h-5 text-primary"
        />
      </div>
      <div>
        <h1 class="text-xl font-bold text-foreground">커피챗</h1>
        <p class="text-sm text-muted-foreground">
          다른 사용자와 1:1 대화를 나눠보세요
        </p>
      </div>
    </div>

    <!-- 탭 -->
    <div class="flex mb-6 border-b border-border">
      <button
        class="px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px"
        :class="
          activeTab === 'received'
            ? 'border-primary text-foreground'
            : 'border-transparent text-muted-foreground hover:text-foreground'
        "
        @click="activeTab = 'received'"
      >
        <Icon
          icon="heroicons:inbox-arrow-down"
          class="w-4 h-4 mr-1.5 inline-block align-text-bottom"
        />
        받은 요청
      </button>
      <button
        class="px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px"
        :class="
          activeTab === 'sent'
            ? 'border-primary text-foreground'
            : 'border-transparent text-muted-foreground hover:text-foreground'
        "
        @click="activeTab = 'sent'"
      >
        <Icon
          icon="heroicons:paper-airplane"
          class="w-4 h-4 mr-1.5 inline-block align-text-bottom"
        />
        보낸 요청
      </button>
    </div>

    <!-- 로딩 -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <Icon
        icon="heroicons:arrow-path"
        class="w-6 h-6 animate-spin text-muted-foreground"
      />
    </div>

    <!-- 에러 -->
    <div v-else-if="error" class="py-16 text-center">
      <Icon
        icon="heroicons:exclamation-triangle"
        class="w-8 h-8 mx-auto mb-2 text-destructive"
      />
      <p class="text-sm text-destructive">{{ error }}</p>
      <Button variant="outline" size="sm" class="mt-4" @click="fetchChats">
        다시 시도
      </Button>
    </div>

    <!-- 빈 상태 -->
    <div v-else-if="chats.length === 0" class="py-16 text-center">
      <div
        class="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-muted"
      >
        <Icon
          icon="heroicons:chat-bubble-left-right"
          class="w-8 h-8 text-muted-foreground"
        />
      </div>
      <p class="text-sm text-muted-foreground">
        {{
          activeTab === "received"
            ? "아직 받은 커피챗 요청이 없습니다"
            : "아직 보낸 커피챗 요청이 없습니다"
        }}
      </p>
      <p class="mt-1 text-xs text-muted-foreground">
        {{
          activeTab === "sent"
            ? "다른 사용자의 포트폴리오에서 커피챗을 요청해보세요"
            : "다른 사용자가 커피챗을 요청하면 여기에 표시됩니다"
        }}
      </p>
    </div>

    <!-- 커피챗 카드 리스트 -->
    <div v-else class="space-y-3">
      <div
        v-for="chat in chats"
        :key="chat.id"
        class="p-4 transition-colors border border-border rounded-xl bg-card"
        :class="{
          'opacity-60':
            chat.status === 'DECLINED' || chat.status === 'CANCELLED',
        }"
      >
        <!-- 상단: 사용자 정보 + 상태 뱃지 -->
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center min-w-0 gap-3">
            <Avatar class="flex-shrink-0 w-10 h-10">
              <AvatarImage :src="getOtherUser(chat)?.avatarUrl ?? undefined" />
              <AvatarFallback>{{
                getUserInitials(getOtherUser(chat))
              }}</AvatarFallback>
            </Avatar>
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-sm font-semibold truncate text-foreground">
                  {{ getOtherUser(chat)?.nickname ?? "알 수 없음" }}
                </span>
                <span
                  class="inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full border"
                  :class="getStatusClasses(chat.status)"
                >
                  {{ getStatusLabel(chat.status) }}
                </span>
              </div>
              <!-- 기술 스택 태그 -->
              <div
                v-if="getOtherUser(chat)?.techStack?.length"
                class="flex flex-wrap gap-1 mt-1"
              >
                <span
                  v-for="tech in getOtherUser(chat).techStack.slice(0, 4)"
                  :key="tech"
                  class="px-1.5 py-0.5 text-[10px] rounded bg-muted text-muted-foreground"
                >
                  {{ tech }}
                </span>
                <span
                  v-if="getOtherUser(chat).techStack.length > 4"
                  class="px-1.5 py-0.5 text-[10px] rounded bg-muted text-muted-foreground"
                >
                  +{{ getOtherUser(chat).techStack.length - 4 }}
                </span>
              </div>
            </div>
          </div>
          <span
            class="text-[11px] text-muted-foreground whitespace-nowrap flex-shrink-0"
          >
            {{ formatRelativeTime(chat.createdAt) }}
          </span>
        </div>

        <!-- 메시지 (PENDING일 때만 표시) -->
        <div v-if="chat.status === 'PENDING' && chat.message" class="mt-3">
          <p class="text-sm italic leading-relaxed text-muted-foreground">
            "{{ chat.message }}"
          </p>
        </div>

        <!-- 미팅 링크 (ACCEPTED일 때) -->
        <div v-if="chat.status === 'ACCEPTED' && chat.meetingUrl" class="mt-3">
          <div
            class="flex items-center gap-2 px-3 py-2 border border-green-200 rounded-md bg-green-50 dark:bg-green-900/20 dark:border-green-800"
          >
            <Icon
              icon="heroicons:link"
              class="flex-shrink-0 w-4 h-4 text-green-600 dark:text-green-400"
            />
            <a
              :href="chat.meetingUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="text-sm text-green-700 truncate dark:text-green-400 hover:underline"
            >
              {{ chat.meetingUrl }}
            </a>
          </div>
        </div>

        <!-- 액션 버튼 -->
        <div class="flex items-center gap-2 mt-3">
          <!-- 받은 요청 + PENDING: 수락/거절 -->
          <template
            v-if="activeTab === 'received' && chat.status === 'PENDING'"
          >
            <Button
              size="sm"
              class="h-8"
              :disabled="actionLoading === chat.id"
              @click="openAcceptDialog(chat.id)"
            >
              <Icon icon="heroicons:check" class="w-3.5 h-3.5 mr-1" />
              수락
            </Button>
            <Button
              variant="outline"
              size="sm"
              class="h-8"
              :disabled="actionLoading === chat.id"
              @click="handleDecline(chat.id)"
            >
              <Icon
                v-if="actionLoading === chat.id"
                icon="heroicons:arrow-path"
                class="w-3.5 h-3.5 mr-1 animate-spin"
              />
              <Icon v-else icon="heroicons:x-mark" class="w-3.5 h-3.5 mr-1" />
              거절
            </Button>
          </template>

          <!-- 보낸 요청 + PENDING: 취소 -->
          <template v-if="activeTab === 'sent' && chat.status === 'PENDING'">
            <Button
              variant="outline"
              size="sm"
              class="h-8"
              :disabled="actionLoading === chat.id"
              @click="handleCancel(chat.id)"
            >
              <Icon
                v-if="actionLoading === chat.id"
                icon="heroicons:arrow-path"
                class="w-3.5 h-3.5 mr-1 animate-spin"
              />
              <Icon v-else icon="heroicons:x-mark" class="w-3.5 h-3.5 mr-1" />
              취소
            </Button>
          </template>
        </div>
      </div>
    </div>

    <!-- 수락 다이얼로그 (미팅 URL 입력) -->
    <Dialog
      :open="acceptDialogOpen"
      @update:open="(v) => (acceptDialogOpen = v)"
    >
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>커피챗 수락</DialogTitle>
          <DialogDescription>
            미팅 링크를 입력하면 상대방에게 공유됩니다. (선택사항)
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-3">
          <div>
            <label class="block mb-1 text-xs text-muted-foreground"
              >미팅 링크 (선택)</label
            >
            <Input
              v-model="acceptMeetingUrl"
              placeholder="https://meet.google.com/... 또는 https://zoom.us/..."
              class="h-9"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            :disabled="acceptLoading"
            @click="acceptDialogOpen = false"
          >
            취소
          </Button>
          <Button :disabled="acceptLoading" @click="handleAccept">
            <Icon
              v-if="acceptLoading"
              icon="heroicons:arrow-path"
              class="w-4 h-4 mr-2 animate-spin"
            />
            수락하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
