"use client";

import React from "react";
import type { WidgetConfig } from "@/themes/types";
import StaticPageWidget from "../_shared/StaticPageWidget";

export default function StaticShipping({ config }: { config?: WidgetConfig }) {
  return <StaticPageWidget page="shipping" config={config} />;
}
