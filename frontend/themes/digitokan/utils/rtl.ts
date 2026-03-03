/**
 * RTL utility functions for Digitokan theme
 */

/**
 * Check if the current direction is RTL
 */
export function isRTL(): boolean {
  if (typeof document === "undefined") return true; // Default to RTL for SSR
  return document.dir === "rtl" || document.documentElement.dir === "rtl";
}

/**
 * Get the appropriate margin/padding property for RTL
 */
export function getDirectionalProperty(property: "left" | "right"): "left" | "right" {
  const rtl = isRTL();
  if (property === "left") {
    return rtl ? "right" : "left";
  }
  return rtl ? "left" : "right";
}

/**
 * Convert a value to RTL-aware value
 * For example: "10px 20px 30px 40px" becomes "10px 40px 30px 20px" in RTL
 */
export function toRTL(value: string): string {
  const rtl = isRTL();
  if (!rtl) return value;
  
  // Handle 4-value syntax (top right bottom left)
  const parts = value.trim().split(/\s+/);
  if (parts.length === 4) {
    return `${parts[0]} ${parts[3]} ${parts[2]} ${parts[1]}`;
  }
  
  return value;
}
