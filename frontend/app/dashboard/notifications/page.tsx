"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  Info,
  AlertTriangle,
  CheckCircle,
  Megaphone,
  CheckCheck,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { announcementApi, type SystemAnnouncement } from "@/lib/api";
import { tFrontendAuto } from "@/lib/i18n/autoMessages";

const typeConfig = {
  info: {
    icon: Info,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  success: {
    icon: CheckCircle,
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
  },
  announcement: {
    icon: Megaphone,
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
  },
} as const;

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationsPage() {
  const [items, setItems] = useState<SystemAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState<string | null>(null);

  useEffect(() => {
    announcementApi
      .list({ page_size: 50 })
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const handleMarkRead = async (id: string) => {
    setMarkingId(id);
    try {
      await announcementApi.markRead(id);
      setItems((prev) =>
        prev.map((a) => (a.id === id ? { ...a, read: true } : a))
      );
    } catch {
      /* ignore */
    } finally {
      setMarkingId(null);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await announcementApi.markAllRead();
      setItems((prev) => prev.map((a) => ({ ...a, read: true })));
    } catch {
      /* ignore */
    }
  };

  const unreadCount = items.filter((a) => !a.read).length;
  const hasUnread = unreadCount > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Bell className="h-8 w-8 text-gray-600" />
          همه اعلانات
        </h1>
        {hasUnread && (
          <button
            onClick={handleMarkAllRead}
            className="btn-primary inline-flex items-center gap-2 w-fit"
          >
            <CheckCheck className="h-5 w-5" />
            خواندن همه ({unreadCount})
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
        </div>
      ) : items.length === 0 ? (
        <div className="card py-16 text-center">
          <Bell className="h-20 w-20 mx-auto mb-4 text-gray-200" />
          <p className="font-medium text-gray-600 text-lg">{tFrontendAuto("fe.7b09cca768c8")}</p>
          <p className="text-sm text-gray-500 mt-2">
            اعلان‌های مهم فروشگاه شما اینجا نمایش داده می‌شوند. لطفاً گاهی سر بزنید!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((a) => {
            const cfg =
              typeConfig[a.notification_type as keyof typeof typeConfig] ??
              typeConfig.info;
            const Icon = cfg.icon;
            return (
              <div
                key={a.id}
                className={`card p-4 ${!a.read ? "border-r-4 border-r-red-400" : ""}`}
              >
                <div className="flex gap-4">
                  <div
                    className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${cfg.bg} ${cfg.color}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-lg">{a.title}</p>
                    {a.message && (
                      <p className="text-sm text-gray-600 mt-2">{a.message}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 flex-wrap">
                      <span className="text-xs text-gray-400">
                        {formatDate(a.created_at)}
                      </span>
                      {!a.read && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                          خوانده نشده
                        </span>
                      )}
                      {a.link && (
                        <a
                          href={a.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <ExternalLink className="h-4 w-4" />
                          مشاهده
                        </a>
                      )}
                      {!a.read && (
                        <button
                          onClick={() => handleMarkRead(a.id)}
                          disabled={markingId === a.id}
                          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 disabled:opacity-50"
                        >
                          {markingId === a.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCheck className="h-4 w-4" />
                          )}
                          علامت به عنوان خوانده شده
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
  );
}
