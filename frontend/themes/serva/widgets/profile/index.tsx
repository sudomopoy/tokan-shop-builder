"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faPen,
  faTrashAlt,
  faPlus,
  faMapMarkerAlt,
  faCreditCard,
  faPhone,
  faEnvelope,
  faCheckCircle,
  faShieldAlt,
  faWallet,
  faTimes,
  faClipboardList,
  faShoppingBag,
  faPlayCircle,
  faDownload,
} from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons";
import {
  accountApi,
  metaApi,
  storeApi,
  type User,
  type Address,
  type BankAccount,
  type Province,
  type City,
} from "@/lib/api";
import type { WidgetConfig } from "@/themes/types";
import { useAppSelector } from "@/lib/store/hooks";
import { selectIsAuthenticated } from "@/lib/store/authSlice";
import { usePageRuntime } from "@/themes/runtime/PageRuntimeProvider";
import { tFrontendAuto } from "@/lib/i18n/autoMessages";

const TAB_IDS = ["info", "addresses", "bank", "settings"] as const;
type TabId = (typeof TAB_IDS)[number];

const inputBase =
  "w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 outline-none transition text-sm";
const btnPrimary =
  "px-5 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2";
const btnSecondary =
  "px-5 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 transition flex items-center justify-center gap-2";

const formatPrice = (price: number | string): string =>
  new Intl.NumberFormat("fa-IR").format(Number(price));

const userLevelLabels: Record<number, string> = {
  0: "مشتری",
  1: "مدیر",
  2: "صاحب",
};

const bankStatusLabels: Record<string, string> = {
  pending: "در انتظار تایید",
  approved: "تایید شده",
  rejected: "رد شده",
};

const bankStatusClasses: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default function Profile({ config }: { config?: WidgetConfig }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const { setData } = usePageRuntime();

  const tabParam = searchParams?.get("tab");
  const initialTab: TabId =
    tabParam === "settings"
      ? "settings"
      : tabParam === "addresses"
        ? "addresses"
        : tabParam === "bank"
          ? "bank"
          : "info";

  const [user, setUser] = useState<User | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  // Address dialog
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressForm, setAddressForm] = useState({
    recipient_fullname: "",
    phone_number: "",
    address_line1: "",
    postcode: "",
    province: "",
    city: "",
  });

  // Bank dialog
  const [bankDialogOpen, setBankDialogOpen] = useState(false);
  const [bankForm, setBankForm] = useState({ iban: "", card_number: "" });

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [storeCategorySlug, setStoreCategorySlug] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    loadData();
  }, [isAuthenticated]);

  useEffect(() => {
    storeApi.getCurrentStore().then((s) => setStoreCategorySlug(s?.store_category?.slug ?? null)).catch(() => {});
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [userData, addressesData, bankAccountsData, provincesData] =
        await Promise.all([
          accountApi.getInfo(),
          accountApi.getAddresses(),
          accountApi.getBankAccounts(),
          metaApi.listProvinces(),
        ]);
      setUser(userData);
      setAddresses(addressesData);
      setBankAccounts(bankAccountsData);
      setProvinces(provincesData);
      setData("user.profile", userData);
      setData("user.addresses", addressesData);
      setData("user.bankAccounts", bankAccountsData);
    } catch (err: unknown) {
      console.error("Profile load error:", err);
      setError(tFrontendAuto("fe.28f81cb68090"));
    } finally {
      setLoading(false);
    }
  };

  const handleProvinceChange = async (provinceId: string) => {
    setSelectedProvince(provinceId);
    setAddressForm((p) => ({ ...p, province: provinceId, city: "" }));
    try {
      const citiesData = await metaApi.listCities(provinceId);
      setCities(citiesData);
    } catch (err) {
      console.error("Error loading cities:", err);
    }
  };

  const openAddressDialog = (address?: Address) => {
    setFormError(null);
    if (address) {
      setEditingAddress(address);
      setAddressForm({
        recipient_fullname: address.recipient_fullname,
        phone_number: address.phone_number,
        address_line1: address.address_line1,
        postcode: address.postcode || "",
        province: address.province.id,
        city: address.city.id,
      });
      handleProvinceChange(address.province.id);
    } else {
      setEditingAddress(null);
      setAddressForm({
        recipient_fullname: "",
        phone_number: "",
        address_line1: "",
        postcode: "",
        province: "",
        city: "",
      });
      setCities([]);
      setSelectedProvince("");
    }
    setAddressDialogOpen(true);
  };

  const closeAddressDialog = () => {
    setAddressDialogOpen(false);
    setEditingAddress(null);
    setAddressForm({
      recipient_fullname: "",
      phone_number: "",
      address_line1: "",
      postcode: "",
      province: "",
      city: "",
    });
    setCities([]);
    setSelectedProvince("");
    setFormError(null);
  };

  const saveAddress = async () => {
    setFormError(null);
    if (
      !addressForm.recipient_fullname ||
      !addressForm.phone_number ||
      !addressForm.address_line1
    ) {
      setFormError("فیلدهای اجباری را پر کنید.");
      return;
    }
    setSaving(true);
    try {
      if (editingAddress) {
        await accountApi.updateAddress(editingAddress.id, addressForm);
      } else {
        await accountApi.createAddress(addressForm);
      }
      await loadData();
      closeAddressDialog();
    } catch (err: unknown) {
      console.error("Address save error:", err);
      setFormError("خطا در ذخیره آدرس.");
    } finally {
      setSaving(false);
    }
  };

  const deleteAddress = async (addressId: string) => {
    if (!confirm(tFrontendAuto("fe.97a560a9fa60"))) return;
    try {
      await accountApi.deleteAddress(addressId);
      await loadData();
    } catch (err: unknown) {
      console.error("Address delete error:", err);
      setError(tFrontendAuto("fe.034a1dce939a"));
    }
  };

  const openBankDialog = () => {
    setFormError(null);
    setBankForm({ iban: "", card_number: "" });
    setBankDialogOpen(true);
  };

  const closeBankDialog = () => {
    setBankDialogOpen(false);
    setBankForm({ iban: "", card_number: "" });
    setFormError(null);
  };

  const saveBank = async () => {
    setFormError(null);
    if (!bankForm.iban && !bankForm.card_number) {
      setFormError("حداقل شماره شبا یا شماره کارت را وارد کنید.");
      return;
    }
    setSaving(true);
    try {
      await accountApi.createBankAccount(bankForm);
      await loadData();
      closeBankDialog();
    } catch (err: unknown) {
      console.error("Bank save error:", err);
      setFormError("خطا در ذخیره حساب بانکی.");
    } finally {
      setSaving(false);
    }
  };

  const deleteBank = async (accountId: string) => {
    if (!confirm(tFrontendAuto("fe.ba0b473f027e")))
      return;
    try {
      await accountApi.deleteBankAccount(accountId);
      await loadData();
    } catch (err: unknown) {
      console.error("Bank delete error:", err);
      setError(tFrontendAuto("fe.e453c025a6ad"));
    }
  };

  const buildTabHref = (tab: TabId) =>
    tab === "info" ? "/profile" : `/profile?tab=${tab}`;

  if (!isAuthenticated) {
    return (
      <>
        <div className="bg-white border-b border-gray-100">
          <div className="container py-4">
            <nav className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <Link href="/" className="hover:text-primary transition">
                خانه
              </Link>
              <span className="text-xs opacity-60">‹</span>
              <span className="text-dark">{tFrontendAuto("fe.e68a4edf84ec")}</span>
            </nav>
          </div>
        </div>
        <section className="container py-12 md:py-16">
          <div className="max-w-md mx-auto bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
              <FontAwesomeIcon icon={faUser} className="text-4xl text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-dark mb-2">
              لطفا برای مشاهده پروفایل وارد شوید
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              با ورود به حساب کاربری به اطلاعات و امکانات پروفایل دسترسی پیدا می‌کنید.
            </p>
            <Link
              href={`/login?next=${encodeURIComponent(
                (pathname || "/profile") +
                  (searchParams?.toString() ? `?${searchParams.toString()}` : "")
              )}`}
              className={btnPrimary + " inline-flex"}
            >
              <FontAwesomeIcon icon={faUser} />
              ورود به حساب کاربری
            </Link>
          </div>
        </section>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <div className="bg-white border-b border-gray-100">
          <div className="container py-4">
            <nav className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <Link href="/" className="hover:text-primary transition">
                خانه
              </Link>
              <span className="text-xs opacity-60">‹</span>
              <span className="text-dark">{tFrontendAuto("fe.e68a4edf84ec")}</span>
            </nav>
          </div>
        </div>
        <section className="container py-16">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        </section>
      </>
    );
  }

  if (error || !user) {
    return (
      <>
        <div className="bg-white border-b border-gray-100">
          <div className="container py-4">
            <nav className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <Link href="/" className="hover:text-primary transition">
                خانه
              </Link>
              <span className="text-xs opacity-60">‹</span>
              <span className="text-dark">{tFrontendAuto("fe.e68a4edf84ec")}</span>
            </nav>
          </div>
        </div>
        <section className="container py-12">
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4 text-red-700">
            {error ?? "خطا در بارگذاری پروفایل."}
          </div>
          <button onClick={loadData} className={btnPrimary}>
            تلاش مجدد
          </button>
        </section>
      </>
    );
  }

  const displayName = user.store_user?.display_name || "کاربر";

  return (
    <>
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="container py-4">
          <nav className="flex items-center gap-2 text-sm font-medium text-gray-600">
            <Link href="/" className="hover:text-primary transition">
              خانه
            </Link>
            <span className="text-xs opacity-60">‹</span>
            <Link href="/profile" className="hover:text-primary transition">
              پروفایل
            </Link>
            <span className="text-xs opacity-60">‹</span>
            <span className="text-dark">
              {activeTab === "info" && "اطلاعات شخصی"}
              {activeTab === "addresses" && "آدرس‌ها"}
              {activeTab === "bank" && "حساب‌های بانکی"}
              {activeTab === "settings" && "تنظیمات"}
            </span>
          </nav>
        </div>
      </div>

      <section className="container py-8 md:py-12">
        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl p-6 md:p-8 mb-8 border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-shrink-0">
              <div
                className="w-24 h-24 rounded-2xl flex items-center justify-center font-black text-2xl bg-primary text-white shadow-md ring-2 ring-primary/20 overflow-hidden"
                style={
                  typeof (user as unknown as { avatarUrl?: string })?.avatarUrl ===
                  "string"
                    ? {
                        backgroundImage: `url(${(user as unknown as { avatarUrl: string }).avatarUrl})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundColor: "transparent",
                      }
                    : undefined
                }
              >
                {typeof (user as unknown as { avatarUrl?: string })?.avatarUrl !==
                  "string" && (
                  <FontAwesomeIcon icon={faUser} className="text-3xl" />
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-black text-dark mb-2">
                {displayName}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                <span className="flex items-center gap-2" dir="ltr">
                  <FontAwesomeIcon icon={faPhone} className="text-primary w-4" />
                  {user.mobile}
                  {user.mobile_verified && (
                    <FontAwesomeIcon
                      icon={faCheckCircle}
                      className="text-green-500"
                    />
                  )}
                </span>
                {user.store_user?.email && (
                  <span className="flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={faEnvelope}
                      className="text-primary w-4"
                    />
                    {user.store_user.email}
                    {user.store_user.email_is_verified && (
                      <FontAwesomeIcon
                        icon={faCheckCircle}
                        className="text-green-500"
                      />
                    )}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-lg text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                  {userLevelLabels[user.store_user?.level ?? 0] || "مشتری"}
                </span>
                {user.is_verified && (
                  <span className="px-3 py-1 rounded-lg text-xs font-bold bg-green-100 text-green-700 border border-green-200 flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faShieldAlt} />
                    احراز هویت شده
                  </span>
                )}
                {user.store_user?.is_vendor && (
                  <span className="px-3 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-700">
                    فروشنده
                  </span>
                )}
                {user.store_user?.is_admin && (
                  <span className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-700">
                    مدیر
                  </span>
                )}
              </div>
              {user.wallet &&
                (Number(user.wallet.available_balance ?? user.wallet.withdrawable_balance ?? 0) || 0) > 0 && (
                <div className="mt-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="flex items-center gap-2 text-gray-700">
                    <FontAwesomeIcon
                      icon={faWallet}
                      className="text-green-500"
                    />
                    <span className="font-medium">
                      موجودی کیف پول:{" "}
                      {formatPrice(
                        Number(user.wallet.available_balance ?? user.wallet.withdrawable_balance ?? 0)
                      )}{" "}
                      تومان
                    </span>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl bg-gray-100 p-1 mb-6 overflow-x-auto">
          <Link
            href={buildTabHref("info")}
            className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-bold transition whitespace-nowrap ${
              activeTab === "info"
                ? "bg-white text-primary shadow-sm"
                : "text-gray-600 hover:text-dark"
            }`}
          >
            <FontAwesomeIcon icon={faUser} className="w-4" />
            اطلاعات شخصی
          </Link>
          <Link
            href={buildTabHref("addresses")}
            className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-bold transition whitespace-nowrap ${
              activeTab === "addresses"
                ? "bg-white text-primary shadow-sm"
                : "text-gray-600 hover:text-dark"
            }`}
          >
            <FontAwesomeIcon icon={faMapMarkerAlt} className="w-4" />
            آدرس‌ها
          </Link>
          <Link
            href={buildTabHref("bank")}
            className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-bold transition whitespace-nowrap ${
              activeTab === "bank"
                ? "bg-white text-primary shadow-sm"
                : "text-gray-600 hover:text-dark"
            }`}
          >
            <FontAwesomeIcon icon={faCreditCard} className="w-4" />
            حساب‌های بانکی
          </Link>
          <Link
            href={buildTabHref("settings")}
            className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-bold transition whitespace-nowrap ${
              activeTab === "settings"
                ? "bg-white text-primary shadow-sm"
                : "text-gray-600 hover:text-dark"
            }`}
          >
            تنظیمات
          </Link>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm">
          {/* Info Tab */}
          {activeTab === "info" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-dark border-b border-gray-100 pb-3">
                اطلاعات شخصی
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">
                    شماره موبایل
                  </label>
                  <input
                    type="text"
                    value={user.mobile}
                    readOnly
                    disabled
                    className={inputBase + " opacity-70 cursor-not-allowed"}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">
                    کد ملی
                  </label>
                  <input
                    type="text"
                    value={user.national_id || "-"}
                    readOnly
                    disabled
                    className={inputBase + " opacity-70 cursor-not-allowed"}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">
                    نام نمایشی
                  </label>
                  <input
                    type="text"
                    value={user.store_user?.display_name || "-"}
                    readOnly
                    disabled
                    className={inputBase + " opacity-70 cursor-not-allowed"}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">
                    ایمیل
                  </label>
                  <input
                    type="email"
                    value={user.store_user?.email || "-"}
                    readOnly
                    disabled
                    className={inputBase + " opacity-70 cursor-not-allowed"}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Addresses Tab */}
          {activeTab === "addresses" && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h2 className="text-lg font-bold text-dark">
                  آدرس‌های ثبت شده
                </h2>
                <button
                  type="button"
                  onClick={() => openAddressDialog()}
                  className={btnPrimary}
                >
                  <FontAwesomeIcon icon={faPlus} />
                  افزودن آدرس جدید
                </button>
              </div>
              {addresses.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FontAwesomeIcon
                    icon={faMapMarkerAlt}
                    className="text-4xl text-gray-300 mb-4"
                  />
                  <p>{tFrontendAuto("fe.80bd5410525b")}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="border border-gray-200 rounded-xl p-5 hover:border-primary/30 transition"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <FontAwesomeIcon
                              icon={faMapMarkerAlt}
                              className="text-primary"
                            />
                            <span className="font-bold text-dark">
                              {addr.recipient_fullname}
                            </span>
                            {addr.frequently_used && (
                              <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-primary/10 text-primary">
                                پیش‌فرض
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            {addr.address_line1}
                          </p>
                          <p className="text-sm text-gray-500">
                            {addr.city.name}، {addr.province.name}
                          </p>
                          <p className="text-sm text-gray-500 mt-1" dir="ltr">
                            تلفن: {addr.phone_number}
                            {addr.postcode && ` | کد پستی: ${addr.postcode}`}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => openAddressDialog(addr)}
                            className="w-10 h-10 rounded-xl border border-gray-200 text-gray-600 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition flex items-center justify-center"
                            aria-label={tFrontendAuto("fe.de21bfe62ab5")}
                          >
                            <FontAwesomeIcon icon={faPen} />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteAddress(addr.id)}
                            className="w-10 h-10 rounded-xl border border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition flex items-center justify-center"
                            aria-label={tFrontendAuto("fe.fc1d9d323674")}
                          >
                            <FontAwesomeIcon icon={faTrashAlt} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Bank Tab */}
          {activeTab === "bank" && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h2 className="text-lg font-bold text-dark">
                  حساب‌های بانکی
                </h2>
                <button
                  type="button"
                  onClick={openBankDialog}
                  className={btnPrimary}
                >
                  <FontAwesomeIcon icon={faPlus} />
                  افزودن حساب بانکی
                </button>
              </div>
              {bankAccounts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FontAwesomeIcon
                    icon={faCreditCard}
                    className="text-4xl text-gray-300 mb-4"
                  />
                  <p>{tFrontendAuto("fe.833a826631d3")}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bankAccounts.map((acc) => (
                    <div
                      key={acc.id}
                      className="border border-gray-200 rounded-xl p-5 hover:border-primary/30 transition"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <FontAwesomeIcon
                              icon={faCreditCard}
                              className="text-primary text-xl"
                            />
                          </div>
                          <div>
                            <p className="font-bold text-dark">
                              {acc.card_number
                                ? `****-****-****-${acc.card_number.slice(-4)}`
                                : "حساب شبا"}
                            </p>
                            <p className="text-sm text-gray-500">
                              {acc.iban || (acc.card_number && `کارت: ${acc.card_number}`) || "-"}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-lg text-xs font-medium ${
                              bankStatusClasses[acc.status] ?? "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {bankStatusLabels[acc.status] ?? acc.status}
                          </span>
                        </div>
                        {acc.status === "pending" && (
                          <button
                            type="button"
                            onClick={() => deleteBank(acc.id)}
                            className="w-10 h-10 rounded-xl border border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition flex items-center justify-center"
                            aria-label={tFrontendAuto("fe.fc1d9d323674")}
                          >
                            <FontAwesomeIcon icon={faTrashAlt} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-dark border-b border-gray-100 pb-3">
                تنظیمات حساب کاربری
              </h2>
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                <p className="text-gray-600 text-sm">
                  تنظیمات پیشرفته حساب کاربری از جمله تغییر رمز عبور و تنظیمات امنیتی به‌زودی در این بخش قرار خواهد گرفت.
                </p>
                <Link
                  href="/orders"
                  className="inline-flex items-center gap-2 mt-4 text-primary font-bold hover:underline"
                >
                  مشاهده سفارش‌های من
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/orders"
            className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-100 hover:border-primary/30 hover:shadow-sm transition"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <FontAwesomeIcon icon={faClipboardList} className="text-primary" />
            </div>
            <div>
              <p className="font-bold text-dark">{tFrontendAuto("fe.af826736405e")}</p>
              <p className="text-xs text-gray-500">{tFrontendAuto("fe.fa1c38b345bc")}</p>
            </div>
          </Link>
          {storeCategorySlug === "reservation" && (
            <Link
              href="/reservation"
              className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-100 hover:border-primary/30 hover:shadow-sm transition"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                <FontAwesomeIcon icon={faClipboardList} className="text-amber-600" />
              </div>
              <div>
                <p className="font-bold text-dark">{tFrontendAuto("fe.046848c29a29")}</p>
                <p className="text-xs text-gray-500">{tFrontendAuto("fe.a3aded501afa")}</p>
              </div>
            </Link>
          )}
          {["streaming", "digital"].includes(storeCategorySlug ?? "") && (
            <Link
              href="/my-videos"
              className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-100 hover:border-primary/30 hover:shadow-sm transition"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <FontAwesomeIcon icon={faPlayCircle} className="text-blue-600" />
              </div>
              <div>
                <p className="font-bold text-dark">{tFrontendAuto("fe.82d303d1d0fc")}</p>
                <p className="text-xs text-gray-500">{tFrontendAuto("fe.b73c768ac75c")}</p>
              </div>
            </Link>
          )}
          {["download", "digital"].includes(storeCategorySlug ?? "") && (
            <Link
              href="/my-downloads"
              className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-100 hover:border-primary/30 hover:shadow-sm transition"
            >
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                <FontAwesomeIcon icon={faDownload} className="text-green-600" />
              </div>
              <div>
                <p className="font-bold text-dark">{tFrontendAuto("fe.9fa10e1b5995")}</p>
                <p className="text-xs text-gray-500">{tFrontendAuto("fe.a2384b51965d")}</p>
              </div>
            </Link>
          )}
          {storeCategorySlug !== "reservation" && (
            <>
              <Link
                href="/wishlist"
                className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-100 hover:border-primary/30 hover:shadow-sm transition"
              >
                <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                  <FontAwesomeIcon
                    icon={faHeartRegular}
                    className="text-red-500"
                  />
                </div>
                <div>
                  <p className="font-bold text-dark">{tFrontendAuto("fe.e3bc523bbd19")}</p>
                  <p className="text-xs text-gray-500">{tFrontendAuto("fe.8fc4b3eed0e8")}</p>
                </div>
              </Link>
              <Link
                href="/basket"
                className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-100 hover:border-primary/30 hover:shadow-sm transition"
              >
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                  <FontAwesomeIcon icon={faShoppingBag} className="text-secondary" />
                </div>
                <div>
                  <p className="font-bold text-dark">{tFrontendAuto("fe.807f37218e5a")}</p>
                  <p className="text-xs text-gray-500">{tFrontendAuto("fe.f98b7a097e05")}</p>
                </div>
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Address Dialog */}
      {addressDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-dark">
                {editingAddress ? "ویرایش آدرس" : "افزودن آدرس جدید"}
              </h3>
              <button
                type="button"
                onClick={closeAddressDialog}
                className="w-10 h-10 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-dark transition flex items-center justify-center"
                aria-label={tFrontendAuto("fe.53df25bd0b3b")}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {formError && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
                  {formError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  نام گیرنده
                </label>
                <input
                  type="text"
                  value={addressForm.recipient_fullname}
                  onChange={(e) =>
                    setAddressForm((p) => ({
                      ...p,
                      recipient_fullname: e.target.value,
                    }))
                  }
                  placeholder={tFrontendAuto("fe.ccb4d3ccb062")}
                  className={inputBase}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  شماره تلفن
                </label>
                <input
                  type="tel"
                  value={addressForm.phone_number}
                  onChange={(e) =>
                    setAddressForm((p) => ({
                      ...p,
                      phone_number: e.target.value,
                    }))
                  }
                  placeholder="09123456789"
                  dir="ltr"
                  className={inputBase}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  استان
                </label>
                <select
                  value={addressForm.province}
                  onChange={(e) => handleProvinceChange(e.target.value)}
                  className={inputBase}
                >
                  <option value="">{tFrontendAuto("fe.1afe110b90bd")}</option>
                  {provinces.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  شهر
                </label>
                <select
                  value={addressForm.city}
                  onChange={(e) =>
                    setAddressForm((p) => ({ ...p, city: e.target.value }))
                  }
                  disabled={!selectedProvince}
                  className={inputBase}
                >
                  <option value="">{tFrontendAuto("fe.05a28b35a9a1")}</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  آدرس
                </label>
                <textarea
                  rows={3}
                  value={addressForm.address_line1}
                  onChange={(e) =>
                    setAddressForm((p) => ({
                      ...p,
                      address_line1: e.target.value,
                    }))
                  }
                  placeholder={tFrontendAuto("fe.e2016fb65b67")}
                  className={inputBase + " resize-none"}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  کد پستی
                </label>
                <input
                  type="text"
                  value={addressForm.postcode}
                  onChange={(e) =>
                    setAddressForm((p) => ({
                      ...p,
                      postcode: e.target.value,
                    }))
                  }
                  placeholder="1234567890"
                  dir="ltr"
                  className={inputBase}
                />
              </div>
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3 justify-end">
              <button
                type="button"
                onClick={closeAddressDialog}
                className={btnSecondary}
              >
                لغو
              </button>
              <button
                type="button"
                onClick={saveAddress}
                disabled={
                  saving ||
                  !addressForm.recipient_fullname ||
                  !addressForm.phone_number ||
                  !addressForm.address_line1
                }
                className={btnPrimary}
              >
                {saving ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  editingAddress ? "ویرایش" : "افزودن"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bank Dialog */}
      {bankDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full">
            <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-dark">{tFrontendAuto("fe.79c8f9474633")}</h3>
              <button
                type="button"
                onClick={closeBankDialog}
                className="w-10 h-10 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-dark transition flex items-center justify-center"
                aria-label={tFrontendAuto("fe.53df25bd0b3b")}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {formError && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
                  {formError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  شماره شبا (IR...)
                </label>
                <input
                  type="text"
                  value={bankForm.iban}
                  onChange={(e) =>
                    setBankForm((p) => ({
                      ...p,
                      iban: e.target.value.replace(/[^0-9]/g, ""),
                    }))
                  }
                  placeholder="IR123456789012345678901234"
                  dir="ltr"
                  className={inputBase}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  شماره کارت (اختیاری)
                </label>
                <input
                  type="text"
                  value={bankForm.card_number}
                  onChange={(e) =>
                    setBankForm((p) => ({
                      ...p,
                      card_number: e.target.value.replace(/\D/g, "").slice(0, 16),
                    }))
                  }
                  placeholder="1234567890123456"
                  dir="ltr"
                  maxLength={16}
                  className={inputBase}
                />
              </div>
              <p className="text-sm text-gray-500">
                حداقل یکی از شماره شبا یا شماره کارت باید وارد شود.
              </p>
            </div>
            <div className="border-t border-gray-100 px-6 py-4 flex gap-3 justify-end">
              <button
                type="button"
                onClick={closeBankDialog}
                className={btnSecondary}
              >
                لغو
              </button>
              <button
                type="button"
                onClick={saveBank}
                disabled={
                  saving || (!bankForm.iban && !bankForm.card_number)
                }
                className={btnPrimary}
              >
                {saving ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "افزودن"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
