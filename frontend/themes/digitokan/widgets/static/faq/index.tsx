"use client";

import React from "react";
import type { WidgetConfig } from "@/themes/types";
import StaticPageWidget from "../_shared/StaticPageWidget";

export default function StaticFaq({ config }: { config?: WidgetConfig }) {
  return <StaticPageWidget page="faq" config={config} />;
}
