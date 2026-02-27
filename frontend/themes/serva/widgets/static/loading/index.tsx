"use client";

import React from "react";

export default function StaticLoading() {
  return (
    <section className="container py-20">
      <div className="bg-white rounded-2xl p-10 text-center text-gray-600">
        <div className="w-14 h-14 border-4 border-gray-200 border-t-primary rounded-full animate-spin mx-auto mb-6" />
        در حال بارگذاری...
      </div>
    </section>
  );
}

