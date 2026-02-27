"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

function getAuth(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem("tokan_auth_v1");
    if (!raw) return false;
    const auth = JSON.parse(raw);
    return !!(auth.token || auth.access);
  } catch {
    return false;
  }
}

export default function PanelPage() {
  const router = useRouter();

  useEffect(() => {
    if (getAuth()) {
      router.replace("/panel/dashboard");
    } else {
      router.replace("/panel/login");
    }
  }, [router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
    </div>
  );
}
