import { Skeleton } from 'heroui-native';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Generic placeholder while a screen loads: a header block and a few cards (v2 skeleton). */
export function LoadingView() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 gap-4 px-4" style={{ paddingTop: insets.top + 12 }}>
      <Skeleton className="h-6 w-40 rounded-full" />
      <Skeleton className="h-36 rounded-3xl" />
      <Skeleton className="h-24 rounded-3xl" />
      <Skeleton className="h-24 rounded-3xl" />
    </View>
  );
}
