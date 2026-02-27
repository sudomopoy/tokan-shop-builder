"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, CheckSquare, Square, Check, X } from "lucide-react";
import { productApi } from "@/lib/api";
import type { Product } from "@/lib/api/productApi";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productApi.list({
        page_size: 50,
        search: search || undefined,
      });
      setProducts(res.results ?? []);
      setSelectedIds(new Set());
    } catch (err) {
      console.error(err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`آیا از حذف محصول «${title}» اطمینان دارید؟`)) return;
    try {
      await productApi.delete(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
      alert("خطا در حذف محصول");
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map((p) => p.id)));
    }
  };

  const handleBulkAction = async (
    action: "activate" | "deactivate" | "delete"
  ) => {
    if (selectedIds.size === 0) return;
    const msg =
      action === "delete"
        ? `آیا از حذف ${selectedIds.size} محصول اطمینان دارید؟`
        : `آیا از ${action === "activate" ? "فعال" : "غیرفعال"}‌سازی ${selectedIds.size} محصول اطمینان دارید؟`;
    if (!confirm(msg)) return;
    setBulkLoading(true);
    try {
      await productApi.bulkAction(Array.from(selectedIds), action);
      setSelectedIds(new Set());
      await fetchProducts();
    } catch (err) {
      console.error(err);
      alert("خطا در انجام عملیات گروهی");
    } finally {
      setBulkLoading(false);
    }
  };

  const allSelected = products.length > 0 && selectedIds.size === products.length;
  const someSelected = selectedIds.size > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h1 className="text-3xl font-bold">مدیریت محصولات</h1>
        <Link
          href="/dashboard/products/new"
          className="btn-primary inline-flex items-center gap-2 w-fit"
        >
          <Plus className="h-5 w-5" />
          افزودن محصول
        </Link>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          placeholder="جستجوی محصول..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button type="submit" className="btn-secondary">
          جستجو
        </button>
      </form>

      {someSelected && (
        <div className="flex flex-wrap items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm font-medium text-blue-800">
            {selectedIds.size} محصول انتخاب شده
          </span>
          <button
            onClick={() => handleBulkAction("activate")}
            disabled={bulkLoading}
            className="btn-secondary text-sm inline-flex items-center gap-1"
          >
            <Check className="h-4 w-4" />
            فعال‌سازی
          </button>
          <button
            onClick={() => handleBulkAction("deactivate")}
            disabled={bulkLoading}
            className="btn-secondary text-sm inline-flex items-center gap-1"
          >
            <X className="h-4 w-4" />
            غیرفعال‌سازی
          </button>
          <button
            onClick={() => handleBulkAction("delete")}
            disabled={bulkLoading}
            className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 inline-flex items-center gap-1"
          >
            <Trash2 className="h-4 w-4" />
            حذف
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right w-10">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="p-1 text-gray-500 hover:text-blue-600"
                      title={allSelected ? "لغو انتخاب همه" : "انتخاب همه"}
                    >
                      {allSelected ? (
                        <CheckSquare className="h-5 w-5" />
                      ) : (
                        <Square className="h-5 w-5" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    وضعیت
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    محصول
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    کد
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    قیمت
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    موجودی
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase sticky right-0 bg-gray-50 z-10 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.05)]">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      محصولی یافت نشد
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="group hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => toggleSelect(product.id)}
                          className="p-1 text-gray-500 hover:text-blue-600"
                        >
                          {selectedIds.has(product.id) ? (
                            <CheckSquare className="h-5 w-5 text-blue-600" />
                          ) : (
                            <Square className="h-5 w-5" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs rounded ${
                            product.is_active !== false
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {product.is_active !== false ? "فعال" : "غیرفعال"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {product.main_image?.file ? (
                            <img
                              src={product.main_image.file}
                              alt=""
                              className="h-10 w-10 rounded object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded bg-gray-200" />
                          )}
                          <span className="font-medium">{product.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {product.code}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {Number(
                          product.sell_price || product.price
                        ).toLocaleString()}{" "}
                        تومان
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {product.stock_unlimited ? "∞ نامحدود" : product.stock}
                      </td>
                      <td className="px-6 py-4 sticky right-0 bg-white group-hover:bg-gray-50 z-10 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.05)]">
                        <div className="flex gap-2 justify-end">
                          <Link
                            href={`/dashboard/products/${product.id}/edit`}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="ویرایش"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() =>
                              handleDelete(product.id, product.title)
                            }
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                            title="حذف"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
