import { fonts } from "./fonts";

export const colors = {
  // Core surfaces
  background: "#07110E",
  backgroundSoft: "#0B1A17",
  surface: "#101D18",
  surfaceElevated: "#162A25",
  surfaceMuted: "#1D332D",

  // Borders
  border: "#263B34",
  borderStrong: "#3A5750",

  // Text hierarchy
  text: "#F1F7EF",
  textMuted: "#6F7F76",
  textDim: "#6E827C",

  // Accents
  accent: "#B9F8D0",
  accentStrong: "#77E6B6",
  primary: "#9DE7C6",
  primaryMuted: "rgba(157, 231, 198, 0.16)",
  accentMuted: "rgba(185, 243, 217, 0.20)",

  // Semantic
  success: "#A9F7C6",
  warning: "#F0A6A6",
  warningMuted: "rgba(240, 166, 166, 0.16)",
  error: "#F0A6A6",
};

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 32,
  xxl: 44,
};

/**
 * Vertical rhythm — prefer these over one-off margins/gaps.
 * 8pt grid: xs=8, sm=12, md=18, lg=24.
 */
export const layout = {
  /** Title → subtitle */
  titleGap: spacing.xs,
  /** Icon + label, chip gutters */
  inline: spacing.xs,
  /** Lines inside a card (label → value) */
  stack: spacing.sm,
  /** Major blocks on a screen (hero → search → actions) */
  block: spacing.md,
  /** Distinct sections (e.g. Groups vs Friends) */
  section: spacing.lg,
  screenPaddingH: spacing.md,
  screenPaddingV: spacing.md,
  cardPadding: spacing.md,
  cardPaddingDense: spacing.sm,
  /** Space between list cards / rows */
  listGap: spacing.sm,
  scrollBottom: spacing.xxl,
} as const;

export const touch = {
  minHeight: 48,
  minWidth: 48,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 30,
  pill: 999,
};

export const shadows = {
  card: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  cardSubtle: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
  fab: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
};

export const screenPadding = layout.screenPaddingH;

export const typography = {
  screenTitle: {
    fontSize: 40,
    fontWeight: "normal" as const,
    fontFamily: fonts.display,
    color: colors.text,
    letterSpacing: -0.8,
  },
  heading: {
    fontSize: 26,
    fontWeight: "normal" as const,
    fontFamily: fonts.headingBold,
    color: colors.text,
    letterSpacing: -0.4,
  },
  subhead: { fontSize: 18, fontWeight: "normal" as const, fontFamily: fonts.headingBold, color: colors.text },
  body: { fontSize: 15, fontWeight: "normal" as const, fontFamily: fonts.body, color: colors.text, lineHeight: 22 },
  caption: { fontSize: 12, fontWeight: "normal" as const, fontFamily: fonts.body, color: colors.textMuted, lineHeight: 18 },
  overline: {
    fontSize: 11,
    fontWeight: "normal" as const,
    fontFamily: fonts.headingBold,
    color: colors.textMuted,
    letterSpacing: 0.7,
    textTransform: "uppercase" as const,
  },
};
