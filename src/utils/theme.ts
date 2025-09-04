// src/utils/theme.ts
export type Theme = "light" | "dark";

export function applyTheme(t: Theme) {
  const theme = t === "dark" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", theme);
}

export function bootTheme() {
  // no-op (you can add localStorage logic later if desired)
  applyTheme("light");
}
