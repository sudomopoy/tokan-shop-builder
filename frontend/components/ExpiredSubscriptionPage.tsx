"use client";

import { DEPLOY_DIRECTION } from "@/lib/i18n/deployment";
import { tFrontend } from "@/lib/i18n/messages";

export default function ExpiredSubscriptionPage({
  storeTitle,
}: {
  storeTitle?: string;
}) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-6"
      dir={DEPLOY_DIRECTION}
    >
      <div className="max-w-lg w-full text-center space-y-8">
        <div className="w-24 h-24 mx-auto rounded-full bg-amber-100 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-amber-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            {tFrontend("subscription.expired.title")}
          </h1>
          <p className="text-slate-600">
            {storeTitle ? (
              <>
                {tFrontend("subscription.expired.withStore", { store: storeTitle })}
              </>
            ) : (
              <>
                {tFrontend("subscription.expired.withoutStore")}
              </>
            )}{" "}
            {tFrontend("subscription.expired.contactAdmin")}
          </p>
        </div>
        <div className="pt-4">
          <p className="text-sm text-slate-500">
            {tFrontend("subscription.expired.hint")}
          </p>
        </div>
      </div>
    </div>
  );
}
