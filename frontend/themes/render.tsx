"use server";
import dynamic from "next/dynamic";
import { getThemeManifest } from "./registery";
import { PageConfig, ThemeManifest, WidgetConfig } from "./types";
import { ReactNode } from "react";
import { PageRuntimeProvider } from "./runtime/PageRuntimeProvider";
import { fetchPageWidgetData } from "@/lib/server/fetchPageWidgetData";

interface RenderProps {
    theme: string;
    pageConfig: PageConfig;
    hostHeader?: string | null;
}

function MissingWidgetFallback({ widgetName }: { widgetName: string }) {
    return (
        <div className="border-2 border-dashed border-red-300 bg-red-50 rounded-lg p-8 my-4">
            <div className="flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-6 w-6 text-red-500" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                        />
                    </svg>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-red-700">
                        Missing Widget Component
                    </h3>
                    <p className="text-sm text-red-600 mt-1">
                        Widget <code className="px-2 py-1 bg-red-100 rounded text-xs font-mono">{widgetName}</code> is not available
                    </p>
                </div>
            </div>
        </div>
    );
}


function RenderContent({ content, themeId, children }: { content: WidgetConfig | null, themeId: string, children?: ReactNode }) {
    if (!content || !content.widget) {
        return (
            <MissingWidgetFallback widgetName="Unknown" />
        );
    }

    const Widget = dynamic(
      () => import(`./${themeId}/widgets/${content.widget.replaceAll('.', '/')}`)
        .catch((error) => {
          console.log('Widget import failed:', error);
          return {
            default: () => <MissingWidgetFallback widgetName={content.widget} />
          };
        }),
      { ssr: true }
    ) as React.ComponentType<{ config?: WidgetConfig; children?: ReactNode }>;
  
    return (
      <Widget key={`${content.index ?? 0}-${content.widget}`} config={content}>
        {children}
      </Widget>
    );
}
  
export default async function Render({ theme, pageConfig, hostHeader = null }: RenderProps) {
    const themeManifest = await getThemeManifest(theme);

    // Pre-fetch widget data for full SSR
    const initialData = await fetchPageWidgetData(pageConfig, hostHeader);

    // Filter out null/undefined content items
    const validContent = (pageConfig.content || []).filter((item) => item && item.widget);

    // If page has no layout widget configured, fall back to theme default layout.
    const layoutConfig: WidgetConfig = pageConfig.layout ?? { widget: "layout", index: 0 };

    return (
        <themeManifest.provider>
            <PageRuntimeProvider pageConfig={pageConfig} initialData={initialData}>
                <RenderContent content={layoutConfig} themeId={themeManifest.id}>
                    {validContent
                        .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
                        .map((content) => (
                            <RenderContent
                                key={`${themeManifest.id}-${content.index ?? 0}-${content.widget}`}
                                content={content}
                                themeId={themeManifest.id}
                            />
                        ))}
                </RenderContent>
            </PageRuntimeProvider>
        </themeManifest.provider>
    );
}