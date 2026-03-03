import { ThemeManifest } from "./types";

const themeRegistry = {
    default: () => import("./default/manifest"),
    serva: () => import("./serva/manifest"),
    digitokan: () => import("./digitokan/manifest"),
};

/**
 * get theme manifest from theme registry or get default theme manifest if theme is not found
 * @param theme - theme name
 * @returns theme manifest
 */
export  async function getThemeManifest(theme: string): Promise<ThemeManifest> {
    return (await (themeRegistry[theme] || themeRegistry.default)()).default as ThemeManifest;
}