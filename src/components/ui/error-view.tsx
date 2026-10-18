import { Button, Text } from 'heroui-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { describeError } from '@/api/errors';

import { FeatureIcon } from './feature-icon';

type ErrorViewProps = {
  error: unknown;
  onRetry?: () => void;
};

export function ErrorView({ error, onRetry }: ErrorViewProps) {
  const { t } = useTranslation();

  return (
    <View className="flex-1 items-center justify-center gap-5 p-6">
      <FeatureIcon icon="cloud-offline-outline" size={72} />
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
