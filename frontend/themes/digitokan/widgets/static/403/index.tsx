"use client";

import React from "react";
import type { WidgetConfig } from "@/themes/types";
import StaticPageWidget from "../_shared/StaticPageWidget";

export default function Static403({ config }: { config?: WidgetConfig }) {
  return <StaticPageWidget page="403" config={config} />;
}
