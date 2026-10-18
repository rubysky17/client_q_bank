import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { type SyncOutcome, syncAttempt } from '@/api/attempt-sync';
import { Button, Spinner, Text, useThemeColor } from '@/components/ui';

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
  const muted = useThemeColor('muted');
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
      <View className="flex-1 items-center justify-center gap-4 p-8">
        <Spinner />
        <Text color="muted">{t('sectioned.uploading')}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center gap-6 p-8">
      <Ionicons name="cloud-offline-outline" size={64} color={muted} />
      <View className="items-center gap-2">
        <Text type="h4" className="text-center">
          {closing === 'SUBMIT' ? t('sectioned.savedOfflineSubmit') : t('sectioned.savedOffline')}
        </Text>
        <Text color="muted" className="text-center">
          {t('sectioned.savedOfflineHint')}
        </Text>
      </View>
      <View className="w-full gap-3">
        <Button
          onPress={() => {
            setOutcome('RUNNING');
            setAttempt((n) => n + 1);
          }}
        >
          <Button.Label>{t('common.retry')}</Button.Label>
        </Button>
        <Button variant="secondary" onPress={() => replace('/')}>
          <Button.Label>{t('common.goHome')}</Button.Label>
        </Button>
      </View>
    </View>
  );
}
