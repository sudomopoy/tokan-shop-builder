"use client";

import { useState } from "react";
import { Plus, X, FolderOpen } from "lucide-react";
import type { Media } from "@/lib/api/productApi";
import { FileManagerModal } from "@/components/FileManagerModal";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080";

function getImageUrl(media: Media): string {
  const file = media.file;
  if (!file) return "";
  if (file.startsWith("http")) return file;
  return `${API_BASE.replace(/\/$/, "")}${file.startsWith("/") ? "" : "/"}${file}`;
}

type ProductImageFieldsProps = {
  mainImage: Media | null;
  galleryImages: Media[];
  onMainImageChange: (media: Media | null) => void;
  onGalleryChange: (images: Media[]) => void;
};

export function ProductImageFields({
  mainImage,
  galleryImages,
  onMainImageChange,
  onGalleryChange,
}: ProductImageFieldsProps) {
  const [fileManagerOpen, setFileManagerOpen] = useState<"main" | "gallery" | null>(null);

  const removeMainImage = () => onMainImageChange(null);
  const removeGalleryImage = (idx: number) =>
    onGalleryChange(galleryImages.filter((_, i) => i !== idx));

  const handleMainSelect = (m: Media) => {
    onMainImageChange(m);
    setFileManagerOpen(null);
  };

  const handleGallerySelectMultiple = (selected: Media[]) => {
    onGalleryChange([...galleryImages, ...selected]);
    setFileManagerOpen(null);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          تصویر اصلی
        </label>
        <div className="flex flex-col items-start gap-3">
          {mainImage ? (
            <div className="relative group">
              <img
                src={getImageUrl(mainImage)}
                alt=""
                className="w-64 h-64 sm:w-80 sm:h-80 object-cover rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={removeMainImage}
                className="absolute top-1 left-1 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="حذف تصویر"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setFileManagerOpen("main")}
              className="w-64 h-64 sm:w-80 sm:h-80 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <FolderOpen className="h-8 w-8 text-gray-400" />
              <span className="text-xs text-gray-500">انتخاب از فایل‌ها</span>
            </button>
          )}
          {mainImage && (
            <button
              type="button"
              onClick={() => setFileManagerOpen("main")}
              className="btn-secondary text-sm inline-flex items-center gap-2"
            >
              <FolderOpen className="h-4 w-4" />
              تغییر تصویر
            </button>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          گالری تصاویر
        </label>
        <div className="flex flex-wrap gap-3">
          {galleryImages.map((img, idx) => (
            <div key={img.id} className="relative group">
              <img
                src={getImageUrl(img)}
                alt=""
                className="w-24 h-24 object-cover rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={() => removeGalleryImage(idx)}
                className="absolute -top-1 -right-1 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="حذف"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setFileManagerOpen("gallery")}
            className="w-24 h-24 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <Plus className="h-6 w-6 text-gray-400" />
          </button>
        </div>
      </div>

      {/* File Manager Modal - Main Image */}
      <FileManagerModal
        open={fileManagerOpen === "main"}
        onClose={() => setFileManagerOpen(null)}
        onSelect={handleMainSelect}
        mode="single"
        accept="image"
      />

      {/* File Manager Modal - Gallery */}
      <FileManagerModal
        open={fileManagerOpen === "gallery"}
        onClose={() => setFileManagerOpen(null)}
        mode="multiple"
        accept="image"
        onSelectMultiple={handleGallerySelectMultiple}
      />
    </div>
  );
}
