"use client";

import { usePathname } from "next/navigation";
import PanelLayout from "@/components/panel/PanelLayout";

export default function PanelLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLogin = pathname === "/panel/login";

  if (isLogin) {
    return (
      <div className="min-h-screen hero-surface">
        <div className="grid-dots absolute inset-0 opacity-40" />
        <div className="relative">{children}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen hero-surface">
      <div className="grid-dots absolute inset-0 opacity-40" />
      <div className="relative">
        <PanelLayout>{children}</PanelLayout>
      </div>
    </div>
  );
}
