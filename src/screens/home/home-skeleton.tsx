import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, Skeleton } from '@/components/ui';

/** Placeholder with the home layout while the exam list loads (Figma "v2 · 02 Loading"). */
export function HomeSkeleton() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 gap-4 px-4" style={{ paddingTop: insets.top + 12 }}>
      <View className="flex-row items-center gap-3">
        <Skeleton className="size-11 rounded-full" />
        <View className="flex-1 gap-2">
          <Skeleton className="h-4 w-36 rounded-full" />
          <Skeleton className="h-3 w-52 rounded-full" />
        </View>
      </View>
      <Skeleton className="h-44 rounded-3xl" />
      <View className="flex-row gap-3">
        <Skeleton className="h-28 flex-1 rounded-2xl" />
        <Skeleton className="h-28 flex-1 rounded-2xl" />
        <Skeleton className="h-28 flex-1 rounded-2xl" />
      </View>
      <Skeleton className="h-4 w-28 rounded-full" />
      {[0, 1, 2].map((key) => (
        <Card key={key} className="gap-3 border border-border">
          <View className="flex-row items-center gap-3">
            <Skeleton className="size-11 rounded-2xl" />
            <View className="flex-1 gap-2">
              <Skeleton className="h-2.5 w-24 rounded-full" />
              <Skeleton className="h-4 w-52 rounded-full" />
            </View>
          </View>
          <View className="flex-row gap-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </View>
        </Card>
      ))}
    </View>
  );
}
