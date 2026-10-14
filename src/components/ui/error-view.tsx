import Ionicons from '@expo/vector-icons/Ionicons';
import { Button, Text, useThemeColor } from 'heroui-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { describeError } from '@/api/errors';

type ErrorViewProps = {
  error: unknown;
  onRetry?: () => void;
};

export function ErrorView({ error, onRetry }: ErrorViewProps) {
  const { t } = useTranslation();
  const dangerColor = useThemeColor('danger');

  return (
    <View className="flex-1 items-center justify-center gap-4 p-6">
      <Ionicons name="cloud-offline-outline" size={40} color={dangerColor} />
      <Text align="center" color="muted">
        {describeError(error, t)}
      </Text>
      {onRetry ? (
        <Button variant="secondary" onPress={onRetry}>
          <Button.Label>{t('common.retry')}</Button.Label>
        </Button>
      ) : null}
    </View>
  );
}
