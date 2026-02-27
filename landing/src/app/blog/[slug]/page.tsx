import { BlogArticleClient } from "@/components/BlogArticleClient";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080").replace(
  /\/$/,
  ""
);
const STORE_HOST = process.env.NEXT_PUBLIC_SITE_URL ?? "tokan.app";

// Required for output: export - Next.js needs at least one param; empty array = "missing"
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  try {
    const res = await fetch(
      `${API_BASE}/article/?module=blog&page_size=100`,
      {
        headers: { "X-Store-Host": STORE_HOST },
        next: { revalidate: 0 },
      }
    );
    if (!res.ok) return [{ slug: "_empty" }];
    const data = await res.json();
    const results = data?.results ?? [];
    const slugs = results.map((a: { slug: string }) => ({ slug: a.slug }));
    return slugs.length > 0 ? slugs : [{ slug: "_empty" }];
  } catch {
    return [{ slug: "_empty" }];
  }
}

export default function BlogArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  return <BlogArticleClient slug={params.slug} />;
}
