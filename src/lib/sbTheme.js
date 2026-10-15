// client/src/lib/sbTheme.js
// Shared design tokens for the Navbar and the Ghostfreak AI panel.
// Both themes live here. Components read them as CSS variables (--sb-*),
// so a theme switch only changes the variables, not the markup.

const DARK = {
  bg: "#0B0D12",
  surface: "#12141B",
  "surface-2": "#171A22",
  "surface-3": "#1B1F29",
  border: "#232733",
  "border-soft": "#1B1E28",
  text: "#ECEEF2",
  "text-2": "#8A90A0",
  "text-3": "#565C6E",
  blue: "#6E9BF4",
  "blue-soft": "rgba(110,155,244,0.14)",
  "blue-line": "rgba(110,155,244,0.25)",
  "on-blue": "#0B0D12",
  amber: "#D9A441",
  "amber-soft": "rgba(217,164,65,0.12)",
  "amber-line": "rgba(217,164,65,0.35)",
  red: "#F0576B",
  "red-soft": "rgba(240,87,107,0.12)",
  "red-line": "rgba(240,87,107,0.35)",
  green: "#4ADE8F",
  purple: "#B08DF0",
  "purple-soft": "rgba(176,141,240,0.16)",
  "nav-bg": "rgba(11,13,18,0.9)",
  shadow: "0 40px 80px -32px rgba(0,0,0,0.6)",
};

const LIGHT = {
  bg: "#F5F6FA",
  surface: "#FFFFFF",
  "surface-2": "#F1F3F8",
  "surface-3": "#E6E9F1",
  border: "#DADFE9",
  "border-soft": "#E6E9F1",
  text: "#14171F",
  "text-2": "#5A6275",
  "text-3": "#7A8399",
  blue: "#3B6FE0",
  "blue-soft": "rgba(59,111,224,0.10)",
  "blue-line": "rgba(59,111,224,0.28)",
  "on-blue": "#FFFFFF",
  amber: "#B7791F",
  "amber-soft": "rgba(183,121,31,0.10)",
  "amber-line": "rgba(183,121,31,0.35)",
  red: "#D6334A",
  "red-soft": "rgba(214,51,74,0.08)",
  "red-line": "rgba(214,51,74,0.30)",
  green: "#1E9E62",
  purple: "#7C4DD6",
  "purple-soft": "rgba(124,77,214,0.10)",
  "nav-bg": "rgba(255,255,255,0.88)",
  shadow: "0 24px 60px -28px rgba(20,23,31,0.35)",
};

export const SB_FONTS = {
  display: "'Space Grotesk', system-ui, sans-serif",
  body: "'Inter', system-ui, sans-serif",
  mono: "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
};

// Returns an object to spread into a style prop on the component root.
export function sbVars(theme) {
  const palette = theme === "light" ? LIGHT : DARK;
  const vars = {};
  for (const [key, value] of Object.entries(palette)) vars[`--sb-${key}`] = value;
  vars["--sb-display"] = SB_FONTS.display;
  vars["--sb-body"] = SB_FONTS.body;
  vars["--sb-mono"] = SB_FONTS.mono;
  return vars;
}