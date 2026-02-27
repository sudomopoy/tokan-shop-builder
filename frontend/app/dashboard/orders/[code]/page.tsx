"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Package, User, MapPin, Truck } from "lucide-react";
import { orderApi, type Order } from "@/lib/api/orderApi";

const STATUS_LABELS: Record<string, string> = {
  pending: "در انتظار پرداخت",
  paid: "پرداخت شده",
  processing: "در حال آماده‌سازی",
  completed: "تکمیل شده",
  delivered: "تحویل شده",
  cancelled: "لغو شده",
  failed: "ناموفق",
};

function statusBadge(status: string) {
  const label = STATUS_LABELS[status] ?? status;
  const cls =
    status === "delivered" || status === "completed"
      ? "bg-green-100 text-green-700"
      : status === "processing" || status === "paid"
        ? "bg-blue-100 text-blue-700"
        : status === "pending"
          ? "bg-amber-100 text-amber-700"
          : status === "cancelled" || status === "failed"
            ? "bg-red-100 text-red-700"
            : "bg-gray-100 text-gray-700";
  return <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${cls}`}>{label}</span>;
}

const formatPrice = (v: unknown): string => {
  const n = typeof v === "string" ? parseFloat(v) || 0 : typeof v === "number" ? v : 0;
  return new Intl.NumberFormat("fa-IR").format(n);
};

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return dateStr;
  }
}

const CAN_UPDATE_STATUSES = ["paid", "processing", "delivered", "completed", "cancelled"];

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const code = params?.code as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [trackingCode, setTrackingCode] = useState("");

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    orderApi
      .getOrder(code)
      .then(setOrder)
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [code]);

  useEffect(() => {
    if (order) {
      setNewStatus(order.status);
      setTrackingCode(order.shipping_tracking_code ?? "");
    }
  }, [order]);

  const handleUpdateStatus = async () => {
    if (!order || !code || updating) return;
    setUpdating(true);
    try {
      const payload: { status?: string; shipping_tracking_code?: string } = {};
      if (newStatus !== order.status) payload.status = newStatus;
      if (trackingCode !== (order.shipping_tracking_code ?? "")) payload.shipping_tracking_code = trackingCode || undefined;
      if (Object.keys(payload).length === 0) {
        setUpdating(false);
        return;
      }
      const updated = await orderApi.updateOrder(code, payload);
      setOrder(updated);
    } catch (err) {
      console.error(err);
      alert("خطا در به‌روزرسانی سفارش");
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (!order || !code || updating || !confirm("آیا از لغو این سفارش اطمینان دارید؟")) return;
    setUpdating(true);
    try {
      await orderApi.cancelOrder(code);
      const updated = await orderApi.getOrder(code);
      setOrder(updated);
      setNewStatus(updated.status);
    } catch (err) {
      console.error(err);
      alert("خطا در لغو سفارش");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-600 mb-4">سفارش یافت نشد</p>
        <Link href="/dashboard/orders" className="text-blue-600 hover:underline">
          بازگشت به لیست سفارشات
        </Link>
      </div>
    );
  }

  const address =
    typeof order.delivery_address === "object"
      ? order.delivery_address
      : null;
  const shippingMethod =
    typeof order.shipping_method === "object"
      ? order.shipping_method
      : null;

  const canUpdate = CAN_UPDATE_STATUSES.includes(order.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard/orders" className="hover:text-blue-600">
          سفارشات
        </Link>
        <ArrowRight className="h-4 w-4 rotate-180" />
        <span className="text-gray-800 font-medium">سفارش #{order.code}</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main content */}
        <div className="flex-1 space-y-6">
          {/* Status & Actions */}
          <div className="card">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">سفارش شماره {order.code}</h1>
                <p className="text-sm text-gray-500 mt-1">تاریخ ثبت: {formatDate(order.created_at)}</p>
              </div>
              <div>{statusBadge(order.status)}</div>
            </div>

            {canUpdate && (
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
                <h3 className="font-medium text-gray-800">تغییر وضعیت و کد پیگیری</h3>
                <div className="flex flex-wrap gap-4">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="کد پیگیری مرسوله"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-w-[200px]"
                  />
                  <button
                    onClick={handleUpdateStatus}
                    disabled={updating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {updating ? "در حال ذخیره..." : "ذخیره تغییرات"}
                  </button>
                  {order.status !== "cancelled" && order.status !== "failed" && (
                    <button
                      onClick={handleCancel}
                      disabled={updating}
                      className="px-4 py-2 bg-red text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50"
                    >
                      لغو سفارش
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Order items */}
          <div className="card">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Package className="h-5 w-5" />
              اقلام سفارش
            </h2>
            <div className="divide-y divide-gray-200">
              {order.items?.map((item) => (
                <div key={item.id} className="py-4 flex items-center gap-4">
                  {item.product && typeof item.product === "object" && (item.product as { main_image?: { file?: string } }).main_image?.file ? (
                    <img
                      src={(item.product as { main_image: { file: string } }).main_image.file}
                      alt=""
                      className="h-16 w-16 rounded-lg object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium">
                      {(item.product as { title?: string })?.title ?? "محصول"}
                      {item.variant && typeof item.variant === "object" && (
                        <span className="text-gray-500 text-sm mr-2">
                          ({(item.variant as { title?: string }).title ?? ""})
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-500">تعداد: {item.quantity}</p>
                  </div>
                  <div className="text-left font-medium">
                    {formatPrice(Number(item.unit_price) * item.quantity)} تومان
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:w-80 space-y-6">
          {/* Customer */}
          <div className="card">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              مشتری
            </h2>
            {order.store_user && typeof order.store_user === "object" ? (
              <div>
                <p className="font-medium">{order.store_user.display_name}</p>
                <p className="text-sm text-gray-500">{order.store_user.user_mobile}</p>
              </div>
            ) : (
              <p className="text-gray-500">—</p>
            )}
          </div>

          {/* Address */}
          <div className="card">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              آدرس تحویل
            </h2>
            {address ? (
              <div className="text-sm space-y-1">
                <p className="font-medium">{address.recipient_fullname}</p>
                <p>{address.phone_number}</p>
                <p>{address.address_line1}</p>
                {address.postcode && <p>کد پستی: {address.postcode}</p>}
                {address.province && (
                  <p>
                    {address.province.name}
                    {address.city ? `، ${address.city.name}` : ""}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500">—</p>
            )}
          </div>

          {/* Shipping */}
          <div className="card">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Truck className="h-5 w-5" />
              روش ارسال
            </h2>
            {shippingMethod ? (
              <div className="text-sm">
                <p className="font-medium">{shippingMethod.name}</p>
                {order.shipping_tracking_code && (
                  <p className="mt-2">
                    کد پیگیری: <span className="font-mono">{order.shipping_tracking_code}</span>
                  </p>
                )}
                {order.shipping_tracking_url && (
                  <a
                    href={order.shipping_tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline block mt-1"
                  >
                    پیگیری مرسوله
                  </a>
                )}
              </div>
            ) : (
              <p className="text-gray-500">—</p>
            )}
          </div>

          {/* Totals */}
          <div className="card bg-gray-50">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">جمع محصولات</span>
                <span>{formatPrice(order.products_total_amount)} تومان</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">هزینه ارسال</span>
                <span>{formatPrice(order.delivery_amount)} تومان</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200">
                <span>مبلغ قابل پرداخت</span>
                <span>{formatPrice(order.payable_amount)} تومان</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
