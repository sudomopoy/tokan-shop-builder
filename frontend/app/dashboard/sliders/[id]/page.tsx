"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Plus, Pencil, Trash2 } from "lucide-react";
import { sliderApi } from "@/lib/api";
import type { Slider, Slide } from "@/lib/api/sliderApi";
import type { Media } from "@/lib/api/productApi";
import { FileManagerModal } from "@/components/FileManagerModal";
import { FolderOpen } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080";

function getImageUrl(media: Media | { file?: string } | null): string {
  if (!media?.file) return "";
  const file = media.file;
  if (file.startsWith("http")) return file;
  return `${API_BASE.replace(/\/$/, "")}${file.startsWith("/") ? "" : "/"}${file}`;
}

export default function SliderSlidesPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [slider, setSlider] = useState<Slider | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editSlide, setEditSlide] = useState<Slide | null>(null);
  const [saving, setSaving] = useState(false);
  const [imagePickerFor, setImagePickerFor] = useState<"desktop" | "mobile" | null>(null);

  const [form, setForm] = useState({
    title: "",
    alt: "",
    description: "",
    url: "",
    button_text: "",
    show_button: true,
    index: 0,
    is_active: true,
    desktop_image: null as Media | null,
    mobile_image: null as Media | null,
  });

  const fetchSlider = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await sliderApi.getForManagement(id);
      setSlider(data);
      setSlides(data.slides ?? []);
    } catch (err) {
      console.error(err);
      setSlider(null);
      setSlides([]);
      setError("خطا در دریافت اسلایدر");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlider();
  }, [id]);

  const openCreate = () => {
    setEditSlide(null);
    setForm({
      title: "",
      alt: "",
      description: "",
      url: "",
      button_text: "",
      show_button: true,
      index: slides.length,
      is_active: true,
      desktop_image: null,
      mobile_image: null,
    });
    setModal("create");
    setError(null);
  };

  const openEdit = (slide: Slide) => {
    setEditSlide(slide);
    setForm({
      title: slide.title || "",
      alt: slide.alt || "",
      description: slide.description || "",
      url: slide.url || "",
      button_text: slide.button_text ?? "",
      show_button: slide.show_button ?? true,
      index: slide.index,
      is_active: slide.is_active ?? true,
      desktop_image: slide.desktop_image ?? null,
      mobile_image: slide.mobile_image ?? null,
    });
    setModal("edit");
    setError(null);
  };

  const closeModal = () => {
    setModal(null);
    setEditSlide(null);
    setImagePickerFor(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !form.desktop_image) {
      setError("تصویر دسکتاپ الزامی است.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const payload = {
        slider: id,
        title: form.title.trim() || null,
        alt: form.alt.trim() || null,
        description: form.description.trim() || null,
        url: form.url.trim() || null,
        button_text: form.button_text.trim() || null,
        show_button: form.show_button,
        index: form.index,
        is_active: form.is_active,
        desktop_image: form.desktop_image.id,
        mobile_image: form.mobile_image?.id ?? null,
      };
      if (modal === "create") {
        await sliderApi.createSlide(payload);
      } else if (editSlide) {
        await sliderApi.updateSlide(editSlide.id, payload);
      }
      closeModal();
      await fetchSlider();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
      const msg =
        (Array.isArray(data?.desktop_image) ? data?.desktop_image[0] : null) ||
        (Array.isArray(data?.title) ? data?.title[0] : null) ||
        (typeof data?.detail === "string" ? data.detail : null) ||
        "خطا در ذخیره";
      setError(String(msg));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (slide: Slide) => {
    if (!confirm(`آیا از حذف این اسلاید اطمینان دارید؟`)) return;
    try {
      await sliderApi.deleteSlide(slide.id);
      await fetchSlider();
    } catch (err) {
      console.error(err);
      alert("خطا در حذف اسلاید");
    }
  };

  if (!id) {
    router.replace("/dashboard/sliders");
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/sliders"
            className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            <ArrowRight className="h-5 w-5" />
            بازگشت به اسلایدرها
          </Link>
          <h1 className="text-3xl font-bold">
            اسلایدها: {slider?.title ?? "..."}
          </h1>
        </div>
        <button
          onClick={openCreate}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          افزودن اسلاید
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    تصویر
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    عنوان / توضیح
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    لینک
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    وضعیت
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {slides.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      اسلایدی یافت نشد. یک اسلاید جدید اضافه کنید.
                    </td>
                  </tr>
                ) : (
                  slides.map((slide) => (
                    <tr key={slide.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="w-24 h-14 rounded overflow-hidden bg-gray-100">
                          <img
                            src={getImageUrl(slide.desktop_image)}
                            alt={slide.alt || slide.title || ""}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium block">{slide.title || "—"}</span>
                        <span className="text-xs text-gray-500 line-clamp-2">
                          {slide.description || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dir-ltr text-left">
                        {slide.url ? (
                          <a
                            href={slide.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline truncate max-w-[120px] block"
                          >
                            {slide.url}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            slide.is_active ?? true
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {slide.is_active ?? true ? "فعال" : "غیرفعال"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEdit(slide)}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="ویرایش"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(slide)}
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

      {/* Modal */}
      {(modal === "create" || modal === "edit") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {modal === "create" ? "افزودن اسلاید" : "ویرایش اسلاید"}
              </h2>
              {error && (
                <div className="p-3 mb-4 bg-red-50 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      تصویر دسکتاپ *
                    </label>
                    {form.desktop_image ? (
                      <div className="relative group">
                        <img
                          src={getImageUrl(form.desktop_image)}
                          alt=""
                          className="w-full aspect-video object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, desktop_image: null }))}
                          className="absolute top-1 left-1 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100"
                        >
                          ×
                        </button>
                        <button
                          type="button"
                          onClick={() => setImagePickerFor("desktop")}
                          className="absolute bottom-1 left-1 btn-secondary text-xs"
                        >
                          تغییر
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setImagePickerFor("desktop")}
                        className="w-full aspect-video flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50"
                      >
                        <FolderOpen className="h-10 w-10 text-gray-400" />
                        <span className="text-sm text-gray-500">انتخاب تصویر دسکتاپ</span>
                      </button>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      تصویر موبایل (اختیاری)
                    </label>
                    {form.mobile_image ? (
                      <div className="relative group">
                        <img
                          src={getImageUrl(form.mobile_image)}
                          alt=""
                          className="w-full aspect-video object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, mobile_image: null }))}
                          className="absolute top-1 left-1 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100"
                        >
                          ×
                        </button>
                        <button
                          type="button"
                          onClick={() => setImagePickerFor("mobile")}
                          className="absolute bottom-1 left-1 btn-secondary text-xs"
                        >
                          تغییر
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setImagePickerFor("mobile")}
                        className="w-full aspect-video flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50"
                      >
                        <FolderOpen className="h-10 w-10 text-gray-400" />
                        <span className="text-sm text-gray-500">انتخاب تصویر موبایل</span>
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">عنوان</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="عنوان اسلاید"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">توضیح</label>
                  <input
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="متن توضیحی اسلاید"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alt (متن جایگزین تصویر)</label>
                  <input
                    value={form.alt}
                    onChange={(e) => setForm((f) => ({ ...f, alt: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="متن جایگزین برای سئو"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">لینک</label>
                  <input
                    value={form.url}
                    onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                    dir="ltr"
                    className="w-full ltr text-left px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                    placeholder="/products یا https://..."
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.show_button}
                    onChange={(e) => setForm((f) => ({ ...f, show_button: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">نمایش دکمه فراخوان</span>
                </label>
                {form.show_button && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      متن دکمه
                    </label>
                    <input
                      value={form.button_text}
                      onChange={(e) => setForm((f) => ({ ...f, button_text: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="مثال: مشاهده محصولات، خرید کنید"
                    />
                  </div>
                )}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">فعال</span>
                </label>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={saving || !form.desktop_image}
                    className="btn-primary disabled:opacity-50"
                  >
                    {saving ? "در حال ذخیره..." : "ذخیره"}
                  </button>
                  <button type="button" onClick={closeModal} className="btn-secondary">
                    انصراف
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* File Manager Modals */}
      <FileManagerModal
        open={imagePickerFor === "desktop"}
        onClose={() => setImagePickerFor(null)}
        onSelect={(m) => {
          setForm((f) => ({ ...f, desktop_image: m }));
          setImagePickerFor(null);
        }}
        mode="single"
        accept="image"
      />
      <FileManagerModal
        open={imagePickerFor === "mobile"}
        onClose={() => setImagePickerFor(null)}
        onSelect={(m) => {
          setForm((f) => ({ ...f, mobile_image: m }));
          setImagePickerFor(null);
        }}
        mode="single"
        accept="image"
      />
    </div>
  );
}
