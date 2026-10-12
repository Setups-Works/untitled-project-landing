/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

// design-ok-file: React Native styles cannot consume the web app's CSS custom properties, so these mirror its shared design tokens.
export const NativeTokens = {
  foreground: '#1b1c14',
  background: '#f5f4eb',
  surface: 'rgba(255,255,255,0.78)',
  selected: '#e7eadf',
  muted: '#68695f',
  green: '#1f5d49',
  greenSoft: '#e4eee8',
  darkFill: '#191d1a',
  onDark: '#f4f3e9',
  clay: '#8c5145',
  line: 'rgba(27,28,20,0.08)',
  outline: '#8b8c81',
} as const;

export const Colors = {
  light: {
    text: NativeTokens.foreground,
    background: NativeTokens.background,
    backgroundElement: NativeTokens.surface,
    backgroundSelected: NativeTokens.selected,
    textSecondary: NativeTokens.muted,
  },
  dark: {
    text: NativeTokens.foreground,
    background: NativeTokens.background,
    backgroundElement: NativeTokens.surface,
    backgroundSelected: NativeTokens.selected,
    textSecondary: NativeTokens.muted,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
