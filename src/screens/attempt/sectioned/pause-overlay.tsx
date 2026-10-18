import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, Text, useThemeColor } from '@/components/ui';
import { getSession } from '@/stores/attempt-sessions';
import { formatClockMs } from '@/utils/format-duration';

type PauseOverlayProps = {
  attemptId: string;
  sectionTitle: string;
  onResume: () => void;
};

/**
 * Covers the question while the clock is stopped, so a pause can't be used to read ahead. Shown after
 * the pause button, after coming back to the app, and when the attempt is reopened.
 */
export function PauseOverlay({ attemptId, sectionTitle, onResume }: PauseOverlayProps) {
  const { t } = useTranslation();
  const { back, canGoBack } = useRouter();
  const muted = useThemeColor('muted');
  const remaining = getSession(attemptId)?.remainingMs() ?? null;

  return (
    <View className="absolute inset-0 items-center justify-center gap-6 bg-background p-8">
      <Ionicons name="pause-circle" size={72} color={muted} />
      <View className="items-center gap-2">
        <Text type="h3">{t('sectioned.paused')}</Text>
        <Text color="muted" className="text-center">
          {t('sectioned.pausedLeft', { title: sectionTitle, time: formatClockMs(remaining) ?? '' })}
        </Text>
        <Text type="body-sm" color="muted" className="text-center">
          {t('sectioned.pausedHint')}
        </Text>
      </View>
      <View className="w-full gap-3">
        <Button onPress={onResume}>
          <Button.Label>{t('sectioned.resume')}</Button.Label>
        </Button>
        {canGoBack() ? (
          <Button variant="secondary" onPress={back}>
            <Button.Label>{t('sectioned.saveAndExit')}</Button.Label>
          </Button>
        ) : null}
      </View>
    </View>
  );
}
