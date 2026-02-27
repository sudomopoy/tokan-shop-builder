import { apiClient } from "./apiClient";

export type SystemAnnouncement = {
  id: string;
  title: string;
  message: string;
  notification_type: "info" | "warning" | "success" | "announcement";
  source: string;
  link: string;
  created_at: string;
  read: boolean;
  read_at: string | null;
};

export const announcementApi = {
  async list(params?: { page_size?: number }): Promise<SystemAnnouncement[]> {
    const { data } = await apiClient.get<SystemAnnouncement[] | { results: SystemAnnouncement[] }>(
      "/announcement/",
      { params: params ?? { page_size: 20 } }
    );
    return Array.isArray(data) ? data : (data?.results ?? []);
  },

  async unreadCount(): Promise<number> {
    const { data } = await apiClient.get<{ count: number }>("/announcement/unread_count/");
    return data?.count ?? 0;
  },

  async markRead(id: string): Promise<void> {
    await apiClient.post(`/announcement/${id}/mark_read/`);
  },

  async markAllRead(): Promise<void> {
    await apiClient.post("/announcement/mark_all_read/");
  },
};
