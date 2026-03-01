"use client";

import { useState } from "react";
import { Plus, Trash2, FolderOpen, File as FileIcon } from "lucide-react";
import type { Media } from "@/lib/api/productApi";
import { FileManagerModal } from "@/components/FileManagerModal";
import { tFrontendAuto } from "@/lib/i18n/autoMessages";

export type DownloadableFileEntry = {
  media_id: string;
  media?: Media;
  title: string;
  description: string;
};

const inputClass =
  "w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";

export function DownloadableFilesEditor({
  value = [],
  onChange,
}: {
  value?: DownloadableFileEntry[];
  onChange: (items: DownloadableFileEntry[]) => void;
}) {
  const [fileManagerOpen, setFileManagerOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const items: DownloadableFileEntry[] = Array.isArray(value) ? value : [];

  const updateItem = (
    index: number,
    field: keyof DownloadableFileEntry,
    val: string | Media | undefined
  ) => {
    const next = [...items];
    const current = next[index];
    if (!current) return;
    if (field === "media") {
      const m = val as Media;
      next[index] = {
        ...current,
        media_id: m?.id ?? "",
        media: m,
        title: current.title || m?.title || "",
      };
    } else {
      next[index] = { ...current, [field]: val };
    }
    onChange(next);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const addMultipleFromGallery = (selected: Media[]) => {
    const newEntries: DownloadableFileEntry[] = selected.map((m) => ({
      media_id: m.id,
      media: m,
      title: m.title || "",
      description: m.description || "",
    }));
    if (editingIndex !== null && items[editingIndex]) {
      const next = [...items];
      next[editingIndex] = newEntries[0];
      onChange(next);
      setEditingIndex(null);
    } else {
      onChange([...items, ...newEntries]);
    }
    setFileManagerOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className={labelClass}>{tFrontendAuto("fe.d0d693ec4a05")}</label>
        <button
          type="button"
          onClick={() => {
            setEditingIndex(null);
            setFileManagerOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          افزودن فایل
        </button>
      </div>

      <p className="text-xs text-gray-500 -mt-2">
        می‌توانید چندین فایل (PDF، ZIP، و...) اضافه کنید. عنوان و توضیحات هر فایل اختیاری است.
      </p>

      {items.length === 0 ? (
        <div
          className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center text-gray-500"
          role="button"
          onClick={() => {
            setEditingIndex(null);
            setFileManagerOpen(true);
          }}
          onKeyDown={(e) => e.key === "Enter" && setFileManagerOpen(true)}
          tabIndex={0}
        >
          <FolderOpen className="h-12 w-12 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">{tFrontendAuto("fe.b412f141b860")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={`${item.media_id}-${index}`}
              className="p-4 border border-gray-200 rounded-lg bg-gray-50/50 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <FileIcon className="h-5 w-5 text-gray-500" />
                  </div>
                  <span className="text-sm text-gray-600 truncate">
                    {item.media?.original_filename || item.media?.title || `فایل ${index + 1}`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                  title={tFrontendAuto("fe.fc1d9d323674")}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>{tFrontendAuto("fe.590e6375092e")}</label>
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => updateItem(index, "title", e.target.value)}
                    placeholder={tFrontendAuto("fe.9b2a72462799")}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>{tFrontendAuto("fe.2dc3afe54449")}</label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(index, "description", e.target.value)}
                    placeholder={tFrontendAuto("fe.cd07f2cfe6a9")}
                    className={inputClass}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingIndex(index);
                  setFileManagerOpen(true);
                }}
                className="text-xs text-blue-600 hover:underline"
              >
                تغییر فایل
              </button>
            </div>
          ))}
        </div>
      )}

      <FileManagerModal
        open={fileManagerOpen}
        onClose={() => {
          setFileManagerOpen(false);
          setEditingIndex(null);
        }}
        onSelectMultiple={addMultipleFromGallery}
        mode="multiple"
        accept="file"
      />
    </div>
  );
}
