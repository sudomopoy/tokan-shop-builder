"use client";

import { useEffect, useState } from "react";
import { ImageIcon, Upload, FolderOpen, X } from "lucide-react";
import { categoryApi, type CategoryIconChoice } from "@/lib/api/categoryApi";
import type { Media } from "@/lib/api/productApi";
import { FileManagerModal } from "@/components/FileManagerModal";
import { tFrontendAuto } from "@/lib/i18n/autoMessages";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080";

const PRESET_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1",
  "#14B8A6", "#F43F5E", "#A855F7", "#64748B", "#0EA5E9",
  "#22C55E", "#EAB308", "#DC2626", "#7C3AED", "#DB2777",
];

function getIconUrl(iconKey: string, color?: string | null): string {
  const base = `${API_BASE.replace(/\/$/, "")}/category/icon/${iconKey}/`;
  if (color) {
    return `${base}?color=${encodeURIComponent(color)}`;
  }
  return base;
}

function getMediaUrl(media: Media): string {
  const file = media.file;
  if (!file) return "";
  if (file.startsWith("http")) return file;
  return `${API_BASE.replace(/\/$/, "")}${file.startsWith("/") ? "" : "/"}${file}`;
}

export type CategoryIconValue = {
  type: "none" | "default" | "uploaded";
  default_icon?: string | null;
  icon_color?: string | null;
  icon_id?: string | null;
  icon?: Media | null;
};

type CategoryIconSelectorProps = {
  value: CategoryIconValue;
  onChange: (v: CategoryIconValue) => void;
};

export function CategoryIconSelector({ value, onChange }: CategoryIconSelectorProps) {
  const [icons, setIcons] = useState<CategoryIconChoice[]>([]);
  const [loadingIcons, setLoadingIcons] = useState(true);
  const [fileManagerOpen, setFileManagerOpen] = useState(false);
  const [customColor, setCustomColor] = useState(value.icon_color || "#3B82F6");

  useEffect(() => {
    categoryApi
      .iconChoices()
      .then(setIcons)
      .catch(() => setIcons([]))
      .finally(() => setLoadingIcons(false));
  }, []);

  const selectNone = () => {
    onChange({
      type: "none",
      default_icon: null,
      icon_color: null,
      icon_id: null,
      icon: null,
    });
  };

  const selectDefaultIcon = (iconKey: string, color?: string) => {
    const c = color ?? customColor;
    onChange({
      type: "default",
      default_icon: iconKey,
      icon_color: c,
      icon_id: null,
      icon: null,
    });
  };

  const selectUploaded = (media: Media) => {
    onChange({
      type: "uploaded",
      default_icon: null,
      icon_color: null,
      icon_id: media.id,
      icon: media,
    });
    setFileManagerOpen(false);
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        آیکون دسته‌بندی
      </label>

      {/* Mode: none / default / uploaded */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={selectNone}
          className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
            value.type === "none"
              ? "border-blue-500 bg-blue-50 text-blue-700"
              : "border-gray-200 hover:border-gray-300 text-gray-600"
          }`}
        >
          بدون آیکون
        </button>
        <button
          type="button"
          onClick={() => {
            if (value.type !== "default") {
              selectDefaultIcon(icons[0]?.value ?? "default", customColor);
            }
          }}
          className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-colors flex items-center gap-2 ${
            value.type === "default"
              ? "border-blue-500 bg-blue-50 text-blue-700"
              : "border-gray-200 hover:border-gray-300 text-gray-600"
          }`}
        >
          <ImageIcon className="h-4 w-4" />
          آیکون آماده
        </button>
        <button
          type="button"
          onClick={() => {
            onChange({
              type: "uploaded",
              default_icon: null,
              icon_color: null,
              icon_id: null,
              icon: null,
            });
            setFileManagerOpen(true);
          }}
          className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-colors flex items-center gap-2 ${
            value.type === "uploaded"
              ? "border-blue-500 bg-blue-50 text-blue-700"
              : "border-gray-200 hover:border-gray-300 text-gray-600"
          }`}
        >
          <Upload className="h-4 w-4" />
          آپلود عکس
        </button>
      </div>

      {/* Preview when selected */}
      {(value.type === "default" || value.type === "uploaded") && (
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          {value.type === "default" && value.default_icon && (
            <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-white border border-gray-200 overflow-hidden">
              <img
                src={getIconUrl(value.default_icon, value.icon_color)}
                alt=""
                className="w-8 h-8 object-contain"
              />
            </div>
          )}
          {value.type === "uploaded" && value.icon && (
            <img
              src={getMediaUrl(value.icon)}
              alt=""
              className="w-12 h-12 object-cover rounded-lg border border-gray-200"
            />
          )}
          <div className="flex-1 text-sm text-gray-600">
            {value.type === "default" && "آیکون پیش‌فرض انتخاب شده"}
            {value.type === "uploaded" && "عکس آپلود شده"}
          </div>
          <button
            type="button"
            onClick={selectNone}
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
            title={tFrontendAuto("fe.c4db7bec0beb")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Default icon grid + color picker */}
      {value.type === "default" && (
        <div className="space-y-3 border border-gray-200 rounded-lg p-4 bg-white">
          <p className="text-xs font-medium text-gray-500">{tFrontendAuto("fe.bac2a310109d")}</p>
          {loadingIcons ? (
            <div className="h-24 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : (
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 max-h-48 overflow-y-auto">
              {icons.map((ic) => (
                <button
                  key={ic.value}
                  type="button"
                  onClick={() => selectDefaultIcon(ic.value)}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg border-2 transition-all hover:scale-105 ${
                    value.default_icon === ic.value
                      ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                  title={ic.label}
                  style={{ color: value.icon_color || customColor }}
                >
                  <img
                    src={getIconUrl(ic.value, value.icon_color || customColor)}
                    alt={ic.label}
                    className="w-6 h-6 object-contain"
                  />
                </button>
              ))}
            </div>
          )}

          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-2">{tFrontendAuto("fe.360cdd4bc1d6")}</p>
            <div className="flex flex-wrap items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setCustomColor(c);
                    if (value.default_icon) {
                      selectDefaultIcon(value.default_icon, c);
                    }
                  }}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                    (value.icon_color || customColor) === c
                      ? "border-gray-800 ring-2 ring-offset-1 ring-gray-400"
                      : "border-gray-200"
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="color"
                  value={value.icon_color || customColor}
                  onChange={(e) => {
                    const v = e.target.value;
                    setCustomColor(v);
                    if (value.default_icon) {
                      selectDefaultIcon(value.default_icon, v);
                    }
                  }}
                  className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0"
                />
                <span className="text-xs text-gray-600">{tFrontendAuto("fe.9061b21fa33b")}</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Upload button when in uploaded mode but no image yet */}
      {value.type === "uploaded" && !value.icon && (
        <button
          type="button"
          onClick={() => setFileManagerOpen(true)}
          className="w-full flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50/50 transition-colors"
        >
          <FolderOpen className="h-10 w-10 text-gray-400" />
          <span className="text-sm text-gray-600">{tFrontendAuto("fe.9f49ea75349f")}</span>
        </button>
      )}

      <FileManagerModal
        open={fileManagerOpen}
        onClose={() => setFileManagerOpen(false)}
        onSelect={selectUploaded}
        mode="single"
        accept="image"
      />
    </div>
  );
}
