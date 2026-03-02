"use client";

import { Plus, Trash2 } from "lucide-react";

import type { CustomerGroup } from "@/lib/api/customerGroupApi";
import type { FormVariant } from "./ProductVariantSection";

const inputClass =
  "w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";

export type ProductGroupPriceInput = {
  id?: string;
  customer_group_id: string;
  variant_id?: string | null;
  price: string;
  sell_price: string;
  is_active: boolean;
};

export type ProductQuantityDiscountInput = {
  id?: string;
  customer_group_id?: string | null;
  min_quantity: string;
  max_quantity?: string;
  discount_percent: string;
  is_active: boolean;
};

type ProductB2BSectionProps = {
  customerGroups: CustomerGroup[];
  hasVariantsEnabled: boolean;
  variants: FormVariant[];
  isWholesaleMode: boolean;
  onIsWholesaleModeChange: (value: boolean) => void;
  minOrderQuantity: string;
  onMinOrderQuantityChange: (value: string) => void;
  maxOrderQuantity: string;
  onMaxOrderQuantityChange: (value: string) => void;
  packSize: string;
  onPackSizeChange: (value: string) => void;
  minPackCount: string;
  onMinPackCountChange: (value: string) => void;
  allowedCustomerGroupIds: string[];
  onAllowedCustomerGroupIdsChange: (value: string[]) => void;
  groupPrices: ProductGroupPriceInput[];
  onGroupPricesChange: (rows: ProductGroupPriceInput[]) => void;
  quantityDiscounts: ProductQuantityDiscountInput[];
  onQuantityDiscountsChange: (rows: ProductQuantityDiscountInput[]) => void;
};

function variantLabel(variant: FormVariant, index: number): string {
  if (!variant.selections?.length) return `Variant #${index + 1}`;
  return variant.selections
    .map((s) => `${s.attribute_id.slice(0, 6)}:${s.value_id.slice(0, 6)}`)
    .join(" | ");
}

export function ProductB2BSection({
  customerGroups,
  hasVariantsEnabled,
  variants,
  isWholesaleMode,
  onIsWholesaleModeChange,
  minOrderQuantity,
  onMinOrderQuantityChange,
  maxOrderQuantity,
  onMaxOrderQuantityChange,
  packSize,
  onPackSizeChange,
  minPackCount,
  onMinPackCountChange,
  allowedCustomerGroupIds,
  onAllowedCustomerGroupIdsChange,
  groupPrices,
  onGroupPricesChange,
  quantityDiscounts,
  onQuantityDiscountsChange,
}: ProductB2BSectionProps) {
  const canUseVariantPricing = !isWholesaleMode && hasVariantsEnabled && variants.length > 0;

  const toggleAllowedGroup = (groupId: string) => {
    if (allowedCustomerGroupIds.includes(groupId)) {
      onAllowedCustomerGroupIdsChange(allowedCustomerGroupIds.filter((id) => id !== groupId));
      return;
    }
    onAllowedCustomerGroupIdsChange([...allowedCustomerGroupIds, groupId]);
  };

  const addGroupPriceRow = () => {
    onGroupPricesChange([
      ...groupPrices,
      {
        customer_group_id: "",
        variant_id: null,
        price: "",
        sell_price: "",
        is_active: true,
      },
    ]);
  };

  const updateGroupPriceRow = (index: number, next: Partial<ProductGroupPriceInput>) => {
    const rows = [...groupPrices];
    rows[index] = { ...rows[index], ...next };
    onGroupPricesChange(rows);
  };

  const removeGroupPriceRow = (index: number) => {
    onGroupPricesChange(groupPrices.filter((_, idx) => idx !== index));
  };

  const addQuantityDiscountRow = () => {
    onQuantityDiscountsChange([
      ...quantityDiscounts,
      {
        customer_group_id: null,
        min_quantity: "1",
        max_quantity: "",
        discount_percent: "",
        is_active: true,
      },
    ]);
  };

  const updateQuantityDiscountRow = (index: number, next: Partial<ProductQuantityDiscountInput>) => {
    const rows = [...quantityDiscounts];
    rows[index] = { ...rows[index], ...next };
    onQuantityDiscountsChange(rows);
  };

  const removeQuantityDiscountRow = (index: number) => {
    onQuantityDiscountsChange(quantityDiscounts.filter((_, idx) => idx !== index));
  };

  return (
    <section className="card p-4 space-y-6">
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-2">B2B / Wholesale</h3>
        <p className="text-xs text-gray-500">
          Configure wholesale rules, customer-group pricing, and quantity-based discounts.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 p-4 space-y-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isWholesaleMode}
            onChange={(e) => onIsWholesaleModeChange(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-800">Enable wholesale mode</span>
        </label>
        <p className="text-xs text-gray-500">
          In wholesale mode, variant purchase is disabled and quantity rules are enforced at product level.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className={labelClass}>Min quantity</label>
            <input
              type="number"
              min={1}
              value={minOrderQuantity}
              onChange={(e) => onMinOrderQuantityChange(e.target.value)}
              className={inputClass}
              placeholder="optional"
            />
          </div>
          <div>
            <label className={labelClass}>Max quantity</label>
            <input
              type="number"
              min={1}
              value={maxOrderQuantity}
              onChange={(e) => onMaxOrderQuantityChange(e.target.value)}
              className={inputClass}
              placeholder="optional"
            />
          </div>
          <div>
            <label className={labelClass}>Pack size</label>
            <input
              type="number"
              min={1}
              value={packSize}
              onChange={(e) => onPackSizeChange(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Min pack count</label>
            <input
              type="number"
              min={1}
              value={minPackCount}
              onChange={(e) => onMinPackCountChange(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 p-4 space-y-3">
        <h4 className="text-sm font-semibold text-gray-800">Allowed Customer Groups</h4>
        {customerGroups.length === 0 ? (
          <p className="text-sm text-gray-500">No customer group exists yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {customerGroups.map((group) => (
              <label
                key={group.id}
                className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={allowedCustomerGroupIds.includes(group.id)}
                  onChange={() => toggleAllowedGroup(group.id)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm text-gray-700">{group.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-semibold text-gray-800">Group Pricing Rules</h4>
          <button
            type="button"
            onClick={addGroupPriceRow}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            <Plus className="w-4 h-4" />
            Add Rule
          </button>
        </div>
        {groupPrices.length === 0 ? (
          <p className="text-sm text-gray-500">No group-specific price rule.</p>
        ) : (
          <div className="space-y-2">
            {groupPrices.map((row, index) => (
              <div key={row.id ?? `gpr-${index}`} className="grid grid-cols-1 lg:grid-cols-12 gap-2 border border-gray-200 rounded-lg p-2">
                <div className="lg:col-span-3">
                  <label className={labelClass}>Customer group</label>
                  <select
                    value={row.customer_group_id}
                    onChange={(e) => updateGroupPriceRow(index, { customer_group_id: e.target.value })}
                    className={inputClass}
                  >
                    <option value="">Select group</option>
                    {customerGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="lg:col-span-3">
                  <label className={labelClass}>Variant (optional)</label>
                  <select
                    value={row.variant_id ?? ""}
                    onChange={(e) => updateGroupPriceRow(index, { variant_id: e.target.value || null })}
                    className={inputClass}
                    disabled={!canUseVariantPricing}
                  >
                    <option value="">Product level</option>
                    {canUseVariantPricing &&
                      variants.map((variant, variantIndex) => (
                        <option key={variant.id ?? `new-${variantIndex}`} value={variant.id ?? ""}>
                          {variant.id ? variantLabel(variant, variantIndex) : `Unsaved variant #${variantIndex + 1}`}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="lg:col-span-2">
                  <label className={labelClass}>Base price</label>
                  <input
                    type="number"
                    min={0}
                    value={row.price}
                    onChange={(e) => updateGroupPriceRow(index, { price: e.target.value })}
                    className={inputClass}
                    placeholder="optional"
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className={labelClass}>Sell price</label>
                  <input
                    type="number"
                    min={0}
                    value={row.sell_price}
                    onChange={(e) => updateGroupPriceRow(index, { sell_price: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div className="lg:col-span-2 flex items-end gap-2">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={row.is_active}
                      onChange={(e) => updateGroupPriceRow(index, { is_active: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600"
                    />
                    Active
                  </label>
                  <button
                    type="button"
                    onClick={() => removeGroupPriceRow(index)}
                    className="ml-auto p-2 text-red-600 hover:bg-red-50 rounded"
                    aria-label="Remove row"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-semibold text-gray-800">Product Quantity Discounts</h4>
          <button
            type="button"
            onClick={addQuantityDiscountRow}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            <Plus className="w-4 h-4" />
            Add Tier
          </button>
        </div>
        {quantityDiscounts.length === 0 ? (
          <p className="text-sm text-gray-500">No quantity discount tier.</p>
        ) : (
          <div className="space-y-2">
            {quantityDiscounts.map((row, index) => (
              <div key={row.id ?? `qdr-${index}`} className="grid grid-cols-1 lg:grid-cols-12 gap-2 border border-gray-200 rounded-lg p-2">
                <div className="lg:col-span-3">
                  <label className={labelClass}>Customer group</label>
                  <select
                    value={row.customer_group_id ?? ""}
                    onChange={(e) => updateQuantityDiscountRow(index, { customer_group_id: e.target.value || null })}
                    className={inputClass}
                  >
                    <option value="">All groups</option>
                    {customerGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="lg:col-span-2">
                  <label className={labelClass}>Min qty</label>
                  <input
                    type="number"
                    min={1}
                    value={row.min_quantity}
                    onChange={(e) => updateQuantityDiscountRow(index, { min_quantity: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className={labelClass}>Max qty</label>
                  <input
                    type="number"
                    min={1}
                    value={row.max_quantity ?? ""}
                    onChange={(e) => updateQuantityDiscountRow(index, { max_quantity: e.target.value })}
                    className={inputClass}
                    placeholder="optional"
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className={labelClass}>Discount %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    value={row.discount_percent}
                    onChange={(e) => updateQuantityDiscountRow(index, { discount_percent: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div className="lg:col-span-3 flex items-end gap-2">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={row.is_active}
                      onChange={(e) => updateQuantityDiscountRow(index, { is_active: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600"
                    />
                    Active
                  </label>
                  <button
                    type="button"
                    onClick={() => removeQuantityDiscountRow(index)}
                    className="ml-auto p-2 text-red-600 hover:bg-red-50 rounded"
                    aria-label="Remove row"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

