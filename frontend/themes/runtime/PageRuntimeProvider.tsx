"use client";

import React, { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { PageConfig } from "@/themes/types";
import { resolveTemplateString } from "./template";

type UnknownRecord = Record<string, unknown>;

type PageRuntime = {
  data: UnknownRecord;
  setData: (path: string, value: unknown) => void;
};

const PageRuntimeContext = createContext<PageRuntime | null>(null);

export type InitialDataMap = Record<string, unknown>;

function setAtPath(obj: UnknownRecord, path: string, value: unknown): UnknownRecord {
  const parts = path.split(".").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return obj;

  const next: UnknownRecord = { ...obj };
  let cur: UnknownRecord = next;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i]!;
    const existing = cur[key];
    if (existing && typeof existing === "object" && !Array.isArray(existing)) {
      cur[key] = { ...(existing as UnknownRecord) };
    } else {
      cur[key] = {};
    }
    cur = cur[key] as UnknownRecord;
  }
  cur[parts[parts.length - 1]!] = value;
  return next;
}

function upsertMeta(name: string, content: string) {
  if (typeof document === "undefined") return;
  let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function PageRuntimeProvider({
  pageConfig,
  initialData,
  children,
}: PropsWithChildren<{ pageConfig: PageConfig; initialData?: InitialDataMap }>) {
  const [data, setDataState] = useState<UnknownRecord>(() => initialData ?? {});

  const setData = useCallback((path: string, value: unknown) => {
    setDataState((prev) => setAtPath(prev, path, value));
  }, []);

  const ctxValue = useMemo(() => ({ data, setData }), [data, setData]);

  useEffect(() => {
    // Apply per-page static/dynamic meta on client runtime.
    // Note: This affects document head at runtime (not SSR metadata).
    const tplData = { data };

    const rawTitle = pageConfig.metaTitle ?? pageConfig.title ?? "";
    const rawDesc = pageConfig.metaDescription ?? pageConfig.description ?? "";
    const rawKeywords = pageConfig.metaKeywords ?? "";

    const title = rawTitle.includes("{{") ? resolveTemplateString(rawTitle, tplData) : rawTitle;
    const desc = rawDesc.includes("{{") ? resolveTemplateString(rawDesc, tplData) : rawDesc;
    const keywords = rawKeywords.includes("{{") ? resolveTemplateString(rawKeywords, tplData) : rawKeywords;

    if (title) document.title = title;
    if (desc) upsertMeta("description", desc);
    if (keywords) upsertMeta("keywords", keywords);
  }, [data, pageConfig.description, pageConfig.metaDescription, pageConfig.metaKeywords, pageConfig.metaTitle, pageConfig.title]);

  return <PageRuntimeContext.Provider value={ctxValue}>{children}</PageRuntimeContext.Provider>;
}

export function usePageRuntime(): PageRuntime {
  const ctx = useContext(PageRuntimeContext);
  if (!ctx) throw new Error("usePageRuntime must be used within PageRuntimeProvider");
  return ctx;
}

