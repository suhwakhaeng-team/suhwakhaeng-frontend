// iOS ColorExtension/Spacing/Radius에서 1:1 추출한 디자인 토큰.
// 프로젝트 컨벤션: 인라인 스타일 사용 — 이 상수를 import해 참조한다.

export const colors = {
  black: '#000000',
  white: '#FFFFFF',

  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D2D5DA',
  gray400: '#9CA3AF',
  gray500: '#6D7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',

  brand50: '#EFF6FF',
  brand100: '#DBEAFE',
  brand400: '#60A5FA',
  brand500: '#3B82F6',
  brand600: '#2563EB',
  brand700: '#1D4ED8',

  red500: '#EF4444',
  yellow500: '#EAB308',
  green500: '#22C55E',
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  x3l: 48,
  x4l: 64,
} as const;

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const typography = {
  displayXLBold: {
    fontSize: 24,
    fontWeight: 700,
    lineHeight: 1.4,
    letterSpacing: '-0.084px',
  },
  headingXLBold: {
    fontSize: 20,
    fontWeight: 700,
    lineHeight: 1.4,
    letterSpacing: '-0.07px',
  },
  headingXLSemiBold: {
    fontSize: 20,
    fontWeight: 600,
    lineHeight: 1.4,
    letterSpacing: '-0.07px',
  },
  headingLgBold: {
    fontSize: 18,
    fontWeight: 700,
    lineHeight: 1.4,
    letterSpacing: '-0.063px',
  },
  headingLgSemiBold: {
    fontSize: 18,
    fontWeight: 600,
    lineHeight: 1.4,
    letterSpacing: '-0.063px',
  },
  headingMdBold: {
    fontSize: 16,
    fontWeight: 700,
    lineHeight: 1.4,
    letterSpacing: '-0.056px',
  },
  headingMdSemiBold: {
    fontSize: 16,
    fontWeight: 600,
    lineHeight: 1.4,
    letterSpacing: '-0.056px',
  },
  headingSmBold: {
    fontSize: 15,
    fontWeight: 700,
    lineHeight: 1.4,
    letterSpacing: '-0.053px',
  },
  bodyTextXLSemiBold: {
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.5,
    letterSpacing: '-0.049px',
  },
  bodyTextXLRegular: {
    fontSize: 14,
    fontWeight: 400,
    lineHeight: 1.5,
    letterSpacing: '-0.049px',
  },
  bodyTextLgMedium: {
    fontSize: 13,
    fontWeight: 500,
    lineHeight: 1.5,
    letterSpacing: '-0.046px',
  },
  bodyTextLgRegular: {
    fontSize: 13,
    fontWeight: 400,
    lineHeight: 1.5,
    letterSpacing: '-0.046px',
  },
  captionSemiBold: {
    fontSize: 12,
    fontWeight: 600,
    lineHeight: 1.5,
    letterSpacing: '-0.042px',
  },
  captionMedium: {
    fontSize: 12,
    fontWeight: 500,
    lineHeight: 1.5,
    letterSpacing: '-0.042px',
  },
} as const;
