"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { tFrontendAuto } from "@/lib/i18n/autoMessages";

export type SearchableSelectOption = {
  value: string;
  label: string;
};

type SearchableSelectProps = {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  searchPlaceholder?: string;
  className?: string;
  /** برای APIهای صفحه‌بندی‌شده: لود بیشتر هنگام اسکرول */
  loadMore?: () => Promise<void>;
  hasMore?: boolean;
  loadingMore?: boolean;
  /** حداقل کاراکتر برای نمایش نتایج جستجو (پیش‌فرض 0) */
  minSearchLength?: number;
};

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = {tFrontendAuto("fe.102da55e19a2")},
  disabled = false,
  searchPlaceholder = "جستجو...",
  className = "",
  loadMore,
  hasMore = false,
  loadingMore = false,
  minSearchLength = 0,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = search.trim().length >= minSearchLength
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(search.toLowerCase()) ||
          o.value.toLowerCase().includes(search.toLowerCase())
      )
    : options;

  const selectedLabel = options.find((o) => o.value === value)?.label ?? (value || placeholder);

  const handleScroll = useCallback(() => {
    if (!loadMore || !hasMore || loadingMore) return;
    const el = listRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollHeight - scrollTop - clientHeight < 80) {
      loadMore();
    }
  }, [loadMore, hasMore, loadingMore]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const handleSelect = (v: string) => {
    onChange(v);
    setOpen(false);
    setSearch("");
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className={`w-full px-4 py-2 border border-gray-200 rounded-lg text-right flex items-center justify-between gap-2 bg-white ${
          disabled ? "opacity-50 cursor-not-allowed" : "hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        }`}
      >
        <span className="truncate flex-1 min-w-0">
          {selectedLabel}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
            <div className="p-2 border-b border-gray-100">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                autoFocus
              />
            </div>
            <div
              ref={listRef}
              className="max-h-64 overflow-y-auto py-1"
            >
              {filtered.length === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-500">{tFrontendAuto("fe.8cee2709e588")}</p>
              ) : (
                <>
                  {filtered.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelect(opt.value)}
                      className={`w-full px-4 py-2.5 text-right text-sm hover:bg-gray-50 transition ${
                        opt.value === value ? "bg-blue-50 text-blue-700 font-medium" : ""
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                  {loadingMore && (
                    <div className="px-4 py-2 text-center text-sm text-gray-500">
                      در حال بارگذاری...
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
