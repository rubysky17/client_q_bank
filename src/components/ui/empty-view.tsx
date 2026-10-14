import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, useThemeColor } from 'heroui-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

type EmptyViewProps = {
  message?: string;
};

export function EmptyView({ message }: EmptyViewProps) {
  const { t } = useTranslation();
  const mutedColor = useThemeColor('muted');

  return (
    <View className="items-center justify-center gap-3 p-10">
      <Ionicons name="file-tray-outline" size={36} color={mutedColor} />
      <Text color="muted">{message ?? t('common.empty')}</Text>
    </View>
  );
}
