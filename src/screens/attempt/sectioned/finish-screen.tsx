import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { type SyncOutcome, syncAttempt } from '@/api/attempt-sync';
import { Button, FeatureIcon, GradientButton, Spinner, Text } from '@/components/ui';

type FinishScreenProps = {
  id: string;
  closing: 'SUBMIT' | 'ABANDON';
};

/**
 * The attempt is handed in (or abandoned) on the device; this uploads it and shows the result. Offline,
 * everything stays on the device and is uploaded and submitted by itself once the network is back.
 */
export function FinishScreen({ id, closing }: FinishScreenProps) {
  const { t } = useTranslation();
  const { replace, back, canGoBack } = useRouter();
  const [outcome, setOutcome] = useState<SyncOutcome | 'RUNNING'>('RUNNING');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    void syncAttempt(id).then((result) => {
      if (!alive) return;
      setOutcome(result);
      if (result === 'DONE' || result === 'CLOSED') {
        if (closing === 'SUBMIT') replace({ pathname: '/attempts/[id]/result', params: { id } });
        else if (canGoBack()) back();
      }
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run per retry only
  }, [id, attempt]);

  if (outcome === 'RUNNING' || outcome === 'DONE' || outcome === 'CLOSED') {
    return (
      <View className="flex-1 items-center justify-center gap-5 p-8">
        <FeatureIcon icon="cloud-upload-outline" />
        <View className="flex-row items-center gap-2">
          <Spinner size="sm" />
          <Text color="muted">{t('sectioned.uploading')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center gap-6 p-8">
      <FeatureIcon icon="cloud-offline-outline" />
      <View className="items-center gap-2">
        <Text type="h4" className="text-center">
          {closing === 'SUBMIT' ? t('sectioned.savedOfflineSubmit') : t('sectioned.savedOffline')}
        </Text>
        <Text color="muted" className="text-center">
          {t('sectioned.savedOfflineHint')}
        </Text>
      </View>
      <View className="w-full gap-3">
        <GradientButton
          icon="refresh"
          label={t('common.retry')}
          onPress={() => {
            setOutcome('RUNNING');
            setAttempt((n) => n + 1);
          }}
        />
        <Button variant="secondary" onPress={() => replace('/')}>
          <Button.Label>{t('common.goHome')}</Button.Label>
        </Button>
      </View>
    </View>
  );
}
