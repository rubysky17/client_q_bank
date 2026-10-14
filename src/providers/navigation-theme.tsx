import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useThemeColor } from 'heroui-native';
import type { PropsWithChildren } from 'react';
import { useUniwind } from 'uniwind';

/** Native headers, tab bar and screen backgrounds follow the HeroUI theme tokens. */
export function NavigationTheme({ children }: PropsWithChildren) {
  const { theme } = useUniwind();
  const [background, foreground, border, accent] = useThemeColor([
    'background',
    'foreground',
    'border',
    'accent',
  ]);
  const isDark = theme === 'dark';
  const base = isDark ? DarkTheme : DefaultTheme;

  return (
    <ThemeProvider
      value={{
        ...base,
        colors: {
          ...base.colors,
          primary: accent,
          background,
          card: background,
          text: foreground,
          border,
          notification: accent,
        },
      }}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {children}
    </ThemeProvider>
  );
}
