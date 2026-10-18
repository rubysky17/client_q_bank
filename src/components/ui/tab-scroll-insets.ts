import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Insets for the scroll view of a native tab screen: spread `contentInsetAdjustmentBehavior`
 * on the list and add `paddingTop` to its content.
 *
 * iOS: the tab bar floats over the content (Liquid Glass), so UIKit insets the list below the
 * status bar and above the tab bar ('automatic'); a fixed bottom padding would end up under it.
 * Android: native tabs already keep the screen above the tab bar; only the status bar is ours.
 */
export function useTabScrollInsets() {
  const { top } = useSafeAreaInsets();
  return {
    contentInsetAdjustmentBehavior: 'automatic',
    paddingTop: Platform.OS === 'ios' ? 12 : top + 12,
  } as const;
}
