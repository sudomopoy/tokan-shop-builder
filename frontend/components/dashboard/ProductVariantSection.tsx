"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Pencil,
  X,
} from "lucide-react";
import { variantApi } from "@/lib/api";
import type {
  VariantAttribute,
  VariantAttributeValue,
  VariantSelection,
} from "@/lib/api/variantApi";

export type FormVariant = {
  id?: string;
  price: string;
  sell_price: string;
  stock: number;
  stock_unlimited?: boolean;
  selections: VariantSelection[];
};

type ProductVariantSectionProps = {
  variants: FormVariant[];
  onChange: (variants: FormVariant[]) => void;
  existingVariants?: unknown[];
  /** قیمت و قیمت فروش محصول - به‌صورت پیش‌فرض برای تنوع‌های جدید استفاده می‌شود */
  productPrice?: string;
  productSellPrice?: string;
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\u0600-\u06FF-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function ProductVariantSection({
  variants,
  onChange,
  existingVariants = [],
  productPrice = "0",
  productSellPrice,
}: ProductVariantSectionProps) {
  const defaultPrice = productPrice || "0";
  const defaultSellPrice = productSellPrice ?? productPrice ?? "0";
  const [attributes, setAttributes] = useState<VariantAttribute[]>([]);
  const [valuesByAttr, setValuesByAttr] = useState<Record<string, VariantAttributeValue[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedAttrs, setExpandedAttrs] = useState<Set<string>>(new Set());
  /** ویژگی‌هایی که برای این محصول انتخاب شده‌اند - فقط این‌ها در تنوع نمایش داده می‌شوند */
  const [selectedAttrIds, setSelectedAttrIds] = useState<Set<string>>(new Set());
  const [newAttrTitle, setNewAttrTitle] = useState("");
  const [addingAttr, setAddingAttr] = useState(false);
  const [newValueByAttr, setNewValueByAttr] = useState<Record<string, string>>({});
  const [editingVariantIdx, setEditingVariantIdx] = useState<number | null>(null);
  const [applyToAllValue, setApplyToAllValue] = useState("");
  const [applyToAllField, setApplyToAllField] = useState<"price" | "sell_price" | "stock" | "stock_unlimited">("sell_price");

  const loadAttributes = useCallback(async () => {
    try {
      const attrs = await variantApi.listAttributes();
      setAttributes(attrs);
      const map: Record<string, VariantAttributeValue[]> = {};
      for (const a of attrs) {
        map[a.id] = await variantApi.getAttributeValues(a.id);
      }
      setValuesByAttr(map);
    } catch {
      setAttributes([]);
      setValuesByAttr({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAttributes();
  }, [loadAttributes]);

  const initializedFromVariants = useRef(false);
  /** از تنوع‌های موجود، ویژگی‌های استفاده‌شده را استخراج و یک‌بار انتخاب کن */
  useEffect(() => {
    if (initializedFromVariants.current || attributes.length === 0) return;
    const usedAttrIds = new Set<string>();
    for (const v of variants) {
      for (const s of v.selections ?? []) {
        if (s.attribute_id) usedAttrIds.add(s.attribute_id);
      }
    }
    if (usedAttrIds.size > 0) {
      setSelectedAttrIds(usedAttrIds);
      initializedFromVariants.current = true;
    }
  }, [attributes.length, variants]);

  const toggleProductAttr = (attrId: string) => {
    setSelectedAttrIds((prev) => {
      const next = new Set(prev);
      if (next.has(attrId)) {
        next.delete(attrId);
        onChange(
          variants.map((v) => ({
            ...v,
            selections: v.selections.filter((s) => s.attribute_id !== attrId),
          }))
        );
      } else {
        next.add(attrId);
      }
      return next;
    });
  };

  const toggleAttr = (id: string) => {
    setExpandedAttrs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddAttribute = async () => {
    const title = newAttrTitle.trim();
    if (!title) return;
    setAddingAttr(true);
    try {
      const attr = await variantApi.createAttribute({ title, slug: slugify(title) });
      setAttributes((a) => [...a, attr]);
      setValuesByAttr((v) => ({ ...v, [attr.id]: [] }));
      setNewAttrTitle("");
    } catch {
      // error
    } finally {
      setAddingAttr(false);
    }
  };

  const handleDeleteAttribute = async (id: string) => {
    try {
      await variantApi.deleteAttribute(id);
      setAttributes((a) => a.filter((x) => x.id !== id));
      setValuesByAttr((v) => {
        const next = { ...v };
        delete next[id];
        return next;
      });
      onChange(
        variants.map((v) => ({
          ...v,
          selections: v.selections.filter((s) => s.attribute_id !== id),
        }))
      );
    } catch {
      // error
    }
  };

  const handleAddValue = async (attrId: string) => {
    const title = (newValueByAttr[attrId] ?? "").trim();
    if (!title) return;
    try {
      const val = await variantApi.addAttributeValue(attrId, { title });
      setValuesByAttr((v) => ({
        ...v,
        [attrId]: [...(v[attrId] ?? []), val],
      }));
      setNewValueByAttr((n) => ({ ...n, [attrId]: "" }));
    } catch {
      // error
    }
  };

  const handleDeleteValue = async (valId: string, attrId: string) => {
    try {
      await variantApi.deleteAttributeValue(valId);
      setValuesByAttr((v) => ({
        ...v,
        [attrId]: (v[attrId] ?? []).filter((x) => x.id !== valId),
      }));
    } catch {
      // error
    }
  };

  const addVariant = () => {
    onChange([
      ...variants,
      {
        price: defaultPrice,
        sell_price: defaultSellPrice,
        stock: 0,
        stock_unlimited: false,
        selections: [],
      },
    ]);
    setEditingVariantIdx(variants.length);
  };

  const updateVariant = (idx: number, updates: Partial<FormVariant>) => {
    const next = [...variants];
    next[idx] = { ...next[idx], ...updates };
    onChange(next);
    setEditingVariantIdx(null);
  };

  const removeVariant = (idx: number) => {
    onChange(variants.filter((_, i) => i !== idx));
    setEditingVariantIdx(null);
  };

  const cancelEdit = (idx: number) => {
    const v = variants[idx];
    if (!v?.id) {
      removeVariant(idx);
    } else {
      setEditingVariantIdx(null);
    }
  };

  const applyToAll = () => {
    const val = applyToAllValue.trim();
    if (!val || variants.length === 0) return;
    if (applyToAllField === "stock_unlimited") {
      const unlim = ["1", "true", "بله", "yes"].includes(val.toLowerCase());
      onChange(variants.map((v) => ({ ...v, stock_unlimited: unlim })));
      return;
    }
    const numVal = applyToAllField === "stock" ? parseInt(val, 10) : val;
    if (applyToAllField === "stock" && isNaN(numVal as number)) return;
    const updated = variants.map((v) => ({
      ...v,
      ...(applyToAllField === "price" && { price: String(numVal) }),
      ...(applyToAllField === "sell_price" && { sell_price: String(numVal) }),
      ...(applyToAllField === "stock" && { stock: typeof numVal === "number" ? numVal : 0, stock_unlimited: false }),
    }));
    onChange(updated);
  };

  const productAttrs = attributes.filter((a) => selectedAttrIds.has(a.id));

  /** ساخت همه ترکیبات ممکن از مقادیر ویژگی‌های انتخاب‌شده */
  const buildAllPossibleVariants = () => {
    if (productAttrs.length === 0) return;
    const attrValues: { attribute_id: string; value_id: string }[][] = productAttrs.map(
      (attr) =>
        (valuesByAttr[attr.id] ?? []).map((v) => ({
          attribute_id: attr.id,
          value_id: v.id,
        }))
    );
    if (attrValues.some((arr) => arr.length === 0)) return;

    function cartesian<T>(arr: T[][]): T[][] {
      if (arr.length === 0) return [[]];
      const [first, ...rest] = arr;
      const restComb = cartesian(rest);
      return first!.flatMap((item) => restComb.map((r) => [item, ...r]));
    }

    const combinations = cartesian(attrValues) as {
      attribute_id: string;
      value_id: string;
    }[][];

    const newVariants: FormVariant[] = combinations.map((combo) => ({
      price: defaultPrice,
      sell_price: defaultSellPrice,
      stock: 0,
      stock_unlimited: false,
      selections: combo,
    }));

    onChange(newVariants);
    setEditingVariantIdx(null);
  };

  const canBuildAll =
    productAttrs.length > 0 &&
    productAttrs.every((a) => (valuesByAttr[a.id] ?? []).length > 0);

  const getVariantLabel = (v: FormVariant) => {
    if (v.selections.length === 0) return "پایه";
    return v.selections
      .map((s) => {
        const attr = productAttrs.find((a) => a.id === s.attribute_id);
        const val = (valuesByAttr[s.attribute_id] ?? []).find((x) => x.id === s.value_id);
        return attr && val ? `${attr.title}: ${val.title}` : "";
      })
      .filter(Boolean)
      .join(" • ");
  };

  if (loading) {
    return (
      <div className="animate-pulse h-24 bg-gray-100 rounded-lg" />
    );
  }

  return (
    <div className="space-y-6">
      {/* Variant types */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-1">انواع ویژگی (رنگ، سایز، …)</h3>
        <p className="text-sm text-gray-500 mb-3">
          ویژگی‌هایی که برای این محصول استفاده می‌کنید را انتخاب کنید. فقط ویژگی‌های انتخاب‌شده در قسمت تنوع نمایش داده می‌شوند.
        </p>
        <div className="space-y-2">
          {attributes.map((attr) => (
            <div key={attr.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <div
                className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer"
                onClick={() => toggleAttr(attr.id)}
              >
                <div className="flex items-center gap-3">
                  <label
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={selectedAttrIds.has(attr.id)}
                      onChange={() => toggleProductAttr(attr.id)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">برای این محصول</span>
                  </label>
                  <span className="font-medium">{attr.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  {!attr.is_system && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAttribute(attr.id);
                      }}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                  {expandedAttrs.has(attr.id) ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </div>
              </div>
              {expandedAttrs.has(attr.id) && (
                <div className="p-3 border-t border-gray-200 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {(valuesByAttr[attr.id] ?? []).map((val) => (
                      <span
                        key={val.id}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-gray-200 rounded text-sm"
                      >
                        {val.title}
                        <button
                          type="button"
                          onClick={() => handleDeleteValue(val.id, attr.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newValueByAttr[attr.id] ?? ""}
                      onChange={(e) =>
                        setNewValueByAttr((n) => ({ ...n, [attr.id]: e.target.value }))
                      }
                      placeholder="مقدار جدید"
                      className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                      onKeyDown={(e) =>
                        e.key === "Enter" && (e.preventDefault(), handleAddValue(attr.id))
                      }
                    />
                    <button
                      type="button"
                      onClick={() => handleAddValue(attr.id)}
                      className="btn-secondary text-sm"
                    >
                      افزودن
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <input
              type="text"
              value={newAttrTitle}
              onChange={(e) => setNewAttrTitle(e.target.value)}
              placeholder="نوع ویژگی جدید (مثلاً حجم)"
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg"
              onKeyDown={(e) =>
                e.key === "Enter" && (e.preventDefault(), handleAddAttribute())
              }
            />
            <button
              type="button"
              onClick={handleAddAttribute}
              disabled={addingAttr || !newAttrTitle.trim()}
              className="btn-primary disabled:opacity-50 flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              افزودن نوع
            </button>
          </div>
        </div>
      </div>

      {/* Product variants */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-1">تنوع محصول</h3>
        {productAttrs.length > 0 ? (
          <p className="text-sm text-gray-500 mb-3">
            تنوع‌ها بر اساس ویژگی‌های انتخاب‌شده: {productAttrs.map((a) => a.title).join("، ")}
          </p>
        ) : (
          <p className="text-sm text-amber-600 mb-3">
            برای تعیین تنوع، حداقل یک ویژگی در بخش بالا انتخاب کنید. در غیر این صورت یک تنوع پایه اضافه کنید.
          </p>
        )}

        {variants.length > 0 && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700">اعمال به همه:</span>
            <input
              type={applyToAllField === "stock" ? "number" : "text"}
              value={applyToAllValue}
              onChange={(e) => setApplyToAllValue(e.target.value)}
              placeholder={
                applyToAllField === "stock"
                  ? "موجودی"
                  : applyToAllField === "stock_unlimited"
                  ? "۱=نامحدود، ۰=محدود"
                  : applyToAllField === "price"
                  ? "قیمت"
                  : "قیمت فروش"
              }
              className="w-28 px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
            />
            <select
              value={applyToAllField}
              onChange={(e) =>
                setApplyToAllField(e.target.value as "price" | "sell_price" | "stock" | "stock_unlimited")
              }
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
            >
              <option value="price">قیمت</option>
              <option value="sell_price">قیمت فروش</option>
              <option value="stock">موجودی</option>
              <option value="stock_unlimited">موجودی نامحدود</option>
            </select>
            <button
              type="button"
              onClick={applyToAll}
              disabled={!applyToAllValue.trim()}
              className="btn-primary text-sm disabled:opacity-50"
            >
              اعمال به همه
            </button>
          </div>
        )}

        <div className="space-y-2 mb-4">
          {variants.map((v, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
            >
              {editingVariantIdx === idx ? (
                <VariantEditForm
                  variant={v}
                  attributes={attributes.filter((a) => selectedAttrIds.has(a.id))}
                  valuesByAttr={valuesByAttr}
                  onSave={(updates) => updateVariant(idx, updates)}
                  onCancel={() => cancelEdit(idx)}
                />
              ) : (
                <>
                  <div className="flex-1">
                    <span className="font-medium">{getVariantLabel(v)}</span>
                    <span className="text-gray-500 text-sm mr-3">
                      قیمت: {v.sell_price} | موجودی: {v.stock_unlimited ? "∞" : v.stock}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingVariantIdx(idx)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeVariant(idx)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={addVariant}
            className="btn-secondary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            افزودن تنوع
          </button>
          {canBuildAll && (
            <button
              type="button"
              onClick={buildAllPossibleVariants}
              className="btn-primary flex items-center gap-2"
            >
              ساخت همه تنوع‌های ممکن
            </button>
          )}
        </div>

        {variants.length === 0 && (
          <p className="text-sm text-gray-500 mt-2">
            اگر محصول تنوع ندارد، یک تنوع پایه با قیمت و موجودی کلی اضافه کنید.
          </p>
        )}
      </div>
    </div>
  );
}

type VariantEditFormProps = {
  variant: FormVariant;
  attributes: VariantAttribute[];
  valuesByAttr: Record<string, VariantAttributeValue[]>;
  onSave: (v: FormVariant) => void;
  onCancel: () => void;
};

function VariantEditForm({
  variant,
  attributes,
  valuesByAttr,
  onSave,
  onCancel,
}: VariantEditFormProps) {
  const [price, setPrice] = useState(variant.price);
  const [sellPrice, setSellPrice] = useState(variant.sell_price);
  const [stock, setStock] = useState(variant.stock);
  const [stockUnlimited, setStockUnlimited] = useState(variant.stock_unlimited ?? false);
  const [selections, setSelections] = useState<VariantSelection[]>(variant.selections);

  const updateSelection = (attrId: string, valueId: string | null) => {
    setSelections((prev) => {
      const rest = prev.filter((s) => s.attribute_id !== attrId);
      if (valueId) return [...rest, { attribute_id: attrId, value_id: valueId }];
      return rest;
    });
  };

  const handleSave = () => {
    onSave({
      ...variant,
      price,
      sell_price: sellPrice,
      stock,
      stock_unlimited: stockUnlimited,
      selections,
    });
  };

  return (
    <div className="w-full space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {attributes.map((attr) => (
          <div key={attr.id}>
            <label className="block text-xs text-gray-600 mb-0.5">{attr.title}</label>
            <select
              value={
                selections.find((s) => s.attribute_id === attr.id)?.value_id ?? ""
              }
              onChange={(e) =>
                updateSelection(attr.id, e.target.value || null)
              }
              className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm"
            >
              <option value="">—</option>
              {(valuesByAttr[attr.id] ?? []).map((val) => (
                <option key={val.id} value={val.id}>
                  {val.title}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-xs text-gray-600 mb-0.5">قیمت</label>
          <input
            type="text"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-0.5">قیمت فروش</label>
          <input
            type="text"
            value={sellPrice}
            onChange={(e) => setSellPrice(e.target.value)}
            className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-0.5">موجودی</label>
          <label className="flex items-center gap-1.5 mb-1 cursor-pointer">
            <input
              type="checkbox"
              checked={stockUnlimited}
              onChange={(e) => setStockUnlimited(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600"
            />
            <span className="text-xs text-gray-600">نامحدود</span>
          </label>
          <input
            type="number"
            min="0"
            value={stock}
            onChange={(e) => setStock(Number(e.target.value))}
            disabled={stockUnlimited}
            className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm disabled:bg-gray-100"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={handleSave} className="btn-primary text-sm">
          ذخیره
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary text-sm">
          انصراف
        </button>
      </div>
    </div>
  );
}
