import { Text } from 'heroui-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { IconTile } from './icon-tile';

type EmptyViewProps = {
  message?: string;
};

export function EmptyView({ message }: EmptyViewProps) {
  const { t } = useTranslation();

  return (
    <View className="items-center justify-center gap-3 p-10">
      <IconTile tone="blue" icon="file-tray-outline" className="size-16 rounded-3xl" />
      <Text color="muted" align="center">
        {message ?? t('common.empty')}
      </Text>
    </View>
  );
}
