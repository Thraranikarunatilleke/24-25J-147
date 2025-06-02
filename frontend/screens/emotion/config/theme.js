import { StyleSheet } from 'react-native';

export const COLORS = {
  // Primary colors
  PRIMARY: '#3498db',
  SECONDARY: '#2ecc71',
  ACCENT: '#e74c3c',

  // Background colors
  BACKGROUND: {
    PRIMARY: '#1a1a1a',
    SECONDARY: '#2d2d2d',
    CARD: '#1a1a1a',
  },

  // Text colors
  TEXT: {
    PRIMARY: '#ffffff',
    SECONDARY: '#a0a0a0',
    MUTED: '#666666',
  },

  // Border colors
  BORDER: {
    PRIMARY: '#2d2d2d',
    SECONDARY: '#333333',
  },

  // Status colors
  STATUS: {
    SUCCESS: '#2ecc71',
    WARNING: '#f39c12',
    ERROR: '#e74c3c',
    INFO: '#3498db',
  },

  // Emotion specific colors
  EMOTION: {
    AGGRESSIVE: '#e74c3c',
    LAZY_NERVOUS: '#f39c12',
    NORMAL: '#2ecc71',
    TIRED_SLEEPY: '#9b59b6',
  },
};

export const SPACING = {
  XXXS: 2,
  XXS: 4,
  XS: 8,
  S: 12,
  M: 16,
  L: 24,
  XL: 32,
  XXL: 48,
  XXXL: 64,
};

export const BORDER_RADIUS = {
  XS: 4,
  S: 8,
  M: 12,
  L: 16,
  XL: 24,
  ROUND: 9999,
};

export const SHADOW = {
  LIGHT: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  MEDIUM: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  HEAVY: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
};

export const TYPOGRAPHY = {
  H1: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  H2: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  H3: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  BODY: {
    fontSize: 16,
    fontWeight: '400',
  },
  BODY_BOLD: {
    fontSize: 16,
    fontWeight: '600',
  },
  CAPTION: {
    fontSize: 14,
    fontWeight: '400',
  },
  SMALL: {
    fontSize: 12,
    fontWeight: '400',
  },
};

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },
  card: {
    backgroundColor: COLORS.BACKGROUND.CARD,
    borderRadius: BORDER_RADIUS.L,
    padding: SPACING.M,
    marginVertical: SPACING.S,
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
    ...SHADOW.MEDIUM,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textPrimary: {
    color: COLORS.TEXT.PRIMARY,
    ...TYPOGRAPHY.BODY,
  },
  textSecondary: {
    color: COLORS.TEXT.SECONDARY,
    ...TYPOGRAPHY.BODY,
  },
  heading: {
    color: COLORS.TEXT.PRIMARY,
    ...TYPOGRAPHY.H2,
    marginBottom: SPACING.M,
  },
});

const theme = {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  SHADOW,
  TYPOGRAPHY,
  commonStyles,
};

export default theme;