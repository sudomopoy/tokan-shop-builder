"use client";

import { useEffect, useState } from "react";
import { storeUserApi, storeApi } from "@/lib/api";
import type { StoreUser, AdminPermissions, PlanInfo } from "@/lib/api/storeUserApi";
import { tFrontendAuto } from "@/lib/i18n/autoMessages";

const LEVEL_LABELS: Record<number, string> = {
  0: "مشتری",
  1: "ادمین",
  2: "مالک",
};

const SECTIONS_PRODUCT_STORE = [
  { key: "products", label: "محصولات" },
  { key: "users", label: "کاربران" },
  { key: "orders", label: "سفارشات" },
  { key: "blog", label: "بلاگ" },
  { key: "reviews", label: "نظرات کاربران" },
  { key: "reservation", label: "رزرواسیون" },
] as const;

const SECTIONS_RESERVATION_STORE = [
  { key: "users", label: "کاربران" },
  { key: "reservation", label: "رزرواسیون" },
] as const;

const MEDIA_SECTION = { key: "media_delete", label: "مدیا (حذف فایل)" };

const ACTIONS = [
  { key: "read", label: "خواندن" },
  { key: "write", label: "ویرایش" },
  { key: "delete", label: "حذف" },
] as const;

export default function UsersPage() {
  const [users, setUsers] = useState<StoreUser[]>([]);
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [makeAdminTarget, setMakeAdminTarget] = useState<StoreUser | null>(null);
  const [adminPerms, setAdminPerms] = useState<AdminPermissions>(
    storeUserApi.DEFAULT_PERMISSIONS
  );
  const [isOwner, setIsOwner] = useState(false);
  const [storeCategorySlug, setStoreCategorySlug] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const [res, plan] = await Promise.all([
        storeUserApi.list({ page_size: 100 }),
        storeUserApi.getPlanInfo(),
      ]);
      setUsers(res.results ?? []);
      setPlanInfo(plan);
      setIsOwner(plan?.is_owner ?? false);
    } catch (err) {
      console.error(err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    storeApi.getCurrentStore().then((s) => setStoreCategorySlug(s?.store_category?.slug ?? null)).catch(() => {});
  }, []);

  const handleBlock = async (u: StoreUser) => {
    setActionLoading(u.id);
    try {
      await storeUserApi.block(u.id);
      await refresh();
    } catch (e) {
      console.error(e);
      alert((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "خطا");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnblock = async (u: StoreUser) => {
    setActionLoading(u.id);
    try {
      await storeUserApi.unblock(u.id);
      await refresh();
    } catch (e) {
      console.error(e);
      alert((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "خطا");
    } finally {
      setActionLoading(null);
    }
  };

  const handleMakeAdmin = (u: StoreUser) => {
    setMakeAdminTarget(u);
    setAdminPerms(u.admin_permissions ?? storeUserApi.DEFAULT_PERMISSIONS);
  };

  const handleSaveAdmin = async () => {
    if (!makeAdminTarget) return;
    setActionLoading(makeAdminTarget.id);
    try {
      await storeUserApi.makeAdmin(makeAdminTarget.id, adminPerms);
      setMakeAdminTarget(null);
      await refresh();
    } catch (e) {
      console.error(e);
      alert((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "خطا");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveAdmin = async (u: StoreUser) => {
    if (!confirm(tFrontendAuto("fe.6c8890330167"))) return;
    setActionLoading(u.id);
    try {
      await storeUserApi.removeAdmin(u.id);
      await refresh();
    } catch (e) {
      console.error(e);
      alert((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "خطا");
    } finally {
      setActionLoading(null);
    }
  };

  const togglePerm = (section: keyof AdminPermissions, val: boolean) => {
    setAdminPerms((p) => ({ ...p, [section]: val }));
  };

  const isReservationStore = storeCategorySlug === "reservation";
  const SECTIONS = isReservationStore ? SECTIONS_RESERVATION_STORE : SECTIONS_PRODUCT_STORE;

  const userIsOwner = (u: StoreUser) => u.level === 2;
  const canManageUsers = isOwner;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{tFrontendAuto("fe.23f39ce809d8")}</h1>

      {planInfo && planInfo.max_admins > 0 && (
        <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
          ادمین‌های فعال: {planInfo.active_admin_count} از {planInfo.max_admins}
          {!planInfo.can_add_admin && " (ظرفیت تکمیل)"}
        </div>
      )}

      {planInfo && planInfo.max_admins === 0 && (
        <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
          پلن فعلی امکان تعریف ادمین ندارد. برای افزودن ادمین، پلن اشتراک را ارتقا دهید.
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">
                    نام / موبایل
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">
                    سطح دسترسی
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">
                    وضعیت
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">
                    تاریخ ثبت‌نام
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      کاربری یافت نشد
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium">
                            {user.display_name || user.user_username || "—"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {user.user_mobile || "—"}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">
                          {LEVEL_LABELS[user.level] ?? `سطح ${user.level}`}
                        </span>
                        {user.is_admin && !user.is_admin_active && (
                          <span className="mr-1 rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-800">
                            موقتاً غیرفعال
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {user.is_blocked ? (
                          <span className="text-red-600">{tFrontendAuto("fe.ed83479b2f32")}</span>
                        ) : (
                          <span className="text-green-600">{tFrontendAuto("fe.e3d927082524")}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {user.register_at
                          ? new Date(user.register_at).toLocaleDateString("fa-IR")
                          : "—"}
                      </td>
                      <td className="px-6 py-4">
                        {!userIsOwner(user) && canManageUsers && (
                          <div className="flex flex-wrap gap-2">
                            {user.is_blocked ? (
                              <button
                                onClick={() => handleUnblock(user)}
                                disabled={!!actionLoading}
                                className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700 disabled:opacity-50"
                              >
                                رفع مسدودیت
                              </button>
                            ) : (
                              <button
                                onClick={() => handleBlock(user)}
                                disabled={!!actionLoading}
                                className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700 disabled:opacity-50"
                              >
                                مسدود کردن
                              </button>
                            )}
                            {user.is_admin ? (
                              <>
                                {planInfo?.can_add_admin && (
                                  <button
                                    onClick={() => handleMakeAdmin(user)}
                                    disabled={!!actionLoading}
                                    className="rounded bg-amber-600 px-3 py-1 text-sm text-white hover:bg-amber-700 disabled:opacity-50"
                                  >
                                    ویرایش دسترسی
                                  </button>
                                )}
                                <button
                                  onClick={() => handleRemoveAdmin(user)}
                                  disabled={!!actionLoading}
                                  className="rounded bg-gray-600 px-3 py-1 text-sm text-white hover:bg-gray-700 disabled:opacity-50"
                                >
                                  حذف از ادمینی
                                </button>
                              </>
                            ) : (
                              planInfo?.can_add_admin && (
                                <button
                                  onClick={() => handleMakeAdmin(user)}
                                  disabled={!!actionLoading}
                                  className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                  ادمین کردن
                                </button>
                              )
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* مودال تعیین ادمین */}
      {makeAdminTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold">
              تعیین دسترسی ادمین برای {makeAdminTarget.display_name || makeAdminTarget.user_mobile}
            </h3>
            <p className="mb-4 text-sm text-gray-500">
              برای هر بخش می‌توانید دسترسی خواندن، ویرایش و حذف را مشخص کنید.
            </p>
            <div className="space-y-4">
              {SECTIONS.map(({ key, label }) => (
                <div key={key} className="rounded border p-3">
                  <div className="mb-2 font-medium">{label}</div>
                  <div className="flex flex-wrap gap-4">
                    {ACTIONS.map(({ key: ak, label: al }) => {
                      const permKey = `${key}_${ak}` as keyof AdminPermissions;
                      return (
                        <label key={permKey} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={!!adminPerms[permKey]}
                            onChange={(e) => togglePerm(permKey, e.target.checked)}
                            className="h-4 w-4 rounded"
                          />
                          <span className="text-sm">{al}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
              {isReservationStore && (
                <p className="text-xs text-gray-500">
                  فروشگاه شما از نوع رزرو است. فقط دسترسی‌های رزرواسیون و کاربران قابل تنظیم است.
                </p>
              )}
              <div className="rounded border p-3 bg-gray-50">
                <div className="mb-2 font-medium">{MEDIA_SECTION.label}</div>
                <p className="mb-2 text-xs text-gray-500">
                  مشاهده و ویرایش فایل‌ها برای همه ادمین‌ها فعال است. این گزینه فقط امکان حذف فایل را تعیین می‌کند.
                </p>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!adminPerms.media_delete}
                    onChange={(e) => togglePerm("media_delete", e.target.checked)}
                    className="h-4 w-4 rounded"
                  />
                  <span className="text-sm">{tFrontendAuto("fe.ee8619fdc78d")}</span>
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setMakeAdminTarget(null)}
                className="rounded border px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                انصراف
              </button>
              <button
                onClick={handleSaveAdmin}
                disabled={!!actionLoading}
                className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                ذخیره
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
