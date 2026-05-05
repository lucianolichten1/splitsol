export const colors = {
  primary: "#9945FF",
  accent: "#14F195",
  background: "#0A0A0F",
  surface: "#141420",
  border: "#2A2A3A",
  text: "#FFFFFF",
  textMuted: "#8888AA",
  textDim: "#444466",
  success: "#14F195",
  error: "#FF4444",
  warning: "#FF8866",
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
};

export const typography = {
  heading: { fontSize: 20, fontWeight: "700" as const, color: colors.text },
  subhead: { fontSize: 16, fontWeight: "600" as const, color: colors.text },
  body: { fontSize: 14, fontWeight: "400" as const, color: colors.text },
  caption: { fontSize: 12, fontWeight: "400" as const, color: colors.textMuted },
};
