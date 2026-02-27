import { apiClient } from "./apiClient";

export type PageGuide = {
  id: string;
  path: string;
  video_desktop?: string | null;
  video_mobile?: string | null;
  description?: string | null;
};

export type ChatRequest = {
  message: string;
  path: string;
  conversation_history?: Array<{ role: "user" | "assistant"; content: string }>;
};

export type ChatResponse = {
  response: string;
  success: boolean;
};

export const guideApi = {
  /**
   * Get page guide by path (video, description for dashboard pages)
   */
  async getGuideByPath(path: string): Promise<PageGuide | null> {
    try {
      const { data } = await apiClient.get<PageGuide | null>(
        "/guide/guide-by-path/",
        { params: { path } }
      );
      return data ?? null;
    } catch {
      return null;
    }
  },

  /**
   * Chat with AI guide (RAG-based)
   * On 429 (limit exceeded), throws with limitExceeded: true and response message.
   */
  async chat(
    path: string,
    message: string,
    conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>
  ): Promise<ChatResponse> {
    try {
      const { data } = await apiClient.post<ChatResponse & { limit_exceeded?: boolean }>(
        "/guide/chat/",
        {
          message,
          path,
          conversation_history: conversationHistory ?? [],
        }
      );
      return data;
    } catch (err: any) {
      const res = err?.response?.data;
      if (err?.response?.status === 429 && res?.limit_exceeded && res?.response) {
        const e = new Error(res.response) as Error & { limitExceeded?: boolean };
        e.limitExceeded = true;
        throw e;
      }
      throw err;
    }
  },
};
