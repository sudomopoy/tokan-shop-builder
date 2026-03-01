"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Store,
  Image as ImageIcon,
  Globe,
  Palette,
  CreditCard,
  Package,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  FolderOpen,
  SlidersHorizontal,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  Phone,
  Share2,
  ShieldCheck,
  BarChart3,
  Shield,
} from "lucide-react";
import { storeApi, paymentApi, orderApi } from "@/lib/api";
import type { StoreDetail, StoreSettingItem } from "@/lib/api/storeApi";
import { getMediaUrl } from "@/lib/api/storeApi";
import type { Media } from "@/lib/api/productApi";
import type { PaymentGateway } from "@/lib/api/paymentApi";
import type { ShippingMethod } from "@/lib/api/orderApi";
import { FileManagerModal } from "@/components/FileManagerModal";
import { ThemeSettingsSection } from "@/components/dashboard/ThemeSettingsSection";
import { revalidateStorePages } from "@/lib/server/storefrontCache";
import { tFrontendAuto } from "@/lib/i18n/autoMessages";

const TABS_BASE = [
  { id: "general", name: "اطلاعات کلی", icon: Store },
  { id: "contact", name: "اطلاعات تماس و شبکه‌های اجتماعی", icon: Phone },
  { id: "branding", name: "برندینگ و لوگو", icon: ImageIcon },
  { id: "domain", name: "دامنه و آدرس", icon: Globe },
  { id: "theme", name: "ظاهر و تم", icon: Palette },
  { id: "payment", name: "درگاه‌های پرداخت", icon: CreditCard },
  { id: "shipping", name: "روش‌های ارسال", icon: Package, requiresPhysical: true },
  { id: "seo", name: "سئو و آنالیز", icon: BarChart3 },
  { id: "badges", name: "نمادها", icon: Shield },
  { id: "store-settings", name: "تنظیمات پیشرفته", icon: SlidersHorizontal },
] as const;

function getSettingsTabs(storeCategorySlug: string | null | undefined) {
  if (storeCategorySlug == null || storeCategorySlug === "") return [...TABS_BASE];
  const isPhysical = storeCategorySlug === "physical";
  return TABS_BASE.filter((t) => !("requiresPhysical" in t && t.requiresPhysical && !isPhysical));
}

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get("tab");
  const tabs = getSettingsTabs(store?.store_category?.slug);
  const validTabIds = tabs.map((t) => t.id);
  const activeTab = (validTabIds.includes(tabParam as any) ? tabParam : "general") as string;

  const [store, setStore] = useState<StoreDetail | null>(null);
  const [myStores, setMyStores] = useState<StoreDetail[]>([]);
  const [paymentGateways, setPaymentGateways] = useState<PaymentGateway[]>([]);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileManagerTarget, setFileManagerTarget] = useState<"favicon" | "minimal_logo" | "full_logo" | null>(null);

  const [form, setForm] = useState({
    title: "",
    en_title: "",
    description: "",
    slogan: "",
    external_domain: "",
    theme_slug: "default",
  });

  const [storeSettingsForm, setStoreSettingsForm] = useState<
    Record<string, string | number | boolean>
  >({});

  const [paymentGatewayForms, setPaymentGatewayForms] = useState<
    Record<string, { title: string; is_sandbox: boolean; configuration: Record<string, string | number> }>
  >({});
  const [shippingMethodForms, setShippingMethodForms] = useState<
    Record<
      string,
      {
        name: string;
        description: string;
        base_shipping_price: string;
        shipping_price_per_extra_kilograms: string;
        tracking_code_base_url: string;
        shipping_payment_on_delivery: boolean;
        product_payment_on_delivery: boolean;
        max_payment_on_delivery: string;
        is_active: boolean;
      }
    >
  >({});
  const [savingGatewayId, setSavingGatewayId] = useState<string | null>(null);
  const [savingShippingId, setSavingShippingId] = useState<string | null>(null);
  const [deletingShippingId, setDeletingShippingId] = useState<string | null>(null);
  const [newShippingForm, setNewShippingForm] = useState<{
    name: string;
    description: string;
    base_shipping_price: string;
    shipping_price_per_extra_kilograms: string;
    tracking_code_base_url: string;
    shipping_payment_on_delivery: boolean;
    product_payment_on_delivery: boolean;
    max_payment_on_delivery: string;
    is_active: boolean;
  }>({
    name: "",
    description: "",
    base_shipping_price: "",
    shipping_price_per_extra_kilograms: "",
    tracking_code_base_url: "",
    shipping_payment_on_delivery: false,
    product_payment_on_delivery: false,
    max_payment_on_delivery: "",
    is_active: true,
  });
  const [addingShipping, setAddingShipping] = useState(false);
  const [newShippingSectionOpen, setNewShippingSectionOpen] = useState(false);

  const [media, setMedia] = useState<{
    favicon: Media | null;
    minimal_logo: Media | null;
    full_logo: Media | null;
  }>({ favicon: null, minimal_logo: null, full_logo: null });

  const [setupProgress, setSetupProgress] = useState<{
    domain_change_pending?: boolean;
    domain_change_message?: string | null;
    domain_change_request_id?: string | null;
  } | null>(null);

  const [domainRequestLoading, setDomainRequestLoading] = useState(false);
  const [domainRequestInput, setDomainRequestInput] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [currentStore, storesList, gateways, methods, progress] = await Promise.all([
        storeApi.getCurrentStore(),
        storeApi.getMyStores(),
        paymentApi.listGateways().catch(() => []),
        orderApi.listShippingMethods().catch(() => []),
        storeApi.getSetupProgress().catch(() => null),
      ]);
      if (progress) {
        setSetupProgress({
          domain_change_pending: progress.domain_change_pending,
          domain_change_message: progress.domain_change_message,
          domain_change_request_id: progress.domain_change_request_id,
        });
      }

      const myStoreIds = new Set((storesList ?? []).map((s) => s.id));
      const currentInMyStores = currentStore && myStoreIds.has(currentStore.id);
      const targetStore =
        currentStore && currentInMyStores
          ? currentStore
          : Array.isArray(storesList) && storesList.length > 0
          ? storesList[0]
          : currentStore ?? null;

      if (targetStore) {
        const fullStore = await storeApi.getStore(targetStore.id).catch(() => null);
        setStore((fullStore ?? targetStore) as StoreDetail);

        const s = (fullStore ?? targetStore) as StoreDetail;
        setForm({
          title: s.title ?? "",
          en_title: s.en_title ?? "",
          description: s.description ?? "",
          slogan: s.slogan ?? "",
          external_domain: s.external_domain ?? "",
          theme_slug: s.theme_slug || "default",
        });

        setMedia({
          favicon: s.favicon as Media | null,
          minimal_logo: s.minimal_logo as Media | null,
          full_logo: s.full_logo as Media | null,
        });

        const editable = (s.settings ?? []).filter(
          (x) =>
            x.definition?.can_edit_by_store !== false &&
            (x.definition?.key ?? x.key) !== "theme_slug"
        );
        const settingsMap: Record<string, string | number | boolean> = {};
        for (const item of editable) {
          const key = item.definition?.key ?? item.key ?? "";
          if (!key) continue;
          const type = item.definition?.type ?? "text";
          const raw = item.value ?? item.definition?.default_value ?? "";
          if (type === "bool") settingsMap[key] = raw?.toLowerCase() === "true";
          else if (type === "int") settingsMap[key] = parseInt(raw, 10) || 0;
          else if (type === "float") settingsMap[key] = parseFloat(raw) || 0;
          else settingsMap[key] = raw;
        }
        setStoreSettingsForm(settingsMap);
      }
      setMyStores(Array.isArray(storesList) ? storesList : []);
      setPaymentGateways(gateways);
      setShippingMethods(Array.isArray(methods) ? methods : []);
      const gwForms: Record<string, { title: string; is_sandbox: boolean; configuration: Record<string, string | number> }> = {};
      (gateways || []).forEach((gw) => {
        gwForms[gw.id] = {
          title: gw.title ?? "",
          is_sandbox: !!gw.is_sandbox,
          configuration: { ...(typeof gw.configuration === "object" && gw.configuration ? gw.configuration : {}) },
        };
      });
      setPaymentGatewayForms(gwForms);
      const smForms: Record<string, {
        name: string;
        description: string;
        base_shipping_price: string;
        shipping_price_per_extra_kilograms: string;
        tracking_code_base_url: string;
        shipping_payment_on_delivery: boolean;
        product_payment_on_delivery: boolean;
        max_payment_on_delivery: string;
        is_active: boolean;
      }> = {};
      (methods || []).forEach((sm) => {
        smForms[sm.id] = {
          name: sm.name ?? "",
          description: sm.description ?? "",
          base_shipping_price: String(sm.base_shipping_price ?? ""),
          shipping_price_per_extra_kilograms: String(sm.shipping_price_per_extra_kilograms ?? ""),
          tracking_code_base_url: sm.tracking_code_base_url ?? "",
          shipping_payment_on_delivery: !!sm.shipping_payment_on_delivery,
          product_payment_on_delivery: !!sm.product_payment_on_delivery,
          max_payment_on_delivery: sm.max_payment_on_delivery != null ? String(sm.max_payment_on_delivery) : "",
          is_active: sm.is_active !== false,
        };
      });
      setShippingMethodForms(smForms);
    } catch (err) {
      console.error(err);
      setError(tFrontendAuto("fe.bdcd264f30e1"));
      setStore(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (overrides?: { theme_slug?: string }) => {
    if (!store) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    const theme_slug = overrides?.theme_slug ?? form.theme_slug;
    if (overrides?.theme_slug) {
      setForm((f) => ({ ...f, theme_slug: overrides.theme_slug! }));
    }
    try {
      const payload: Record<string, unknown> = {
        title: form.title,
        en_title: form.en_title || null,
        description: form.description,
        slogan: form.slogan,
        theme_slug,
        favicon: media.favicon?.id ?? null,
        minimal_logo: media.minimal_logo?.id ?? null,
        full_logo: media.full_logo?.id ?? null,
      };
      if (!store.external_domain?.trim()) {
        payload.external_domain = form.external_domain || null;
      }
      await storeApi.updateStore(store.id, payload);

      if (Object.keys(storeSettingsForm).length > 0) {
        await storeApi.updateStoreSettings(store.id, storeSettingsForm);
      }

      const domain = store.internal_domain || (store.external_domain ? `${store.name}.${store.external_domain}` : null);
      await revalidateStorePages(domain);

      setSuccess(tFrontendAuto("fe.aca2a91ea4bf"));
      setStore((prev) =>
        prev
          ? {
              ...prev,
              title: form.title,
              en_title: form.en_title || null,
              description: form.description,
              slogan: form.slogan,
              external_domain: form.external_domain || null,
              theme_slug,
              favicon: media.favicon,
              minimal_logo: media.minimal_logo,
              full_logo: media.full_logo,
            }
          : null
      );
    } catch (err: any) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.errors?.[0] ||
        "خطا در ذخیره تنظیمات";
      setError(Array.isArray(msg) ? msg.join(", ") : String(msg));
    } finally {
      setSaving(false);
    }
  };

  const handleMediaSelect = (target: "favicon" | "minimal_logo" | "full_logo") => (m: Media) => {
    setMedia((prev) => ({ ...prev, [target]: m }));
    setFileManagerTarget(null);
  };

  const savePaymentGateway = async (gwId: string) => {
    const form = paymentGatewayForms[gwId];
    if (!form) return;
    setSavingGatewayId(gwId);
    setError(null);
    try {
      const updated = await paymentApi.updateGateway(gwId, {
        title: form.title,
        is_sandbox: form.is_sandbox,
        configuration: form.configuration,
      });
      setPaymentGateways((prev) => prev.map((g) => (g.id === gwId ? updated : g)));
      setPaymentGatewayForms((prev) => ({
        ...prev,
        [gwId]: {
          title: updated.title ?? "",
          is_sandbox: !!updated.is_sandbox,
          configuration: { ...(typeof updated.configuration === "object" && updated.configuration ? updated.configuration : {}) },
        },
      }));
      setSuccess(tFrontendAuto("fe.643e3b4eaf47"));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      const msg = err.response?.data?.detail ?? err.response?.data?.configuration ?? "خطا در ذخیره درگاه";
      setError(Array.isArray(msg) ? msg.join(", ") : String(msg));
    } finally {
      setSavingGatewayId(null);
    }
  };

  const saveShippingMethod = async (smId: string) => {
    const form = shippingMethodForms[smId];
    if (!form) return;
    setSavingShippingId(smId);
    setError(null);
    try {
      const updated = await orderApi.updateShippingMethod(smId, {
        name: form.name,
        description: form.description,
        base_shipping_price: parseFloat(form.base_shipping_price) || 0,
        shipping_price_per_extra_kilograms: parseFloat(form.shipping_price_per_extra_kilograms) || 0,
        tracking_code_base_url: form.tracking_code_base_url || null,
        shipping_payment_on_delivery: form.shipping_payment_on_delivery,
        product_payment_on_delivery: form.product_payment_on_delivery,
        max_payment_on_delivery: form.max_payment_on_delivery ? parseFloat(form.max_payment_on_delivery) : null,
        is_active: form.is_active,
      });
      setShippingMethods((prev) => prev.map((m) => (m.id === smId ? updated : m)));
      setShippingMethodForms((prev) => ({
        ...prev,
        [smId]: {
          name: updated.name ?? "",
          description: updated.description ?? "",
          base_shipping_price: String(updated.base_shipping_price ?? ""),
          shipping_price_per_extra_kilograms: String(updated.shipping_price_per_extra_kilograms ?? ""),
          tracking_code_base_url: updated.tracking_code_base_url ?? "",
          shipping_payment_on_delivery: !!updated.shipping_payment_on_delivery,
          product_payment_on_delivery: !!updated.product_payment_on_delivery,
          max_payment_on_delivery: updated.max_payment_on_delivery != null ? String(updated.max_payment_on_delivery) : "",
          is_active: updated.is_active !== false,
        },
      }));
      setSuccess(tFrontendAuto("fe.2828f02c80f4"));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      const msg = err.response?.data?.detail ?? "خطا در ذخیره روش ارسال";
      setError(Array.isArray(msg) ? msg.join(", ") : String(msg));
    } finally {
      setSavingShippingId(null);
    }
  };

  const deleteShippingMethod = async (smId: string) => {
    if (!confirm(tFrontendAuto("fe.5ca9a7f26b8d"))) return;
    setDeletingShippingId(smId);
    setError(null);
    try {
      await orderApi.deleteShippingMethod(smId);
      setShippingMethods((prev) => prev.filter((m) => m.id !== smId));
      setShippingMethodForms((prev) => {
        const next = { ...prev };
        delete next[smId];
        return next;
      });
      setSuccess(tFrontendAuto("fe.e7a966da9c66"));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      const msg = err.response?.data?.error ?? err.response?.data?.detail ?? "حذف ممکن نیست.";
      setError(String(msg));
    } finally {
      setDeletingShippingId(null);
    }
  };

  const addShippingMethod = async () => {
    const f = newShippingForm;
    if (!f.name.trim()) {
      setError(tFrontendAuto("fe.a8581e496b36"));
      return;
    }
    const basePrice = parseFloat(f.base_shipping_price);
    if (Number.isNaN(basePrice) || basePrice < 0) {
      setError(tFrontendAuto("fe.8f7fb6357a77"));
      return;
    }
    setAddingShipping(true);
    setError(null);
    try {
      const created = await orderApi.createShippingMethod({
        name: f.name.trim(),
        description: f.description.trim() || undefined,
        base_shipping_price: basePrice,
        shipping_price_per_extra_kilograms: parseFloat(f.shipping_price_per_extra_kilograms) || 0,
        tracking_code_base_url: f.tracking_code_base_url.trim() || null,
        shipping_payment_on_delivery: f.shipping_payment_on_delivery,
        product_payment_on_delivery: f.product_payment_on_delivery,
        max_payment_on_delivery: f.max_payment_on_delivery ? parseFloat(f.max_payment_on_delivery) : null,
        is_active: f.is_active,
      });
      setShippingMethods((prev) => [...prev, created]);
      setShippingMethodForms((prev) => ({
        ...prev,
        [created.id]: {
          name: created.name ?? "",
          description: created.description ?? "",
          base_shipping_price: String(created.base_shipping_price ?? ""),
          shipping_price_per_extra_kilograms: String(created.shipping_price_per_extra_kilograms ?? ""),
          tracking_code_base_url: created.tracking_code_base_url ?? "",
          shipping_payment_on_delivery: !!created.shipping_payment_on_delivery,
          product_payment_on_delivery: !!created.product_payment_on_delivery,
          max_payment_on_delivery: created.max_payment_on_delivery != null ? String(created.max_payment_on_delivery) : "",
          is_active: created.is_active !== false,
        },
      }));
      setNewShippingForm({
        name: "",
        description: "",
        base_shipping_price: "",
        shipping_price_per_extra_kilograms: "",
        tracking_code_base_url: "",
        shipping_payment_on_delivery: false,
        product_payment_on_delivery: false,
        max_payment_on_delivery: "",
        is_active: true,
      });
      setSuccess(tFrontendAuto("fe.ddd4d39f44a5"));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      const msg = err.response?.data?.detail ?? "خطا در افزودن روش ارسال";
      setError(Array.isArray(msg) ? msg.join(", ") : String(msg));
    } finally {
      setAddingShipping(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">{tFrontendAuto("fe.6631ea9e106b")}</h1>
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="h-16 w-16 text-amber-500 mb-4" />
          <p className="text-gray-600 mb-2">{tFrontendAuto("fe.79045ad7ac79")}</p>
          <p className="text-sm text-gray-500">
            برای دسترسی به تنظیمات، ابتدا از دامنه فروشگاه خود وارد شوید یا فروشگاه ایجاد کنید.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">{tFrontendAuto("fe.6631ea9e106b")}</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary inline-flex items-center justify-center gap-2 px-6 py-2.5 disabled:opacity-70"
        >
          {saving ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Save className="h-5 w-5" />
          )}
          ذخیره تنظیمات
        </button>
      </div>

      {success && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-200 text-green-800">
          <CheckCircle2 className="h-6 w-6 shrink-0" />
          <span>{success}</span>
          <button
            onClick={() => setSuccess(null)}
            className="mr-auto p-1 hover:bg-green-100 rounded"
            aria-label={tFrontendAuto("fe.53df25bd0b3b")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800">
          <AlertCircle className="h-6 w-6 shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="mr-auto p-1 hover:bg-red-100 rounded"
            aria-label={tFrontendAuto("fe.53df25bd0b3b")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* تب‌های تنظیمات */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="flex gap-1 min-w-max" aria-label={tFrontendAuto("fe.537f36a80a80")}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Link
                key={tab.id}
                href={`/dashboard/settings?tab=${tab.id}`}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <tab.icon className="h-4 w-4 shrink-0" />
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === "general" && (
        <section className="card">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
            <div className="p-2 rounded-lg bg-blue-100">
              <Store className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-lg font-bold">{tFrontendAuto("fe.8c4dee66143f")}</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{tFrontendAuto("fe.c95d717d07f3")}</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={tFrontendAuto("fe.c95d717d07f3")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{tFrontendAuto("fe.21d0718ebdfc")}</label>
              <input
                type="text"
                value={form.en_title}
                onChange={(e) => setForm((f) => ({ ...f, en_title: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={tFrontendAuto("fe.931f9ec22d38")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{tFrontendAuto("fe.8593a9f18909")}</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={tFrontendAuto("fe.d2b1f1485521")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{tFrontendAuto("fe.14d54aea5b9e")}</label>
              <input
                type="text"
                value={form.slogan}
                onChange={(e) => setForm((f) => ({ ...f, slogan: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={tFrontendAuto("fe.346f6c187a5b")}
              />
            </div>
          </div>
        </section>
        )}

        {activeTab === "contact" && (
        <section className="card">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
            <div className="p-2 rounded-lg bg-teal-100">
              <Phone className="h-6 w-6 text-teal-600" />
            </div>
            <h2 className="text-lg font-bold">{tFrontendAuto("fe.746a56e7f375")}</h2>
          </div>
          <p className="text-gray-600 text-sm mb-6">
            این اطلاعات در هدر و فوتر فروشگاه نمایش داده می‌شوند.
          </p>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <Phone className="h-4 w-4" /> اطلاعات تماس
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tFrontendAuto("fe.7b7e803a0df9")}</label>
                  <input
                    type="text"
                    value={String(storeSettingsForm.store_phone ?? "")}
                    onChange={(e) =>
                      setStoreSettingsForm((prev) => ({ ...prev, store_phone: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={tFrontendAuto("fe.9284bc9a6899")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tFrontendAuto("fe.48ebc456a416")}</label>
                  <input
                    type="email"
                    value={String(storeSettingsForm.store_email ?? "")}
                    onChange={(e) =>
                      setStoreSettingsForm((prev) => ({ ...prev, store_email: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={tFrontendAuto("fe.0c25f203ed98")}
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tFrontendAuto("fe.889f46873df4")}</label>
                  <input
                    type="text"
                    value={String(storeSettingsForm.store_address ?? "")}
                    onChange={(e) =>
                      setStoreSettingsForm((prev) => ({ ...prev, store_address: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={tFrontendAuto("fe.a8b1bff5a7e3")}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <Share2 className="h-4 w-4" /> شبکه‌های اجتماعی
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { key: "social_instagram_url", label: "اینستاگرام" },
                  { key: "social_telegram_url", label: "تلگرام" },
                  { key: "social_whatsapp_url", label: "واتساپ" },
                  { key: "social_twitter_url", label: "توییتر" },
                  { key: "social_linkedin_url", label: "لینکدین" },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                    <input
                      type="url"
                      value={String(storeSettingsForm[key] ?? "")}
                      onChange={(e) =>
                        setStoreSettingsForm((prev) => ({ ...prev, [key]: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://..."
                    />
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>
        )}

        {activeTab === "branding" && (
        <section className="card">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
            <div className="p-2 rounded-lg bg-violet-100">
              <ImageIcon className="h-6 w-6 text-violet-600" />
            </div>
            <h2 className="text-lg font-bold">{tFrontendAuto("fe.e9132998f41c")}</h2>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{tFrontendAuto("fe.3e664e377b1c")}</label>
              <div className="flex flex-wrap items-start gap-4">
                {media.favicon ? (
                  <div className="relative group">
                    <img
                      src={getMediaUrl(media.favicon)}
                      alt=""
                      className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => setMedia((m) => ({ ...m, favicon: null }))}
                      className="absolute -top-1 -right-1 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label={tFrontendAuto("fe.fc1d9d323674")}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={() => setFileManagerTarget("favicon")}
                  className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <FolderOpen className="h-5 w-5 text-gray-400" />
                  <span className="text-sm">{tFrontendAuto("fe.facfb3d039a7")}</span>
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{tFrontendAuto("fe.246311dafc4e")}</label>
              <div className="flex flex-wrap items-start gap-4">
                {media.minimal_logo ? (
                  <div className="relative group">
                    <img
                      src={getMediaUrl(media.minimal_logo)}
                      alt=""
                      className="w-24 h-16 object-contain rounded-lg border border-gray-200 bg-white p-2"
                    />
                    <button
                      type="button"
                      onClick={() => setMedia((m) => ({ ...m, minimal_logo: null }))}
                      className="absolute -top-1 -right-1 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label={tFrontendAuto("fe.fc1d9d323674")}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={() => setFileManagerTarget("minimal_logo")}
                  className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <FolderOpen className="h-5 w-5 text-gray-400" />
                  <span className="text-sm">{tFrontendAuto("fe.facfb3d039a7")}</span>
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{tFrontendAuto("fe.cbdd92c58dc7")}</label>
              <div className="flex flex-wrap items-start gap-4">
                {media.full_logo ? (
                  <div className="relative group">
                    <img
                      src={getMediaUrl(media.full_logo)}
                      alt=""
                      className="w-32 h-20 object-contain rounded-lg border border-gray-200 bg-white p-2"
                    />
                    <button
                      type="button"
                      onClick={() => setMedia((m) => ({ ...m, full_logo: null }))}
                      className="absolute -top-1 -right-1 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label={tFrontendAuto("fe.fc1d9d323674")}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={() => setFileManagerTarget("full_logo")}
                  className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <FolderOpen className="h-5 w-5 text-gray-400" />
                  <span className="text-sm">{tFrontendAuto("fe.facfb3d039a7")}</span>
                </button>
              </div>
            </div>
          </div>
        </section>
        )}

        {activeTab === "domain" && (
        <section className="card">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
            <div className="p-2 rounded-lg bg-emerald-100">
              <Globe className="h-6 w-6 text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold">{tFrontendAuto("fe.148cf7f75ec1")}</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{tFrontendAuto("fe.da05777a0c60")}</label>
              <div className="text-left ltr px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-mono text-sm">
                https://{store.external_domain || store.internal_domain || `${store.name}.tokan.app`}
              </div>
            </div>

            {/* فروشگاه دامنه اختصاصی دارد - امکان ویرایش وجود ندارد */}
            {store.external_domain && store.external_domain.trim() ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  دامنه اختصاصی شما ثبت شده و قابل ویرایش نیست.
                </p>
              </div>
            ) : (
              <>
                {/* پیام پایدار تا زمان تایید درخواست - حتی بعد از رفرش */}
                {setupProgress?.domain_change_pending && setupProgress?.domain_change_message && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                    <p className="text-sm text-blue-800 whitespace-pre-line">
                      {setupProgress.domain_change_message}
                    </p>
                    <button
                      type="button"
                      onClick={async () => {
                        setDomainRequestLoading(true);
                        try {
                          await storeApi.cancelDomainRequest();
                          setSuccess(tFrontendAuto("fe.bdf3e67075c9"));
                          const progress = await storeApi.getSetupProgress();
                          setSetupProgress({
                            domain_change_pending: progress.domain_change_pending,
                            domain_change_message: progress.domain_change_message,
                            domain_change_request_id: progress.domain_change_request_id,
                          });
                          fetchData();
                        } catch (e: any) {
                          setError(e?.response?.data?.detail || "خطا در لغو درخواست");
                        } finally {
                          setDomainRequestLoading(false);
                        }
                      }}
                      disabled={domainRequestLoading}
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      لغو درخواست
                    </button>
                  </div>
                )}

                {/* فرم درخواست تغییر دامنه - فقط وقتی درخواست pending نداریم */}
                {!setupProgress?.domain_change_pending && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{tFrontendAuto("fe.832801124657")}</label>
                    <p className="text-xs text-gray-500 mb-2">
                      برای اتصال دامنه شخصی خود، درخواست ثبت کنید. پس از تنظیم NS، درخواست توسط پشتیبانی تایید خواهد شد.
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={domainRequestInput}
                        onChange={(e) => setDomainRequestInput(e.target.value)}
                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="example.com"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          const domain = domainRequestInput.trim();
                          if (!domain) {
                            setError(tFrontendAuto("fe.e146273098f3"));
                            return;
                          }
                          setDomainRequestLoading(true);
                          setError(null);
                          try {
                            const res = await storeApi.createDomainRequest(domain);
                            setSuccess(res.message);
                            setDomainRequestInput("");
                            const progress = await storeApi.getSetupProgress();
                            setSetupProgress({
                              domain_change_pending: progress.domain_change_pending,
                              domain_change_message: progress.domain_change_message,
                              domain_change_request_id: progress.domain_change_request_id,
                            });
                          } catch (e: any) {
                            setError(e?.response?.data?.detail || "خطا در ثبت درخواست");
                          } finally {
                            setDomainRequestLoading(false);
                          }
                        }}
                        disabled={domainRequestLoading}
                        className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {domainRequestLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "ثبت درخواست"}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
        )}

        {activeTab === "theme" && (
        <section className="card">
          <ThemeSettingsSection
            currentThemeSlug={form.theme_slug}
            onThemeChange={(slug) => setForm((f) => ({ ...f, theme_slug: slug }))}
            onSave={handleSave}
          />
        </section>
        )}

        {activeTab === "payment" && (
        <section className="card">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
            <div className="p-2 rounded-lg bg-green-100">
              <CreditCard className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-lg font-bold">{tFrontendAuto("fe.40233b19bd97")}</h2>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            برای هر نوع درگاه (تعریف‌شده در سیستم) فیلدهای کانفیگ از طریق نوع درگاه مشخص می‌شوند. مقادیر را برای این فروشگاه وارد کنید.
          </p>
          {paymentGateways.length > 0 ? (
            <div className="space-y-6">
              {paymentGateways.map((gw) => {
                const form = paymentGatewayForms[gw.id];
                const schema = gw.gateway_type?.config_schema ?? [];
                return (
                  <div
                    key={gw.id}
                    className="p-5 rounded-xl border border-gray-200 bg-gray-50/50 space-y-4"
                  >
                    <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
                      <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                        <CreditCard className="h-5 w-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {gw.gateway_type?.title ?? gw.gateway_type?.name ?? "—"}
                        </p>
                        <p className="text-xs text-gray-500">نوع: {gw.gateway_type?.name}</p>
                      </div>
                    </div>
                    {form && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{tFrontendAuto("fe.bd6aa34927c4")}</label>
                          <input
                            type="text"
                            value={form.title}
                            onChange={(e) =>
                              setPaymentGatewayForms((prev) => ({
                                ...prev,
                                [gw.id]: { ...prev[gw.id], title: e.target.value },
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder={gw.gateway_type?.title}
                          />
                        </div>
                        {gw.gateway_type?.has_sandbox && (
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={form.is_sandbox}
                              onChange={(e) =>
                                setPaymentGatewayForms((prev) => ({
                                  ...prev,
                                  [gw.id]: { ...prev[gw.id], is_sandbox: e.target.checked },
                                }))
                              }
                              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            <span className="text-sm text-gray-700">{tFrontendAuto("fe.86b1ac8ebf9c")}</span>
                          </label>
                        )}
                        {Array.isArray(schema) && schema.length > 0 && (
                          <div className="space-y-3 pt-2">
                            <p className="text-sm font-medium text-gray-700">{tFrontendAuto("fe.7c30749ea600")}</p>
                            {schema.map((field: { key: string; label: string; type?: string; required?: boolean }) => (
                              <div key={field.key}>
                                <label className="block text-sm text-gray-600 mb-1">
                                  {field.label}
                                  {field.required && <span className="text-red-500 mr-1">*</span>}
                                </label>
                                <input
                                  type={field.type === "password" ? "password" : field.type === "number" ? "number" : "text"}
                                  value={String(form.configuration[field.key] ?? "")}
                                  onChange={(e) =>
                                    setPaymentGatewayForms((prev) => ({
                                      ...prev,
                                      [gw.id]: {
                                        ...prev[gw.id],
                                        configuration: {
                                          ...prev[gw.id].configuration,
                                          [field.key]: field.type === "number" ? (parseFloat(e.target.value) || 0) : e.target.value,
                                        },
                                      },
                                    }))
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                  placeholder={field.label}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => savePaymentGateway(gw.id)}
                            disabled={savingGatewayId === gw.id}
                            className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-70"
                          >
                            {savingGatewayId === gw.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                            ذخیره تنظیمات این درگاه
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-4 p-6 rounded-lg border border-amber-200 bg-amber-50 text-amber-800">
              <AlertCircle className="h-10 w-10 shrink-0" />
              <div>
                <p className="font-medium">{tFrontendAuto("fe.e89a9e839189")}</p>
                <p className="text-sm mt-1">
                  برای دریافت پرداخت آنلاین، نوع درگاه را در پنل ادمین اضافه کنید تا برای همه فروشگاه‌ها ایجاد شود.
                </p>
              </div>
            </div>
          )}
        </section>
        )}

        {activeTab === "shipping" && (
        <section className="card">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
            <div className="p-2 rounded-lg bg-sky-100">
              <Package className="h-6 w-6 text-sky-600" />
            </div>
            <h2 className="text-lg font-bold">{tFrontendAuto("fe.fed6ebca20fb")}</h2>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            روش‌های سیستمی (مثل پست پیشتاز) قابل حذف نیستند؛ روش‌های سفارشی را خودتان اضافه یا حذف کنید. همه روش‌ها را می‌توان غیرفعال کرد.
          </p>
          <div className="space-y-6">
          {shippingMethods.length > 0 && shippingMethods.map((sm) => {
                const form = shippingMethodForms[sm.id];
                const isSystem = !!sm.definition;
                return (
                  <div
                    key={sm.id}
                    className={`p-5 rounded-xl border space-y-4 ${form?.is_active === false ? "border-amber-200 bg-amber-50/30" : "border-gray-200 bg-gray-50/50"}`}
                  >
                    <div className="flex items-center justify-between gap-3 pb-2 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                          <Package className="h-5 w-5 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {sm.definition?.name ?? sm.name}
                            {isSystem && (
                              <span className="mr-2 text-xs font-normal text-sky-600 bg-sky-100 px-2 py-0.5 rounded">{tFrontendAuto("fe.4d321db4576c")}</span>
                            )}
                            {!isSystem && (
                              <span className="mr-2 text-xs font-normal text-gray-500 bg-gray-200 px-2 py-0.5 rounded">{tFrontendAuto("fe.f7cf82345ab4")}</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500">
                            {isSystem ? `تعریف: ${sm.definition?.slug}` : "روش اضافه‌شده توسط شما"}
                          </p>
                        </div>
                      </div>
                      {!isSystem && (
                        <button
                          type="button"
                          onClick={() => deleteShippingMethod(sm.id)}
                          disabled={deletingShippingId === sm.id}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                          title={tFrontendAuto("fe.aa23da44b91b")}
                        >
                          {deletingShippingId === sm.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                        </button>
                      )}
                    </div>
                    {form && (
                      <>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.is_active}
                            onChange={(e) =>
                              setShippingMethodForms((prev) => ({
                                ...prev,
                                [sm.id]: { ...prev[sm.id], is_active: e.target.checked },
                              }))
                            }
                            className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                          />
                          <span className="text-sm font-medium text-gray-700">{tFrontendAuto("fe.a0929d80342f")}</span>
                        </label>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{tFrontendAuto("fe.42804b9e344e")}</label>
                          <input
                            type="text"
                            value={form.name}
                            onChange={(e) =>
                              setShippingMethodForms((prev) => ({
                                ...prev,
                                [sm.id]: { ...prev[sm.id], name: e.target.value },
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{tFrontendAuto("fe.8593a9f18909")}</label>
                          <textarea
                            value={form.description}
                            onChange={(e) =>
                              setShippingMethodForms((prev) => ({
                                ...prev,
                                [sm.id]: { ...prev[sm.id], description: e.target.value },
                              }))
                            }
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{tFrontendAuto("fe.8ab97a1590c2")}</label>
                            <input
                              type="number"
                              min={0}
                              value={form.base_shipping_price}
                              onChange={(e) =>
                                setShippingMethodForms((prev) => ({
                                  ...prev,
                                  [sm.id]: { ...prev[sm.id], base_shipping_price: e.target.value },
                                }))
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{tFrontendAuto("fe.fb5c2dfd1ba4")}</label>
                            <input
                              type="number"
                              min={0}
                              value={form.shipping_price_per_extra_kilograms}
                              onChange={(e) =>
                                setShippingMethodForms((prev) => ({
                                  ...prev,
                                  [sm.id]: { ...prev[sm.id], shipping_price_per_extra_kilograms: e.target.value },
                                }))
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{tFrontendAuto("fe.21d50582e3ca")}</label>
                          <input
                            type="url"
                            value={form.tracking_code_base_url}
                            onChange={(e) =>
                              setShippingMethodForms((prev) => ({
                                ...prev,
                                [sm.id]: { ...prev[sm.id], tracking_code_base_url: e.target.value },
                              }))
                            }
                            dir="ltr"
                            className="w-full ltr text-left px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                            placeholder={tFrontendAuto("fe.a79589f2fe1c")}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={form.shipping_payment_on_delivery}
                              onChange={(e) =>
                                setShippingMethodForms((prev) => ({
                                  ...prev,
                                  [sm.id]: { ...prev[sm.id], shipping_payment_on_delivery: e.target.checked },
                                }))
                              }
                              className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                            />
                            <span className="text-sm text-gray-700">{tFrontendAuto("fe.b46be1391273")}</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={form.product_payment_on_delivery}
                              onChange={(e) =>
                                setShippingMethodForms((prev) => ({
                                  ...prev,
                                  [sm.id]: { ...prev[sm.id], product_payment_on_delivery: e.target.checked },
                                }))
                              }
                              className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                            />
                            <span className="text-sm text-gray-700">{tFrontendAuto("fe.b559f9f53de1")}</span>
                          </label>
                          {(form.shipping_payment_on_delivery || form.product_payment_on_delivery) && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{tFrontendAuto("fe.9f368d3a13f4")}</label>
                            <input
                              type="number"
                              min={0}
                              value={form.max_payment_on_delivery}
                              onChange={(e) =>
                                setShippingMethodForms((prev) => ({
                                  ...prev,
                                  [sm.id]: { ...prev[sm.id], max_payment_on_delivery: e.target.value },
                                }))
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                              placeholder={tFrontendAuto("fe.b36bf7b24a35")}
                            />
                          </div>
                          )}
                        </div>
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => saveShippingMethod(sm.id)}
                            disabled={savingShippingId === sm.id}
                            className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-70"
                          >
                            {savingShippingId === sm.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                            ذخیره تنظیمات این روش ارسال
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}

          {shippingMethods.length === 0 && (
            <div className="flex items-center gap-4 p-6 rounded-lg border border-amber-200 bg-amber-50 text-amber-800">
              <AlertCircle className="h-10 w-10 shrink-0" />
              <div>
                <p className="font-medium">{tFrontendAuto("fe.6de3fa16272f")}</p>
                <p className="text-sm mt-1">
                  می‌توانید روش ارسال سفارشی اضافه کنید یا منتظر تعریف روش‌های سیستمی توسط مدیر بمانید.
                </p>
              </div>
            </div>
          )}

          {/* افزودن روش ارسال سفارشی */}
          <div className="rounded-xl border-2 border-dashed border-sky-200 bg-sky-50/30 overflow-hidden">
            <button
              type="button"
              onClick={() => setNewShippingSectionOpen((v) => !v)}
              className="w-full p-5 flex items-center justify-between gap-2 text-right hover:bg-sky-100/50 transition-colors"
            >
              <h3 className="font-medium text-sky-900 flex items-center gap-2">
                <Plus className="h-5 w-5" />
                افزودن روش ارسال سفارشی
              </h3>
              {newShippingSectionOpen ? (
                <ChevronUp className="h-5 w-5 text-sky-600 shrink-0" />
              ) : (
                <ChevronDown className="h-5 w-5 text-sky-600 shrink-0" />
              )}
            </button>
            {newShippingSectionOpen && (
            <div className="px-5 pb-5 pt-0 space-y-4 border-t border-sky-200/50">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{tFrontendAuto("fe.e42daea11702")}</label>
              <input
                type="text"
                value={newShippingForm.name}
                onChange={(e) => setNewShippingForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                placeholder={tFrontendAuto("fe.d74317ad9d8d")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{tFrontendAuto("fe.8593a9f18909")}</label>
              <textarea
                value={newShippingForm.description}
                onChange={(e) => setNewShippingForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{tFrontendAuto("fe.bc5cd0207a33")}</label>
                <input
                  type="number"
                  min={0}
                  value={newShippingForm.base_shipping_price}
                  onChange={(e) => setNewShippingForm((f) => ({ ...f, base_shipping_price: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{tFrontendAuto("fe.e9067cbb0539")}</label>
                <input
                  type="number"
                  min={0}
                  value={newShippingForm.shipping_price_per_extra_kilograms}
                  onChange={(e) => setNewShippingForm((f) => ({ ...f, shipping_price_per_extra_kilograms: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{tFrontendAuto("fe.a7f4c86363b6")}</label>
              <input
                type="url"
                value={newShippingForm.tracking_code_base_url}
                onChange={(e) => setNewShippingForm((f) => ({ ...f, tracking_code_base_url: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                placeholder={tFrontendAuto("fe.89906933a01d")}
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newShippingForm.is_active}
                onChange={(e) => setNewShippingForm((f) => ({ ...f, is_active: e.target.checked }))}
                className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
              />
              <span className="text-sm text-gray-700">{tFrontendAuto("fe.e3d927082524")}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newShippingForm.shipping_payment_on_delivery}
                onChange={(e) => setNewShippingForm((f) => ({ ...f, shipping_payment_on_delivery: e.target.checked }))}
                className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
              />
              <span className="text-sm text-gray-700">{tFrontendAuto("fe.b46be1391273")}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newShippingForm.product_payment_on_delivery}
                onChange={(e) => setNewShippingForm((f) => ({ ...f, product_payment_on_delivery: e.target.checked }))}
                className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
              />
              <span className="text-sm text-gray-700">{tFrontendAuto("fe.026461726e82")}</span>
            </label>
            {(newShippingForm.shipping_payment_on_delivery || newShippingForm.product_payment_on_delivery) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{tFrontendAuto("fe.dcb224fefbf3")}</label>
              <input
                type="number"
                min={0}
                value={newShippingForm.max_payment_on_delivery}
                onChange={(e) => setNewShippingForm((f) => ({ ...f, max_payment_on_delivery: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
            )}
            <button
              type="button"
              onClick={addShippingMethod}
              disabled={addingShipping}
              className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-70"
            >
              {addingShipping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              افزودن روش ارسال
            </button>
            </div>
            )}
          </div>
          </div>
        </section>
        )}

        {activeTab === "seo" && (
        <section className="card">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
            <div className="p-2 rounded-lg bg-blue-100">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-lg font-bold">{tFrontendAuto("fe.e1fc225c108c")}</h2>
          </div>
          <p className="text-gray-600 text-sm mb-6">
            گوگل آنالیتیکس و تگ منیجر برای تحلیل ترافیک و رفتار کاربران.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{tFrontendAuto("fe.6256d65f029e")}</label>
              <input
                type="text"
                value={String(storeSettingsForm.google_analytics_id ?? "")}
                onChange={(e) =>
                  setStoreSettingsForm((prev) => ({ ...prev, google_analytics_id: e.target.value }))
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="G-XXXXXXXXXX"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{tFrontendAuto("fe.bbe15eca3118")}</label>
              <input
                type="text"
                value={String(storeSettingsForm.google_tag_manager_id ?? "")}
                onChange={(e) =>
                  setStoreSettingsForm((prev) => ({ ...prev, google_tag_manager_id: e.target.value }))
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="GTM-XXXXXXX"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={storeSettingsForm.google_search_console_verified === true || storeSettingsForm.google_search_console_verified === "true"}
                onChange={(e) =>
                  setStoreSettingsForm((prev) => ({ ...prev, google_search_console_verified: e.target.checked }))
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">{tFrontendAuto("fe.687bbfc820fe")}</span>
            </label>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{tFrontendAuto("fe.b6a445b4cc9b")}</label>
              <input
                type="url"
                value={String(storeSettingsForm.torob_api_url ?? "")}
                onChange={(e) =>
                  setStoreSettingsForm((prev) => ({ ...prev, torob_api_url: e.target.value }))
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://..."
              />
            </div>
          </div>
        </section>
        )}

        {activeTab === "badges" && (
        <section className="card">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
            <div className="p-2 rounded-lg bg-amber-100">
              <Shield className="h-6 w-6 text-amber-600" />
            </div>
            <h2 className="text-lg font-bold">{tFrontendAuto("fe.1ff96f9aa356")}</h2>
          </div>
          <p className="text-gray-600 text-sm mb-6">
            لینک یا کد HTML نماد را وارد کنید. در صورت ورود کد، لینک به‌صورت خودکار استخراج و ذخیره می‌شود.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{tFrontendAuto("fe.ddcd24cd4c82")}</label>
              <textarea
                value={String(storeSettingsForm.trust_enamad_url ?? "")}
                onChange={(e) =>
                  setStoreSettingsForm((prev) => ({ ...prev, trust_enamad_url: e.target.value }))
                }
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                placeholder={tFrontendAuto("fe.2519243de6c5")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{tFrontendAuto("fe.294840c645c1")}</label>
              <textarea
                value={String(storeSettingsForm.trust_samandehi_url ?? "")}
                onChange={(e) =>
                  setStoreSettingsForm((prev) => ({ ...prev, trust_samandehi_url: e.target.value }))
                }
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                placeholder={tFrontendAuto("fe.2519243de6c5")}
              />
            </div>
          </div>
        </section>
        )}

        {activeTab === "store-settings" && (
        <section className="card">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
            <div className="p-2 rounded-lg bg-indigo-100">
              <SlidersHorizontal className="h-6 w-6 text-indigo-600" />
            </div>
            <h2 className="text-lg font-bold">{tFrontendAuto("fe.93bef1df68ee")}</h2>
          </div>
          {(() => {
            const editableSettings = (store?.settings ?? []).filter(
              (x) =>
                x.definition?.can_edit_by_store !== false &&
                (x.definition?.key ?? x.key) !== "theme_slug"
            );
            if (editableSettings.length === 0) {
              return (
                <p className="text-gray-600 text-sm">
                  در حال حاضر هیچ تنظیم قابل ویرایشی تعریف نشده است.
                </p>
              );
            }
            return (
              <div className="space-y-4">
                {editableSettings.map((item) => {
                  const key = item.definition?.key ?? item.key ?? "";
                  const type = item.definition?.type ?? "text";
                  const label = key;
                  const desc = item.definition?.description;
                  const value = storeSettingsForm[key];
                  const onChange = (v: string | number | boolean) =>
                    setStoreSettingsForm((prev) => ({ ...prev, [key]: v }));

                  return (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {label}
                      </label>
                      {desc && (
                        <p className="text-xs text-gray-500 mb-1">{desc}</p>
                      )}
                      {type === "bool" && (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(value)}
                            onChange={(e) => onChange(e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm">
                            {value ? "فعال" : "غیرفعال"}
                          </span>
                        </label>
                      )}
                      {type === "color" && (
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={
                              typeof value === "string" && value
                                ? value
                                : "#000000"
                            }
                            onChange={(e) => onChange(e.target.value)}
                            className="h-10 w-14 cursor-pointer rounded border border-gray-300"
                          />
                          <input
                            type="text"
                            value={String(value ?? "")}
                            onChange={(e) => onChange(e.target.value)}
                            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                            placeholder="#000000"
                          />
                        </div>
                      )}
                      {(type === "int" || type === "float") && (
                        <input
                          type="number"
                          step={type === "float" ? 0.01 : 1}
                          value={String(value ?? "")}
                          onChange={(e) =>
                            onChange(
                              type === "float"
                                ? parseFloat(e.target.value) || 0
                                : parseInt(e.target.value, 10) || 0
                            )
                          }
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      )}
                      {(type === "text" || type === "url") && (
                        <input
                          type={type === "url" ? "url" : "text"}
                          value={String(value ?? "")}
                          onChange={(e) => onChange(e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder={item.definition?.default_value ?? ""}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </section>
        )}
      </div>

      <div className="flex justify-end mt-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary inline-flex items-center justify-center gap-2 px-8 py-3 disabled:opacity-70"
        >
          {saving ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Save className="h-5 w-5" />
          )}
          ذخیره همه تنظیمات
        </button>
      </div>

      <FileManagerModal
        open={fileManagerTarget !== null}
        onClose={() => setFileManagerTarget(null)}
        onSelect={
          fileManagerTarget
            ? handleMediaSelect(fileManagerTarget)
            : undefined
        }
        mode="single"
        accept="image"
      />
    </div>
  );
}
