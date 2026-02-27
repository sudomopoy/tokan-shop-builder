"use client";

import { useEffect, useState, useRef } from "react";
import {
  Upload,
  X,
  Loader2,
  FolderOpen,
  Check,
  Sparkles,
  Image as ImageIcon,
  Pencil,
  File as FileIcon,
} from "lucide-react";
import { mediaApi } from "@/lib/api";
import type { Media } from "@/lib/api/productApi";

function isVideo(media: Media): boolean {
  return media.file_type?.startsWith("video/") ?? false;
}

function isImage(media: Media): boolean {
  return media.file_type?.startsWith("image/") ?? false;
}

export type FileManagerModalMode = "single" | "multiple";

export type FileManagerModalAccept = "image" | "all" | "file" | "video";

type TabId = "upload" | "gallery" | "ai-studio";

type FileManagerModalProps = {
  open: boolean;
  onClose: () => void;
  /** برای حالت single */
  onSelect?: (media: Media) => void;
  mode?: FileManagerModalMode;
  accept?: FileManagerModalAccept;
  /** برای حالت multiple */
  onSelectMultiple?: (media: Media[]) => void;
};

const AI_PROMPT_PRESETS = [
  { id: "remove-bg", label: "حذف پس‌زمینه", icon: "✨" },
  { id: "product-photo", label: "ساخت عکس محصول", icon: "📦" },
  { id: "enhance", label: "بهبود کیفیت", icon: "🔍" },
  { id: "resize", label: "تغییر اندازه", icon: "📐" },
  { id: "style-transfer", label: "تغییر استایل", icon: "🎨" },
] as const;

export function FileManagerModal({
  open,
  onClose,
  onSelect,
  mode = "single",
  accept = "image",
  onSelectMultiple,
}: FileManagerModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>("gallery");
  const [items, setItems] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [uploadedPending, setUploadedPending] = useState<
    { media: Media; title: string; alt: string }[]
  >([]);
  const [aiStudioImage, setAiStudioImage] = useState<File | Media | null>(null);
  const [aiChatMessages, setAiChatMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [aiChatInput, setAiChatInput] = useState("");
  const [galleryEditMedia, setGalleryEditMedia] = useState<Media | null>(null);
  const [galleryEditForm, setGalleryEditForm] = useState({ title: "", alt: "" });
  const [galleryEditSaving, setGalleryEditSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const res = await mediaApi.list({ page_size: 100 });
      let list = res.results ?? [];
      if (accept === "image") {
        list = list.filter((m) => isImage(m));
      }
      if (accept === "file") {
        list = list.filter((m) => !isImage(m) && !isVideo(m));
      }
      if (accept === "video") {
        list = list.filter((m) => isVideo(m));
      }
      setItems(list);
    } catch (err) {
      console.error(err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchMedia();
      setSelectedIds(new Set());
      setUploadedPending([]);
      setAiStudioImage(null);
      setAiChatMessages([]);
      setGalleryEditMedia(null);
    }
  }, [open, accept]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (accept === "image" && !file.type.startsWith("image/")) continue;
        if (accept === "file" && (file.type.startsWith("image/") || file.type.startsWith("video/"))) continue;
        if (accept === "video" && !file.type.startsWith("video/")) continue;
        const media = await mediaApi.upload(file);
        setItems((prev) => [media, ...prev]);
        setUploadedPending((prev) => [
          ...prev,
          {
            media,
            title: media.title || "",
            alt: media.description || "",
          },
        ]);
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

  const updatePendingMeta = (index: number, field: "title" | "alt", value: string) => {
    setUploadedPending((prev) =>
      prev.map((p, i) =>
        i === index ? { ...p, [field]: value } : p
      )
    );
  };

  const savePendingMeta = async (index: number) => {
    const p = uploadedPending[index];
    if (!p || (!p.title && !p.alt)) return;
    try {
      const updated = await mediaApi.update(p.media.id, {
        title: p.title || undefined,
        description: p.alt || undefined,
      });
      setUploadedPending((prev) =>
        prev.map((item, i) => (i === index ? { ...item, media: updated } : item))
      );
      setItems((prev) =>
        prev.map((m) => (m.id === p.media.id ? updated : m))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const selectUploadedItem = async (index: number) => {
    const p = uploadedPending[index];
    if (!p) return;
    await savePendingMeta(index);
    const media = uploadedPending[index]?.media ?? p.media;
    if (mode === "single") {
      onSelect?.(media);
      onClose();
    } else {
      onSelectMultiple?.([media]);
      setUploadedPending((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const toggleSelect = (m: Media) => {
    if (accept === "image" && !isImage(m)) return;
    if (accept === "file" && (isImage(m) || isVideo(m))) return;
    if (accept === "video" && !isVideo(m)) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(m.id)) next.delete(m.id);
      else next.add(m.id);
      return next;
    });
  };

  const handleItemClick = (m: Media) => {
    if (mode === "single") {
      if (accept === "image" && !isImage(m)) return;
      if (accept === "file" && (isImage(m) || isVideo(m))) return;
      if (accept === "video" && !isVideo(m)) return;
      setSelectedIds(new Set([m.id]));
    } else {
      toggleSelect(m);
    }
  };

  const handleConfirmSelection = () => {
    const selected = items.filter((m) => selectedIds.has(m.id));
    if (mode === "single" && selected[0]) {
      onSelect?.(selected[0]);
    } else if (mode === "multiple") {
      onSelectMultiple?.(selected);
    }
    onClose();
  };


  const openGalleryEdit = (m: Media, e: React.MouseEvent) => {
    e.stopPropagation();
    setGalleryEditMedia(m);
    setGalleryEditForm({
      title: m.title || "",
      alt: m.description || "",
    });
  };

  const closeGalleryEdit = () => setGalleryEditMedia(null);

  const saveGalleryEdit = async () => {
    if (!galleryEditMedia) return;
    setGalleryEditSaving(true);
    try {
      const updated = await mediaApi.update(galleryEditMedia.id, {
        title: galleryEditForm.title,
        description: galleryEditForm.alt,
      });
      setItems((prev) => prev.map((m) => (m.id === galleryEditMedia.id ? updated : m)));
      closeGalleryEdit();
    } catch (err) {
      console.error(err);
      alert("خطا در ذخیره");
    } finally {
      setGalleryEditSaving(false);
    }
  };

  const goToAiStudioWithSelected = () => {
    const selected = items.filter((m) => selectedIds.has(m.id));
    const firstImage = selected.find((m) => isImage(m));
    if (firstImage) {
      setAiStudioImage(firstImage);
      setActiveTab("ai-studio");
    }
  };

  const handleAiDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setAiStudioImage(file);
    }
  };

  const handleAiFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setAiStudioImage(file);
    }
    e.target.value = "";
  };

  const handleAiPromptPreset = (presetId: string) => {
    setAiChatMessages((prev) => [
      ...prev,
      {
        role: "user",
        text: AI_PROMPT_PRESETS.find((p) => p.id === presetId)?.label ?? presetId,
      },
      {
        role: "ai",
        text: "این قابلیت به زودی در دسترس خواهد بود. در حال توسعه...",
      },
    ]);
  };

  if (!open) return null;

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "upload", label: "آپلود", icon: <Upload className="h-4 w-4" /> },
    { id: "gallery", label: "گالری", icon: <FolderOpen className="h-4 w-4" /> },
    { id: "ai-studio", label: "استودیو هوش مصنوعی", icon: <Sparkles className="h-4 w-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="absolute inset-0" onClick={onClose} />
      <div
        className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold">انتخاب فایل</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          {/* Tab: Upload */}
          {activeTab === "upload" && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-colors cursor-pointer"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={accept === "image" ? "image/*" : accept === "file" ? "*" : accept === "video" ? "video/*" : "image/*,video/*"}
                  multiple
                  className="hidden"
                  onChange={handleUpload}
                />
                {uploading ? (
                  <Loader2 className="h-12 w-12 text-blue-500 mx-auto animate-spin mb-2" />
                ) : (
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                )}
                <p className="text-gray-600">
                  {uploading ? "در حال آپلود..." : "کلیک یا فایل را اینجا بکشید"}
                </p>
              </div>

              {uploadedPending.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700">
                    فایل‌های آپلود شده — عنوان و Alt را تنظیم کنید:
                  </p>
                  {uploadedPending.map((p, idx) => (
                    <div
                      key={p.media.id}
                      className="flex gap-4 p-4 border border-gray-200 rounded-xl"
                    >
                      <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                        {isImage(p.media) ? (
                          <img
                            src={p.media.file}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FileIcon className="h-12 w-12 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div>
                          <label className="block text-xs text-gray-500 mb-0.5">
                            عنوان
                          </label>
                          <input
                            type="text"
                            value={p.title}
                            onChange={(e) =>
                              updatePendingMeta(idx, "title", e.target.value)
                            }
                            onBlur={() => savePendingMeta(idx)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                            placeholder="عنوان فایل"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-0.5">
                            Alt (متن جایگزین)
                          </label>
                          <input
                            type="text"
                            value={p.alt}
                            onChange={(e) =>
                              updatePendingMeta(idx, "alt", e.target.value)
                            }
                            onBlur={() => savePendingMeta(idx)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                            placeholder="متن جایگزین برای سئو"
                          />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => selectUploadedItem(idx)}
                            className="btn-primary text-sm"
                          >
                            استفاده از این فایل
                          </button>
                          {isImage(p.media) && (
                            <button
                              type="button"
                              onClick={() => {
                                setAiStudioImage(p.media);
                                setActiveTab("ai-studio");
                              }}
                              className="btn-secondary text-sm inline-flex items-center gap-2"
                            >
                              <Sparkles className="h-4 w-4" />
                              رفتن به استودیوی هوش مصنوعی
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab: Gallery */}
          {activeTab === "gallery" && (
            <>
              {loading ? (
                <div className="flex justify-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-16">
                  <FolderOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">
                    فایلی یافت نشد. از تب آپلود استفاده کنید.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                  {items.map((m) => {
                    const selected = selectedIds.has(m.id);
                    return (
                      <div
                        key={m.id}
                        className={`relative group rounded-lg overflow-hidden border-2 transition-all ${
                          selected
                            ? "border-blue-500 ring-2 ring-blue-200"
                            : "border-gray-200 hover:border-blue-300"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleItemClick(m)}
                          className="block w-full aspect-square"
                        >
                          {isVideo(m) ? (
                            <video
                              src={m.file}
                              className="w-full h-full object-cover"
                              muted
                              playsInline
                              preload="metadata"
                            />
                          ) : isImage(m) ? (
                            <img
                              src={m.file}
                              alt={m.description || m.title || ""}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 gap-2 p-2">
                              <FileIcon className="h-10 w-10 text-gray-400" />
                              <span className="text-xs text-gray-600 truncate w-full text-center">
                                {m.title || m.original_filename || "فایل"}
                              </span>
                            </div>
                          )}
                          {selected && (
                            <div className="absolute top-1 left-1 w-6 h-6 rounded-full flex items-center justify-center bg-blue-500 text-white">
                              <Check className="h-4 w-4" />
                            </div>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => openGalleryEdit(m, e)}
                          className="absolute bottom-1 left-1 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                          title="ویرایش عنوان و Alt"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Tab: AI Studio (نمایشی - بدون بک‌اند) */}
          {activeTab === "ai-studio" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* نوار چپ: تصویر */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleAiDrop}
                  className="lg:col-span-1"
                >
                  {!aiStudioImage ? (
                    <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-violet-400 hover:bg-violet-50/50 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAiFileSelect}
                      />
                      <ImageIcon className="h-12 w-12 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">
                        عکس را اینجا بکشید یا کلیک کنید
                      </span>
                    </label>
                  ) : (
                    <div className="relative">
                      <img
                        src={
                          aiStudioImage instanceof File
                            ? URL.createObjectURL(aiStudioImage)
                            : "file" in aiStudioImage
                              ? aiStudioImage.file
                              : ""
                        }
                        alt=""
                        className="w-full aspect-square object-cover rounded-xl border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => setAiStudioImage(null)}
                        className="absolute top-1 left-1 p-1 bg-red-500 text-white rounded-full"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* نوار راست: چت + پرامپت‌ها */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-3 min-h-[120px] max-h-48 overflow-y-auto">
                    {aiChatMessages.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        پیام شما اینجا نمایش داده می‌شود. از دکمه‌های زیر یا چت
                        برای ویرایش عکس استفاده کنید.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {aiChatMessages.map((msg, i) => (
                          <div
                            key={i}
                            className={`text-sm ${
                              msg.role === "user"
                                ? "text-right text-blue-600"
                                : "text-gray-700"
                            }`}
                          >
                            {msg.text}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-2">دستورات از پیش‌ساخته:</p>
                    <div className="flex flex-wrap gap-2">
                      {AI_PROMPT_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleAiPromptPreset(preset.id)}
                          disabled={!aiStudioImage}
                          className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="ml-1">{preset.icon}</span>
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={aiChatInput}
                      onChange={(e) => setAiChatInput(e.target.value)}
                      placeholder="دستور خود را بنویسید... (به زودی)"
                      disabled
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-100"
                    />
                    <button
                      type="button"
                      disabled
                      className="btn-primary opacity-50 cursor-not-allowed"
                    >
                      ارسال
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Gallery Edit Modal */}
        {galleryEditMedia && (
          <div className="absolute inset-0 z-10 flex items-center justify-center p-4 bg-black/30 rounded-xl">
            <div
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">ویرایش فایل</h3>
                <button
                  type="button"
                  onClick={closeGalleryEdit}
                  className="p-1 text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">عنوان</label>
                  <input
                    type="text"
                    value={galleryEditForm.title}
                    onChange={(e) => setGalleryEditForm((p) => ({ ...p, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                    placeholder="عنوان فایل"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alt (متن جایگزین)</label>
                  <input
                    type="text"
                    value={galleryEditForm.alt}
                    onChange={(e) => setGalleryEditForm((p) => ({ ...p, alt: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                    placeholder="متن جایگزین برای سئو"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={saveGalleryEdit}
                    disabled={galleryEditSaving}
                    className="btn-primary flex-1 inline-flex items-center justify-center gap-2"
                  >
                    {galleryEditSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    ذخیره
                  </button>
                  <button type="button" onClick={closeGalleryEdit} className="btn-secondary">
                    انصراف
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer for Gallery tab when items selected */}
        {activeTab === "gallery" && items.length > 0 && selectedIds.size > 0 && (
          <div className="p-4 border-t border-gray-200 flex justify-between items-center gap-3 flex-wrap">
            <span className="text-sm text-gray-600">
              {selectedIds.size} فایل انتخاب شده
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={goToAiStudioWithSelected}
                disabled={selectedIds.size === 0 || !items.some((m) => selectedIds.has(m.id) && isImage(m))}
                className="btn-secondary inline-flex items-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                رفتن به استودیوی هوش مصنوعی
              </button>
              <button
                type="button"
                onClick={handleConfirmSelection}
                disabled={selectedIds.size === 0}
                className="btn-primary disabled:opacity-50"
              >
                تایید انتخاب
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
