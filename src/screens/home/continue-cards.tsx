import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Card, PressableFeedback, Text, useThemeColor } from '@/components/ui';
import { useLocalAttempts } from '@/stores/attempt-sessions';

/** Unfinished attempts kept on the device (shown offline too): one tap to continue. */
export function ContinueCards() {
  const { t } = useTranslation();
  const { push } = useRouter();
  const accent = useThemeColor('accent');
  const unfinished = useLocalAttempts().filter((a) => a.closing === null);
  if (unfinished.length === 0) return null;

  return (
    <View className="gap-2">
      <Text type="body-sm" weight="medium" color="muted">
        {t('home.continueTitle')}
      </Text>
      {unfinished.map((attempt) => (
        <PressableFeedback
          key={attempt.attemptId}
          onPress={() => push({ pathname: '/attempts/[id]', params: { id: attempt.attemptId } })}
          className="rounded-3xl"
        >
          <Card className="flex-row items-center gap-3 bg-accent-soft">
            <Ionicons name="play-circle" size={32} color={accent} />
            <Text type="body-sm" className="flex-1" numberOfLines={2}>
              {t('home.continueDetail', {
                title: attempt.examTitle,
                section: t('sectioned.section', { order: attempt.sectionOrder }),
                answered: attempt.answeredCount,
                total: attempt.totalQuestions,
              })}
            </Text>
          </Card>
        </PressableFeedback>
      ))}
    </View>
  );
}
