import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { retryVocabSyncNow } from '@/api/vocab-sync';
import { Button, Spinner, Text, useThemeColor } from '@/components/ui';

import type { MeaningStatus } from './meaning-status';

type PendingMeaningProps = {
  status: Exclude<MeaningStatus, 'ready'>;
  /** Shown as a "Try again" button when the translation failed. */
  onRetry?: () => void;
};

/**
 * Why a note has no meaning yet: being translated, waiting for the network, waiting for the server
 * or the translator (retried automatically, or now with "Try again"), or failed.
 */
export function PendingMeaning({ status, onRetry }: PendingMeaningProps) {
  const { t } = useTranslation();
  const [muted, danger] = useThemeColor(['muted', 'danger']);

  if (status === 'translating') {
    return (
      <View className="flex-row items-center gap-2">
        <Spinner size="sm" />
        <Text type="body-sm" color="muted">
          {t('vocab.translating')}
        </Text>
      </View>
    );
  }
  if (status === 'waiting') {
    return (
      <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="time-outline" size={16} color={muted} />
          <Text type="body-sm" color="muted">
            {t('vocab.waiting')}
          </Text>
        </View>
        <Button size="sm" variant="ghost" onPress={() => void retryVocabSyncNow()}>
          <Button.Label>{t('common.retry')}</Button.Label>
        </Button>
      </View>
    );
  }
  if (status === 'offline') {
    return (
      <View className="flex-row items-center gap-1.5">
        <Ionicons name="cloud-offline-outline" size={16} color={muted} />
        <Text type="body-sm" color="muted">
          {t('vocab.offline')}
        </Text>
      </View>
    );
  }
  return (
    <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1">
      <View className="flex-row items-center gap-1.5">
        <Ionicons name="alert-circle-outline" size={16} color={danger} />
        <Text type="body-sm" className="text-danger">
          {t('vocab.failed')}
        </Text>
      </View>
      {onRetry ? (
        <Button size="sm" variant="ghost" onPress={onRetry}>
          <Button.Label>{t('common.retry')}</Button.Label>
        </Button>
      ) : null}
    </View>
  );
}
