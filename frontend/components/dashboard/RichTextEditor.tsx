"use client";

import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";
import { tFrontendAuto } from "@/lib/i18n/autoMessages";

const ReactQuill = dynamic(
  () => import("react-quill").then((mod) => mod.default),
  { ssr: false, loading: () => <RichTextEditorFallback /> }
);

function RichTextEditorFallback() {
  return (
    <div className="min-h-[200px] w-full rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-500 text-sm">
      در حال بارگذاری ویرایشگر...
    </div>
  );
}

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ align: [] }],
    ["link"],
    ["clean"],
  ],
};

const formats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "bullet",
  "align",
  "link",
];

export function RichTextEditor({
  value,
  onChange,
  placeholder = {tFrontendAuto("fe.d3df418952c1")},
  className = "",
}: RichTextEditorProps) {
  return (
    <div className={`rich-text-editor-wrapper ${className}`}>
      <ReactQuill
        theme="snow"
        value={value ?? ""}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
    </div>
  );
}
