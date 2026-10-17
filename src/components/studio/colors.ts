// Maps common colour words from vision output to hex swatches.

const COLOR_HEX: Record<string, string> = {
  black: "#111111",
  charcoal: "#36393d",
  graphite: "#4a4d52",
  grey: "#8a8d91",
  gray: "#8a8d91",
  silver: "#c8ccd0",
  white: "#f7f7f4",
  offwhite: "#efece4",
  "off white": "#efece4",
  ivory: "#efece4",
  cream: "#f4f2ec",
  ecru: "#e3dcc8",
  beige: "#d9cdb8",
  sand: "#d6c7a8",
  tan: "#c8a97a",
  camel: "#b98a4f",
  khaki: "#b5a469",
  taupe: "#9b8e7f",
  stone: "#b4ac9e",
  brown: "#6f4e37",
  chocolate: "#4a2f22",
  rust: "#a5502a",
  terracotta: "#c1683f",
  orange: "#e07b39",
  peach: "#f0b49a",
  coral: "#ef7b6f",
  red: "#c33b32",
  maroon: "#6b1f26",
  burgundy: "#5e1d2c",
  wine: "#62222f",
  pink: "#e8a0b4",
  blush: "#ecc5c0",
  rose: "#d98a96",
  magenta: "#c23a86",
  purple: "#6c4a9a",
  violet: "#7a5aa6",
  lavender: "#b9a6d8",
  indigo: "#3f4a94",
  navy: "#1e2a44",
  blue: "#3a63b8",
  "royal blue": "#2b4fa2",
  denim: "#5b7aa6",
  "sky blue": "#9ec1e0",
  teal: "#2f7a76",
  mint: "#a8d8bc",
  green: "#4a7a4e",
  olive: "#6b6b3a",
  lime: "#a8c93a",
  yellow: "#e3c33f",
  mustard: "#d0a32a",
  gold: "#c9a227",
  mustardyellow: "#d0a32a",
  nude: "#e0c3b2",
};

export function colorHex(name: string): string | null {
  const key = name
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
  return COLOR_HEX[key] ?? null;
}
