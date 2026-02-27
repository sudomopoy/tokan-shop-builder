"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  Info,
  AlertTriangle,
  CheckCircle,
  Megaphone,
  CheckCheck,
  Loader2,
  ExternalLink,
  ChevronLeft,
} from "lucide-react";
import { announcementApi, type SystemAnnouncement } from "@/lib/api";

const typeConfig = {
  info: { icon: Info, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
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

export function DashboardNotificationsSection() {
  const [items, setItems] = useState<SystemAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState<string | null>(null);

  useEffect(() => {
    announcementApi
      .list({ page_size: 20 })
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

  const unreadItems = items.filter((a) => !a.read);
  const unreadCount = unreadItems.length;
  const hasUnread = unreadCount > 0;

  return (
    <section className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Bell className="h-5 w-5 text-gray-600" />
          اعلانات سیستم
        </h2>
        <div className="flex items-center gap-3">
          {hasUnread && (
            <button
              onClick={handleMarkAllRead}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <CheckCheck className="h-4 w-4" />
              خواندن همه ({unreadCount})
            </button>
          )}
          <Link
            href="/dashboard/notifications"
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            همه اعلانات
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center text-gray-500">
          <Bell className="h-16 w-16 mx-auto mb-4 text-gray-200" />
          <p className="font-medium text-gray-600">اعلانی برای نمایش وجود ندارد</p>
          <p className="text-sm mt-1">
            اعلان‌های مهم فروشگاه شما اینجا نمایش داده می‌شوند. لطفاً گاهی سر بزنید!
          </p>
          <Link
            href="/dashboard/notifications"
            className="btn-secondary inline-flex items-center gap-2 mt-4"
          >
            <Bell className="h-4 w-4" />
            صفحه همه اعلانات
          </Link>
        </div>
      ) : !hasUnread ? (
        <div className="py-10 text-center">
          <div className="py-4 px-4 mb-4 bg-green-50 border border-green-200 rounded-lg flex flex-col sm:flex-row items-center justify-center gap-4">
            <CheckCircle className="h-12 w-12 text-green-500 shrink-0" />
            <p className="font-medium text-green-800">همه اعلانات را خوانده‌اید</p>
          </div>
          <Link
            href="/dashboard/notifications"
            className="btn-primary inline-flex items-center gap-2"
          >
            <Bell className="h-5 w-5" />
            مشاهده همه اعلانات
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {unreadItems.map((a) => {
            const cfg =
              typeConfig[a.notification_type as keyof typeof typeConfig] ??
              typeConfig.info;
            const Icon = cfg.icon;
            return (
              <div
                key={a.id}
                className={`p-4 rounded-lg border ${cfg.border} bg-white`}
              >
                <div className="flex gap-3">
                  <div
                    className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${cfg.bg} ${cfg.color}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{a.title}</p>
                    {a.message && (
                      <p className="text-sm text-gray-600 mt-1">{a.message}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      <span className="text-xs text-gray-400">
                        {formatDate(a.created_at)}
                      </span>
                      {a.link && (
                        <a
                          href={a.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          مشاهده
                        </a>
                      )}
                      <button
                        onClick={() => handleMarkRead(a.id)}
                        disabled={markingId === a.id}
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 disabled:opacity-50"
                      >
                        {markingId === a.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <CheckCheck className="h-3 w-3" />
                        )}
                        خواندم
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <Link
            href="/dashboard/notifications"
            className="block text-center py-3 text-sm text-blue-600 hover:text-blue-800"
          >
            مشاهده همه اعلانات
          </Link>
        </div>
      )}
    </section>
  );
}
