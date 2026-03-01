"use client";

import { useEffect, useState, useRef } from "react";
import {
  Upload,
  Pencil,
  Trash2,
  X,
  FolderOpen,
  Loader2,
} from "lucide-react";
import { mediaApi, accountApi } from "@/lib/api";
import type { Media } from "@/lib/api/productApi";
import { tFrontendAuto } from "@/lib/i18n/autoMessages";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} بایت`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} کیلوبایت`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} مگابایت`;
}

function isVideo(media: Media): boolean {
  return media.file_type?.startsWith("video/") ?? false;
}

export default function MediaPage() {
  const [items, setItems] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editModal, setEditModal] = useState<Media | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    accountApi.getInfo().then((u) => {
      const su = u.store_user;
      setCanDelete(
        (su?.level ?? 0) >= 2 ||
        !!(su?.admin_permissions as { media_delete?: boolean } | undefined)?.media_delete
      );
    }).catch(() => {});
  }, []);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const res = await mediaApi.list({ page_size: 100 });
      setItems(res.results ?? []);
    } catch (err) {
      console.error(err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const media = await mediaApi.upload(file);
        setItems((prev) => [media, ...prev]);
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.file?.[0] ||
        err.response?.data?.detail ||
        "خطا در آپلود فایل";
      alert(Array.isArray(msg) ? msg.join(", ") : String(msg));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (m: Media) => {
    if (!confirm(tFrontendAuto("fe.42cd2750de0d", { p1: m.title || m.original_filename })))
      return;
    try {
      await mediaApi.delete(m.id);
      setItems((prev) => prev.filter((x) => x.id !== m.id));
    } catch (err) {
      console.error(err);
      alert("خطا در حذف فایل");
    }
  };

  const openEditModal = (m: Media) => {
    setEditModal(m);
    setEditForm({
      title: m.title || "",
      description: m.description || "",
    });
  };

  const closeEditModal = () => {
    setEditModal(null);
  };

  const handleSaveEdit = async () => {
    if (!editModal) return;
    setSaving(true);
    try {
      const updated = await mediaApi.update(editModal.id, {
        title: editForm.title,
        description: editForm.description,
      });
      setItems((prev) =>
        prev.map((x) => (x.id === editModal.id ? updated : x))
      );
      closeEditModal();
    } catch (err: any) {
      const msg =
        err.response?.data?.title?.[0] ||
        err.response?.data?.description?.[0] ||
        err.response?.data?.detail ||
        "خطا در ذخیره";
      alert(Array.isArray(msg) ? msg.join(", ") : String(msg));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h1 className="text-3xl font-bold">{tFrontendAuto("fe.8d4913bf37d9")}</h1>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={handleUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="btn-primary inline-flex items-center gap-2"
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Upload className="h-5 w-5" />
            )}
            {uploading ? "در حال آپلود..." : "آپلود فایل"}
          </button>
        </div>
      </div>

      <p className="text-gray-600 text-sm">
        فرمت‌های مجاز: تصویر و ویدئو. می‌توانید عنوان و توضیحات (alt) را برای
        بهینه‌سازی SEO ویرایش کنید.
      </p>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="card p-12 text-center">
          <FolderOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">{tFrontendAuto("fe.95204391162f")}</p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Upload className="h-5 w-5" />
            اولین فایل را آپلود کنید
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {items.map((m) => (
            <div
              key={m.id}
              className="card p-0 overflow-hidden group"
            >
              <div className="aspect-square bg-gray-100 relative">
                {isVideo(m) ? (
                  <video
                    src={m.file}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <img
                    src={m.file}
                    alt={m.description || m.title || ""}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => openEditModal(m)}
                    className="p-2 bg-white rounded-lg text-gray-700 hover:bg-gray-100"
                    title={tFrontendAuto("fe.de21bfe62ab5")}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(m)}
                      className="p-2 bg-white rounded-lg text-red-600 hover:bg-red-50"
                      title={tFrontendAuto("fe.fc1d9d323674")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="p-2">
                <p
                  className="text-sm font-medium truncate"
                  title={m.title || m.original_filename}
                >
                  {m.title || m.original_filename || "بدون عنوان"}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(m.file_size ?? 0)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div
            className="absolute inset-0"
            onClick={closeEditModal}
          />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{tFrontendAuto("fe.adbdf8ea9b75")}</h2>
              <button
                onClick={closeEditModal}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  عنوان
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, title: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={tFrontendAuto("fe.48aafb2d5247")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  توضیحات / Alt (برای SEO)
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, description: e.target.value }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={tFrontendAuto("fe.6d914159db73")}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="btn-primary flex-1 inline-flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  ذخیره
                </button>
                <button
                  onClick={closeEditModal}
                  className="btn-secondary"
                >
                  انصراف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
