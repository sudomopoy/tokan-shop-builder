export function ensureThemeCss(themeId: string) {
  if (typeof document === "undefined") return;

  // Mark active theme on <html> so theme CSS can scope itself.
  document.documentElement.setAttribute("data-theme", themeId);

  // Inject theme stylesheet once.
  const href = `/themes/${encodeURIComponent(themeId)}/theme.css`;
  const existing = document.querySelector(`link[rel="stylesheet"][href="${href}"]`);
  if (existing) return;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.setAttribute("data-theme-css", themeId);
  document.head.appendChild(link);
}

