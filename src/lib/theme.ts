// Theme preference plumbing shared by the blocking head script and the React hook.

export type ThemePref = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export const THEME_KEY = "wardrobe:theme";
export const DEFAULT_THEME_PREF: ThemePref = "dark";

export function isThemePref(value: unknown): value is ThemePref {
  return value === "system" || value === "light" || value === "dark";
}

export function systemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function resolveTheme(pref: ThemePref): ResolvedTheme {
  return pref === "system" ? systemTheme() : pref;
}

export function readThemePref(): ThemePref {
  if (typeof window === "undefined") return DEFAULT_THEME_PREF;
  try {
    const raw = window.localStorage.getItem(THEME_KEY);
    return isThemePref(raw) ? raw : DEFAULT_THEME_PREF;
  } catch {
    return DEFAULT_THEME_PREF;
  }
}

export function writeThemePref(pref: ThemePref): void {
  try {
    window.localStorage.setItem(THEME_KEY, pref);
  } catch {
    // Private browsing can block writes; the session still switches themes.
  }
}

export function applyTheme(resolved: ResolvedTheme): void {
  document.documentElement.dataset.theme = resolved;
}

// Runs synchronously in <head> so the right theme is on screen before first paint.
export const THEME_SCRIPT = `(function(){try{var t=null;try{t=localStorage.getItem("${THEME_KEY}")}catch(e){}var m=window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";var r=t==="light"||t==="dark"?t:t==="system"?m:"dark";document.documentElement.dataset.theme=r}catch(e){}})()`;
