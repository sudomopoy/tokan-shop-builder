"use client";

import { useState } from "react";
import { X, FolderOpen } from "lucide-react";
import type { Media } from "@/lib/api/productApi";
import { FileManagerModal } from "@/components/FileManagerModal";
import { tFrontendAuto } from "@/lib/i18n/autoMessages";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080";

function getImageUrl(media: Media | null): string {
  if (!media?.file) return "";
  const file = media.file;
  if (file.startsWith("http")) return file;
  return `${API_BASE.replace(/\/$/, "")}${file.startsWith("/") ? "" : "/"}${file}`;
}

type ArticleImageFieldsProps = {
  mainImage: Media | null;
  thumbnailImage: Media | null;
  onMainImageChange: (media: Media | null) => void;
  onThumbnailImageChange: (media: Media | null) => void;
};

export function ArticleImageFields({
  mainImage,
  thumbnailImage,
  onMainImageChange,
  onThumbnailImageChange,
}: ArticleImageFieldsProps) {
  const [fileManagerOpen, setFileManagerOpen] = useState<"main" | "thumbnail" | null>(null);

  const handleMainSelect = (m: Media) => {
    onMainImageChange(m);
    setFileManagerOpen(null);
  };

  const handleThumbnailSelect = (m: Media) => {
    onThumbnailImageChange(m);
    setFileManagerOpen(null);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{tFrontendAuto("fe.0ea012425367")}</label>
        {mainImage ? (
          <div className="relative group">
            <img
              src={getImageUrl(mainImage)}
              alt=""
              className="w-full aspect-video object-cover rounded-lg border border-gray-200"
            />
            <button
              type="button"
              onClick={() => onMainImageChange(null)}
              className="absolute top-1 left-1 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setFileManagerOpen("main")}
              className="absolute bottom-1 left-1 btn-secondary text-xs py-1 px-2"
            >
              تغییر
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setFileManagerOpen("main")}
            className="w-full aspect-video flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <FolderOpen className="h-10 w-10 text-gray-400" />
            <span className="text-sm text-gray-500">{tFrontendAuto("fe.facfb3d039a7")}</span>
          </button>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          تصویر کوچک (نمونه)
        </label>
        {thumbnailImage ? (
          <div className="relative group">
            <img
              src={getImageUrl(thumbnailImage)}
              alt=""
              className="w-full aspect-video object-cover rounded-lg border border-gray-200"
            />
            <button
              type="button"
              onClick={() => onThumbnailImageChange(null)}
              className="absolute top-1 left-1 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setFileManagerOpen("thumbnail")}
              className="absolute bottom-1 left-1 btn-secondary text-xs py-1 px-2"
            >
              تغییر
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setFileManagerOpen("thumbnail")}
            className="w-full aspect-video flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <FolderOpen className="h-10 w-10 text-gray-400" />
            <span className="text-sm text-gray-500">{tFrontendAuto("fe.facfb3d039a7")}</span>
          </button>
        )}
      </div>

      <FileManagerModal
        open={fileManagerOpen === "main"}
        onClose={() => setFileManagerOpen(null)}
        onSelect={handleMainSelect}
        mode="single"
        accept="image"
      />
      <FileManagerModal
        open={fileManagerOpen === "thumbnail"}
        onClose={() => setFileManagerOpen(null)}
        onSelect={handleThumbnailSelect}
        mode="single"
        accept="image"
      />
    </div>
  );
}
