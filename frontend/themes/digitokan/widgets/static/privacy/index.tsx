"use client";

import React from "react";
import type { WidgetConfig } from "@/themes/types";
import StaticPageWidget from "../_shared/StaticPageWidget";

export default function StaticPrivacy({ config }: { config?: WidgetConfig }) {
  return <StaticPageWidget page="privacy" config={config} />;
}
