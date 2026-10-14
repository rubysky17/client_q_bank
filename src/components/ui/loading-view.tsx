import { Spinner } from 'heroui-native';
import { View } from 'react-native';

export function LoadingView() {
  return (
    <View className="flex-1 items-center justify-center">
      <Spinner />
    </View>
  );
}
