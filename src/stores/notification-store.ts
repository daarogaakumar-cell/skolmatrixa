import { create } from "zustand";
import { getUnreadCount } from "@/actions/notifications";

interface NotificationState {
  unreadCount: number;
  polling: boolean;
  fetchUnreadCount: () => Promise<void>;
  startPolling: () => () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  unreadCount: 0,
  polling: false,

  fetchUnreadCount: async () => {
    try {
      const result = await getUnreadCount();
      if (result.success) {
        set({ unreadCount: result.data });
      }
    } catch {
      // Silently fail
    }
  },

  startPolling: () => {
    if (get().polling) return () => {};
    set({ polling: true });

    // Initial fetch
    get().fetchUnreadCount();

    const interval = setInterval(() => {
      get().fetchUnreadCount();
    }, 30000); // Poll every 30 seconds

    return () => {
      clearInterval(interval);
      set({ polling: false });
    };
  },
}));
