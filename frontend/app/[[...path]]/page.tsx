import type { Metadata } from "next";
import { headers } from "next/headers";
import { unstable_cache } from "next/cache";
import axios from "axios";
import Render from "@/themes/render";
import { pageApi } from "@/lib/api";
import ExpiredSubscriptionPage from "@/components/ExpiredSubscriptionPage";
import DefaultErrorPage from "@/components/DefaultErrorPage";
import { fetchPageWidgetData } from "@/lib/server/fetchPageWidgetData";
import { resolvePageMetadata } from "@/lib/server/resolvePageMeta";
import { DEPLOY_LOCALE } from "@/lib/i18n/deployment";
import { localizeValue, pickByLocale } from "@/lib/i18n/localize";

const CACHE_REVALIDATE = process.env.NODE_ENV === "development" ? 3 : 600; // 3 sec in dev, 10 min in production

type DynamicPageProps = {
  params: { path?: string[] };
};

type ErrorCode = 404 | 500 | 403;

const ERROR_PATHS: Record<ErrorCode, string> = {
  404: "/404",
  500: "/500",
  403: "/403",
};

async function fetchPageConfig(path: string, hostHeader: string | null) {
  const reqHeaders: Record<string, string> = {};
  if (hostHeader) {
    reqHeaders["X-Store-Host"] = hostHeader;
  }
  reqHeaders["Accept-Language"] = DEPLOY_LOCALE;
  return pageApi.getByPath(path, { headers: reqHeaders });
}

function getCacheTags(cacheKey: string, path: string) {
  return [
    `store-pages:${cacheKey}:${DEPLOY_LOCALE}`,
    `store-page:${cacheKey}:${DEPLOY_LOCALE}:${path}`,
  ];
}

async function tryFetchErrorPage(
  errorCode: ErrorCode,
  hostHeader: string | null,
  cacheKey: string
) {
  const errorPath = ERROR_PATHS[errorCode];
  const getCachedErrorPage = unstable_cache(
    async () => fetchPageConfig(errorPath, hostHeader),
    [`page-by-path`, cacheKey, errorPath],
    { revalidate: CACHE_REVALIDATE, tags: getCacheTags(cacheKey, errorPath) }
  );
  return getCachedErrorPage();
}

export async function generateMetadata({ params }: DynamicPageProps): Promise<Metadata> {
  const defaultStoreTitle = pickByLocale({ fa: "فروشگاه", en: "Store" });
  const path = "/" + (params.path?.join("/") ?? "");
  const headersList = await headers();
  const host =
    headersList.get("x-forwarded-host") ??
    headersList.get("x-real-host") ??
    headersList.get("host");

  const cacheKey = `${DEPLOY_LOCALE}:${host ?? "default"}`;
  const getCachedPage = unstable_cache(
    async () => fetchPageConfig(path, host),
    [`page-by-path`, cacheKey, path, DEPLOY_LOCALE],
    { revalidate: CACHE_REVALIDATE, tags: getCacheTags(cacheKey, path) }
  );

  try {
    const result = await getCachedPage();
    if (!result || (result as { subscription_expired?: boolean }).subscription_expired) {
      return { title: defaultStoreTitle };
    }

    const localizedResult = localizeValue(result);
    const pageConfig = { ...localizedResult, theme: undefined } as Parameters<
      typeof Render
    >[0]["pageConfig"];
    const widgetData = await fetchPageWidgetData(pageConfig, host);
    return resolvePageMetadata(pageConfig, widgetData);
  } catch {
    return { title: defaultStoreTitle };
  }
}

export default async function DynamicPage({ params }: DynamicPageProps) {
  const path = "/" + (params.path?.join("/") ?? "");
  const headersList = await headers();
  // x-forwarded-host اولویت دارد چون پروکسی‌ها host را ممکن است به دامنهٔ upstream تغییر دهند
  const host =
    headersList.get("x-forwarded-host") ??
    headersList.get("x-real-host") ??
    headersList.get("host");

  const cacheKey = `${DEPLOY_LOCALE}:${host ?? "default"}`;
  const getCachedPage = unstable_cache(
    async () => fetchPageConfig(path, host),
    [`page-by-path`, cacheKey, path, DEPLOY_LOCALE],
    { revalidate: CACHE_REVALIDATE, tags: getCacheTags(cacheKey, path) }
  );

  try {
    const result = await getCachedPage();

    if (!result) {
      // Path not found (404) - try custom /404 page
      const errorPage = await tryFetchErrorPage(404, host, cacheKey);
      if (errorPage && !(errorPage as { subscription_expired?: boolean }).subscription_expired) {
        const localizedErrorPage = localizeValue(errorPage);
        const theme = localizedErrorPage.theme ?? "default";
        const pageConfig = { ...localizedErrorPage, theme: undefined } as Parameters<
          typeof Render
        >[0]["pageConfig"];
        return <Render theme={theme} pageConfig={pageConfig} hostHeader={host} />;
      }
      return <DefaultErrorPage code={404} />;
    }

    if ((result as { subscription_expired?: boolean }).subscription_expired) {
      const storeTitle = localizeValue((result as { store_title?: string }).store_title) ?? "";
      return <ExpiredSubscriptionPage storeTitle={storeTitle} />;
    }

    const localizedResult = localizeValue(result);
    const theme = localizedResult.theme ?? "default";
    const pageConfig = { ...localizedResult, theme: undefined } as Parameters<
      typeof Render
    >[0]["pageConfig"];

    return <Render theme={theme} pageConfig={pageConfig} hostHeader={host} />;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status as number | undefined;
      let errorCode: ErrorCode | null = null;
      if (status === 500) errorCode = 500;
      else if (status === 403) errorCode = 403;

      if (errorCode) {
        try {
          const errorPage = await tryFetchErrorPage(errorCode, host, cacheKey);
          if (errorPage && !(errorPage as { subscription_expired?: boolean }).subscription_expired) {
            const localizedErrorPage = localizeValue(errorPage);
            const theme = localizedErrorPage.theme ?? "default";
            const pageConfig = { ...localizedErrorPage, theme: undefined } as Parameters<
              typeof Render
            >[0]["pageConfig"];
            return <Render theme={theme} pageConfig={pageConfig} hostHeader={host} />;
          }
        } catch {
          // Ignore - fall through to DefaultErrorPage
        }
        return <DefaultErrorPage code={errorCode} />;
      }
    }
    throw err;
  }
}
