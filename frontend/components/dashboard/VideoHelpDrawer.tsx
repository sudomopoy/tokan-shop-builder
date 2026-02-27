"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Video, Send, Bot, User, Pause, Maximize2, Minimize2 } from "lucide-react";
import { guideApi, type PageGuide } from "@/lib/api";

const DRAWER_WIDTH = 420;
const PIP_MIN = { w: 180, h: 120 };
const PIP_MAX = { w: 300, h: 200 };

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

type VideoPipState = {
  currentTime: number;
  paused: boolean;
};

function VideoPiP({
  videoUrl,
  savedState,
  onClose,
  onStop,
}: {
  videoUrl: string;
  savedState: VideoPipState;
  onClose: () => void;
  onStop: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [position, setPosition] = useState({ x: 16, y: 80 });
  const [size, setSize] = useState<"min" | "max">("min");
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, startX: 0, startY: 0 });

  const dims = size === "min" ? PIP_MIN : PIP_MAX;

  useEffect(() => {
    setPosition((p) => ({
      x: Math.max(8, Math.min(window.innerWidth - dims.w - 8, p.x)),
      y: Math.max(8, Math.min(window.innerHeight - dims.h - 8, p.y)),
    }));
  }, [size, dims.w, dims.h]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !savedState) return;
    v.currentTime = savedState.currentTime;
    if (!savedState.paused) v.play().catch(() => {});
  }, [savedState?.currentTime, savedState?.paused]);

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, startX: position.x, startY: position.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPosition({
      x: Math.max(8, Math.min(window.innerWidth - dims.w - 8, dragStart.current.startX + dx)),
      y: Math.max(8, Math.min(window.innerHeight - dims.h - 8, dragStart.current.startY + dy)),
    });
  };
  const onPointerUp = () => setIsDragging(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed z-50 flex flex-col overflow-hidden rounded-xl bg-gray-900 shadow-2xl border border-gray-700 select-none"
      style={{
        width: dims.w,
        height: dims.h,
        left: position.x,
        top: position.y,
        touchAction: "none",
      }}
    >
      <div
        className="h-7 shrink-0 bg-black/70 flex items-center justify-center cursor-grab active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <span className="text-white text-xs">ویدیو</span>
      </div>
      <video
        ref={videoRef}
        className="flex-1 min-h-0 w-full object-contain"
        src={videoUrl}
        controls
        playsInline
      />
      <div className="shrink-0 flex items-center justify-end gap-1 bg-black/60 px-2 py-1.5">
        <button
          onClick={() => {
            videoRef.current?.pause();
            onStop();
          }}
          className="p-1.5 rounded text-white hover:bg-white/20 active:bg-white/30"
          aria-label="توقف"
        >
          <Pause className="h-4 w-4" />
        </button>
        <button
          onClick={() => setSize((s) => (s === "min" ? "max" : "min"))}
          className="p-1.5 rounded text-white hover:bg-white/20 active:bg-white/30"
          aria-label={size === "min" ? "بزرگ" : "کوچک"}
        >
          {size === "min" ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
        </button>
        <button
          onClick={onClose}
          className="p-1.5 rounded text-white hover:bg-white/20 active:bg-white/30"
          aria-label="بستن"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

export default function VideoHelpDrawer({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const [guide, setGuide] = useState<PageGuide | null>(null);
  const [guideLoading, setGuideLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [pipMode, setPipMode] = useState(false);
  const [pipVideoState, setPipVideoState] = useState<VideoPipState | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    setIsMobile(mq.matches);
    const handler = () => setIsMobile(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setGuideLoading(true);
    guideApi
      .getGuideByPath(pathname || "/")
      .then((data) => {
        if (!cancelled) setGuide(data);
      })
      .finally(() => {
        if (!cancelled) setGuideLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname, isOpen]);

  const hasVideo =
    (isMobile ? guide?.video_mobile : guide?.video_desktop) ||
    (!isMobile && guide?.video_desktop) ||
    (isMobile && guide?.video_mobile);
  const videoUrl = isMobile
    ? (guide?.video_mobile || guide?.video_desktop)
    : (guide?.video_desktop || guide?.video_mobile);
  const hasDescription = Boolean(guide?.description?.trim());
  const showVideoSection = hasVideo || hasDescription;
  const showOnlyAI = !showVideoSection;

  const handleClose = useCallback(() => {
    if (isMobile && hasVideo && videoUrl) {
      const v = videoRef.current;
      if (v && !v.paused) {
        setPipVideoState({ currentTime: v.currentTime, paused: false });
        setPipMode(true);
      }
    }
    onClose();
  }, [isMobile, hasVideo, videoUrl, onClose]);

  const closePip = useCallback(() => {
    setPipMode(false);
    setPipVideoState(null);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed || isSending) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsSending(true);

    const history = chatMessages.map((m) => ({ role: m.role, content: m.content }));
    try {
      const res = await guideApi.chat(pathname || "/", trimmed, history);
      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: res.response,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const content =
        err?.limitExceeded && err?.message
          ? String(err.message)
          : "خطا در دریافت پاسخ. لطفاً دوباره امتحان کنید.";
      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, aiMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const drawerContent = (
    <div className="flex h-full w-full flex-col bg-white">
      <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <Video className="h-5 w-5 text-blue-600" />
          <h2 className="font-bold text-gray-800">
            {showOnlyAI ? "سوال از هوش مصنوعی" : "راهنمای این صفحه"}
          </h2>
        </div>
        <button
          onClick={handleClose}
          className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
          aria-label="بستن"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto min-h-0">
        {showVideoSection && (
          <div className="shrink-0 border-b border-gray-100 p-4">
            {guideLoading ? (
              <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-gray-100">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              </div>
            ) : (
              <>
                {hasVideo && videoUrl && (
                  <div className="aspect-video w-full overflow-hidden rounded-lg bg-gray-900">
                    <video
                      ref={videoRef}
                      key={pathname + (videoUrl || "")}
                      className="h-full w-full object-contain"
                      controls
                      playsInline
                      preload="metadata"
                      poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9' fill='%23374151'%3E%3Crect width='16' height='9'/%3E%3C/svg%3E"
                    >
                      <source src={videoUrl} type="video/mp4" />
                      مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
                    </video>
                  </div>
                )}
                {hasDescription && (
                  <div className={hasVideo ? "mt-4" : ""}>
                    <h3 className="mb-2 text-sm font-semibold text-gray-700">توضیحات</h3>
                    <p className="text-sm leading-relaxed text-gray-600">{guide?.description}</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <div className="flex flex-1 flex-col border-t border-gray-100">
          <div className="flex shrink-0 items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3">
            <Bot className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">سوال از هوش مصنوعی</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px]">
            {chatMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bot className="mb-3 h-12 w-12 text-gray-300" />
                <p className="text-sm text-gray-500">سوال خود را درباره این بخش بپرسید</p>
                <p className="mt-1 text-xs text-gray-400">
                  پاسخ بر اساس مستندات راهنما تولید می‌شود
                </p>
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
                  <Bot className="h-4 w-4 animate-pulse" />
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
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                disabled={isSending}
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isSending}
                className="flex items-center justify-center rounded-lg bg-blue-600 px-4 text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: left drawer | Mobile: bottom sheet - single content to preserve state */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <>
            {isMobile ? (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-40 bg-black/40 lg:hidden"
                  onClick={handleClose}
                />
                <motion.div
                  key="mobile-drawer"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
                  className="fixed inset-x-0 bottom-0 top-1/4 z-50 flex flex-col rounded-t-2xl bg-white shadow-2xl lg:hidden overflow-hidden"
                >
                  {drawerContent}
                </motion.div>
              </>
            ) : (
              <motion.div
                key="desktop-drawer"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: DRAWER_WIDTH, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:flex-col lg:overflow-hidden"
              >
                <div className="flex h-full w-full flex-col bg-white border-r border-gray-200 shadow-xl">
                  {drawerContent}
                </div>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>

      {/* PiP video - mobile only, when drawer closed with video playing */}
      <AnimatePresence>
        {pipMode && isMobile && videoUrl && pipVideoState && (
          <VideoPiP
            videoUrl={videoUrl}
            savedState={pipVideoState}
            onClose={closePip}
            onStop={closePip}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export { DRAWER_WIDTH };
