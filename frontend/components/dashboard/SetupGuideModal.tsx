"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Video, Send, Bot, User } from "lucide-react";
import { guideApi, type PageGuide } from "@/lib/api";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export default function SetupGuideModal({
  isOpen,
  onClose,
  guidePath,
  title,
}: {
  isOpen: boolean;
  onClose: () => void;
  guidePath: string;
  title: string;
}) {
  const [guide, setGuide] = useState<PageGuide | null>(null);
  const [loading, setLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !guidePath) return;
    let cancelled = false;
    setLoading(true);
    setGuide(null);
    setChatMessages([]);
    guideApi
      .getGuideByPath(guidePath)
      .then((data) => {
        if (!cancelled) setGuide(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [isOpen, guidePath]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const hasVideo = !!(guide?.video_desktop || guide?.video_mobile);
  const videoUrl = guide?.video_desktop || guide?.video_mobile;
  const hasDescription = Boolean(guide?.description?.trim());
  const showVideoSection = hasVideo || hasDescription;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed || isSending) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsSending(true);

    const history = chatMessages.map((m) => ({ role: m.role, content: m.content }));
    try {
      const res = await guideApi.chat(guidePath, trimmed, history);
      setChatMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: res.response },
      ]);
    } catch (err: any) {
      const content =
        err?.limitExceeded && err?.message
          ? String(err.message)
          : "خطا در دریافت پاسخ. لطفاً دوباره امتحان کنید.";
      setChatMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        >
          <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Video className="h-5 w-5 text-blue-600" />
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-200 hover:text-gray-700"
              aria-label="بستن"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
            {showVideoSection && (
              <div className="shrink-0 border-b border-gray-100 p-6">
                {loading ? (
                  <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-gray-100">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                  </div>
                ) : (
                  <>
                    {hasVideo && videoUrl && (
                      <div className="aspect-video w-full overflow-hidden rounded-lg bg-gray-900">
                        <video
                          key={guidePath + videoUrl}
                          className="h-full w-full object-contain"
                          controls
                          playsInline
                          preload="metadata"
                        >
                          <source src={videoUrl} type="video/mp4" />
                          مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
                        </video>
                      </div>
                    )}
                    {hasDescription && (
                      <div className={hasVideo ? "mt-4" : ""}>
                        <h3 className="mb-2 text-sm font-semibold text-gray-700">توضیحات</h3>
                        <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-wrap">{guide?.description}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <div className="flex flex-1 flex-col border-t border-gray-100 min-h-[200px]">
              <div className="flex shrink-0 items-center gap-2 border-b border-gray-100 bg-gray-50 px-6 py-3">
                <Bot className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-800">سوال از هوش مصنوعی</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {chatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Bot className="mb-3 h-12 w-12 text-gray-300" />
                    <p className="text-sm text-gray-500">سوال خود را درباره این مرحله بپرسید</p>
                  </div>
                ) : (
                  chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          msg.role === "user" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                      </div>
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                          msg.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))
                )}
                {isSending && (
                  <div className="flex gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                      <Bot className="h-5 w-5 animate-pulse" />
                    </div>
                    <div className="rounded-2xl bg-gray-100 px-4 py-2 text-sm text-gray-500">
                      در حال پردازش...
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className="shrink-0 border-t border-gray-200 bg-white p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="سوال خود را بنویسید..."
                    className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    disabled={isSending}
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || isSending}
                    className="flex items-center justify-center rounded-lg bg-blue-600 px-4 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
