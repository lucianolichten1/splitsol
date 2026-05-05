export const colors = {
  primary: "#9945FF",
  accent: "#14F195",
  background: "#0A0A0F",
  surface: "#141420",
  /** Slightly lifted surfaces (cards, panels) */
  surfaceElevated: "#1A1A28",
  border: "#2A2A3A",
  borderStrong: "#3D3D52",
  text: "#FFFFFF",
  textMuted: "#8888AA",
  textDim: "#444466",
  success: "#14F195",
  error: "#FF4444",
  warning: "#FF8866",
  accentMuted: "rgba(20, 241, 149, 0.12)",
  primaryMuted: "rgba(153, 69, 255, 0.14)",
  warningMuted: "rgba(255, 136, 102, 0.14)",
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

/** Minimum touch target (Material ~48dp; comfortable for thumbs). */
export const touch = {
  minHeight: 48,
  minWidth: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
};

/** Card depth — use on Android (elevation) and iOS (shadow). */
export const shadows = {
  card: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 5,
  },
  cardSubtle: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 3,
  },
  fab: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.38,
    shadowRadius: 10,
    elevation: 10,
  },
};

/** Horizontal inset for most scroll screens */
export const screenPadding = spacing.md;

export const typography = {
  /** Main screen titles */
  screenTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: colors.text,
    letterSpacing: -0.3,
  },
  heading: { fontSize: 20, fontWeight: "700" as const, color: colors.text },
  subhead: { fontSize: 16, fontWeight: "600" as const, color: colors.text },
  body: { fontSize: 15, fontWeight: "400" as const, color: colors.text, lineHeight: 22 },
  caption: { fontSize: 12, fontWeight: "400" as const, color: colors.textMuted, lineHeight: 18 },
  /** Form / section labels */
  overline: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: colors.textMuted,
    letterSpacing: 0.6,
    textTransform: "uppercase" as const,
  },
};
