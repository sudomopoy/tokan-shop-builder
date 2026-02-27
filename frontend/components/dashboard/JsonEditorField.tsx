"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Maximize2, Minimize2 } from "lucide-react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

type JsonEditorFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  minHeight?: number;
  error?: string;
};

export default function JsonEditorField({
  label,
  value,
  onChange,
  disabled = false,
  minHeight = 120,
  error,
}: JsonEditorFieldProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  const handleFormat = useCallback(() => {
    try {
      const parsed = JSON.parse(localValue);
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        setLocalValue(JSON.stringify(parsed, null, 2));
      }
    } catch {
      // invalid json, ignore
    }
  }, [localValue]);

  const handleOpenModal = () => {
    setLocalValue(value);
    setModalOpen(true);
  };

  const handleCloseModal = (apply: boolean) => {
    if (apply) {
      onChange(localValue);
    }
    setModalOpen(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1">
        <label className="block text-xs font-medium text-gray-700">{label}</label>
        <button
          type="button"
          onClick={handleOpenModal}
          disabled={disabled}
          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="بزرگ نمایی"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>

      <div
        dir="ltr"
        className={`border rounded-lg overflow-hidden text-left ${
          error ? "border-red-400 bg-red-50/30" : "border-gray-200"
        }`}
      >
        <Editor
          height={minHeight}
          defaultLanguage="json"
          value={value.trim() || "{}"}
          onChange={(v) => onChange(v ?? "{}")}
          theme="vs-light"
          options={{
            readOnly: Boolean(disabled),
            domReadOnly: false,
            minimap: { enabled: false },
            fontSize: 12,
            lineNumbers: "off",
            scrollBeyondLastLine: false,
            wordWrap: "on",
            formatOnPaste: true,
            formatOnType: true,
            tabSize: 2,
            automaticLayout: true,
          }}
          loading={
            <div
              className="flex items-center justify-center bg-gray-50 text-gray-500 text-sm"
              style={{ height: minHeight }}
            >
              در حال بارگذاری...
            </div>
          }
        />
      </div>

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}

      <Dialog
        open={modalOpen}
        onClose={() => handleCloseModal(false)}
        maxWidth={false}
        fullWidth
        PaperProps={{
          sx: {
            maxWidth: "90vw",
            height: "85vh",
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle className="flex items-center justify-between gap-4">
          <span>{label}</span>
          <div className="flex items-center gap-2">
            <Button size="small" onClick={handleFormat} variant="outlined">
              قالب‌بندی JSON
            </Button>
            <button
              type="button"
              onClick={() => handleCloseModal(false)}
              className="p-1.5 text-gray-500 hover:text-gray-700"
              title="بستن"
            >
              <Minimize2 className="h-5 w-5" />
            </button>
          </div>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, overflow: "hidden", minHeight: "65vh", direction: "ltr", textAlign: "left" }}>
          <div dir="ltr" style={{ height: "65vh", textAlign: "left" }}>
            <Editor
              height="65vh"
              defaultLanguage="json"
              value={localValue.trim() || "{}"}
              onChange={(v) => setLocalValue(v ?? "{}")}
              theme="vs-light"
              options={{
                readOnly: false,
                domReadOnly: false,
                minimap: { enabled: true },
                fontSize: 14,
                lineNumbers: "on",
                scrollBeyondLastLine: true,
                wordWrap: "on",
                formatOnPaste: true,
                formatOnType: true,
                tabSize: 2,
                automaticLayout: true,
              }}
            />
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => handleCloseModal(false)}>انصراف</Button>
          <Button variant="contained" onClick={() => handleCloseModal(true)}>
            اعمال تغییرات
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
