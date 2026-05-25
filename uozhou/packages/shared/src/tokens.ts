// 设计令牌 - TypeScript 版本，可同时被 Expo Web (apps/dashboard) 和 Expo Native (apps/mobile) 使用
// CSS 版本见 ../design-system.css（仅 Web 用）
// 与 ai需求.md §2 严格一致

export const colors = {
  primary: '#F59E0B',
  primaryHover: '#D97706',
  secondary: '#3B82F6',
  success: '#10B981',
  warning: '#F97316',
  error: '#EF4444',

  bgPage: '#F9FAFB',
  bgSurface: '#FFFFFF',
  bgDisabled: '#F3F4F6',

  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textPlaceholder: '#9CA3AF',

  border: '#E5E7EB',
  borderFocus: '#F59E0B',

  // 订单状态徽章背景/文字
  badge: {
    pending: { bg: '#FEF3C7', text: '#D97706' },
    confirmed: { bg: '#DBEAFE', text: '#2563EB' },
    ready: { bg: '#D1FAE5', text: '#059669' },
    completed: { bg: '#F3F4F6', text: '#6B7280' },
    cancelled: { bg: '#FEE2E2', text: '#DC2626' },
  },
} as const;

export const fontFamily =
  "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

// 排印 — RN 不支持 shorthand font，逐字段定义
export const typography = {
  heading1: { fontSize: 28, lineHeight: 36, fontWeight: '600' as const },
  heading2: { fontSize: 20, lineHeight: 28, fontWeight: '600' as const },
  heading3: { fontSize: 16, lineHeight: 24, fontWeight: '600' as const },
  bodyLarge: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  bodyBase: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  full: 9999,
} as const;

// 阴影 - 用 boxShadow 字符串（RN 0.76+ / RN Web 0.19+ 均支持）
export const shadows = {
  sm: { boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' } as Record<string, any>,
  md: { boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' } as Record<string, any>,
  lg: { boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' } as Record<string, any>,
} as const;

export const layout = {
  sidebarWidth: 256,
  contentMaxWidth: 1920,
  // 移动端
  tabBarHeight: 60,
  headerHeight: 56,
} as const;

// 一次性导出全部
export const tokens = {
  colors,
  fontFamily,
  typography,
  spacing,
  radius,
  shadows,
  layout,
} as const;

export type Tokens = typeof tokens;
