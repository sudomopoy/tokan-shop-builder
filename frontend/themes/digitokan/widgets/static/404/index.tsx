"use client";

import React from "react";
import type { WidgetConfig } from "@/themes/types";
import StaticPageWidget from "../_shared/StaticPageWidget";

export default function Static404({ config }: { config?: WidgetConfig }) {
  return <StaticPageWidget page="404" config={config} />;
}
