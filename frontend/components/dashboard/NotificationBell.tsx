"use client";

import { useState, useEffect, useRef } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Info,
  AlertTriangle,
  CheckCircle,
  Megaphone,
  Loader2,
  X,
} from "lucide-react";
import { announcementApi, type SystemAnnouncement } from "@/lib/api";
import { tFrontendAuto } from "@/lib/i18n/autoMessages";

const typeConfig = {
  info: { icon: Info, color: "text-blue-600", bg: "bg-blue-50" },
  warning: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
  success: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
  announcement: { icon: Megaphone, color: "text-violet-600", bg: "bg-violet-50" },
} as const;

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return "اکنون";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} دقیقه پیش`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} ساعت پیش`;
  return d.toLocaleDateString("fa-IR");
}

export function NotificationBell({ variant = "light" }: { variant?: "light" | "dark" } = {}) {
  const isDark = variant === "dark";
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<SystemAnnouncement[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    try {
      const [list, count] = await Promise.all([
        announcementApi.list({ page_size: 10 }),
        announcementApi.unreadCount(),
      ]);
      setItems(list);
      setUnreadCount(count);
    } catch {
      setItems([]);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [open]);

  const handleMarkRead = async (id: string) => {
    try {
      await announcementApi.markRead(id);
      setItems((prev) =>
        prev.map((a) => (a.id === id ? { ...a, read: true } : a))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      /* ignore */
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await announcementApi.markAllRead();
      setItems((prev) => prev.map((a) => ({ ...a, read: true })));
      setUnreadCount(0);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`relative p-2 rounded-lg transition-colors ${
          unreadCount > 0
            ? isDark
              ? "!text-red-300 hover:!text-red-200 hover:bg-white/10"
              : "!text-red-600 hover:!text-red-700 hover:bg-red-50"
            : isDark
              ? "text-white/80 hover:text-white hover:bg-white/10"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        }`}
        title={unreadCount > 0 ? `${unreadCount} اعلان خوانده نشده` : "اعلانات"}
      >
        <Bell
          className={`h-5 w-5 ${unreadCount > 0 ? "animate-notification-blink" : ""}`}
          style={unreadCount > 0 && !isDark ? { color: "#dc2626" } : undefined}
        />
        {unreadCount > 0 && (
          <span
            className={`absolute -top-0.5 -right-0.5 flex h-5 w-5 min-w-5 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-md ring-2 animate-notification-blink ${isDark ? "bg-red-400 ring-blue-600" : "ring-white"}`}
            style={!isDark ? { backgroundColor: "#dc2626" } : undefined}
          >
            {unreadCount > 99 ? "99+" : unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-96 max-h-[420px] bg-white rounded-xl shadow-xl border border-gray-200 z-50 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">{tFrontendAuto("fe.29e0cf131788")}</h3>
            {items.some((a) => !a.read) && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <CheckCheck className="h-4 w-4" />
                خواندن همه
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : items.length === 0 ? (
              <div className="py-8 px-4 text-center text-gray-500 text-sm">
                <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                اعلانی برای نمایش وجود ندارد.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {items.map((a) => {
                  const cfg = typeConfig[a.notification_type] ?? typeConfig.info;
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={a.id}
                      className={`px-4 py-3 hover:bg-gray-50 transition-colors ${
                        !a.read ? "bg-blue-50/50" : ""
                      }`}
                    >
                      <div className="flex gap-3">
                        <div
                          className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${cfg.bg} ${cfg.color}`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm">
                            {a.title}
                          </p>
                          {a.message && (
                            <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                              {a.message}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-gray-400">
                              {formatTime(a.created_at)}
                            </span>
                            {!a.read && (
                              <button
                                onClick={() => handleMarkRead(a.id)}
                                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
                              >
                                <Check className="h-3 w-3" />
                                خواندم
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
