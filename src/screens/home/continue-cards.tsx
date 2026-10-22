import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { useAttemptsInProgress } from '@/api/attempts';
import {
  Card,
  GradientGlow,
  GradientView,
  PressableFeedback,
  Text,
  useThemeColor,
} from '@/components/ui';
import { useLocalAttempts } from '@/stores/attempt-sessions';

import { continueItems } from './rows';

/**
 * Unfinished attempts, kept on the device (shown offline too) or in progress on another device: the
 * latest as a gradient card, the others as compact rows.
 */
export function ContinueCards() {
  const { t } = useTranslation();
  const { push } = useRouter();
  const accent = useThemeColor('accent');
  const [onBrand, brandEnd] = useCSSVariable(['--color-on-brand', '--color-brand-end']);
  const { data: inProgress } = useAttemptsInProgress();
  const unfinished = continueItems(useLocalAttempts(), inProgress);
  const [latest, ...others] = unfinished;
  if (!latest) return null;

  const open = (id: string) => push({ pathname: '/attempts/[id]', params: { id } });
  const progress = latest.totalQuestions > 0 ? latest.answeredCount / latest.totalQuestions : 0;

  return (
    <View className="gap-2">
      <PressableFeedback onPress={() => open(latest.attemptId)} className="rounded-3xl">
        <GradientView className="gap-3 rounded-3xl p-5">
          <GradientGlow className="-top-16 -right-10 size-44" />
          <GradientGlow className="-right-12 -bottom-14 size-28" />
          <View className="flex-row items-center gap-1 self-start rounded-full bg-on-brand-subtle px-2 py-1">
            <Ionicons
              name="flame"
              size={12}
              color={typeof onBrand === 'string' ? onBrand : undefined}
            />
            <Text type="body-xs" weight="semibold" className="text-on-brand">
              {t('home.inProgress')}
            </Text>
          </View>
          <Text type="h5" className="text-on-brand" numberOfLines={2}>
            {latest.examTitle}
          </Text>
          <Text type="body-sm" className="text-on-brand-muted">
            {t('home.continueMeta', {
              section: t('sectioned.section', { order: latest.sectionOrder }),
              answered: latest.answeredCount,
              total: latest.totalQuestions,
            })}
          </Text>
          <View className="h-1.5 overflow-hidden rounded-full bg-on-brand-track">
            <View
              className="h-full rounded-full bg-on-brand"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </View>
          <View className="h-11 flex-row items-center gap-2 self-start rounded-full bg-on-brand px-5">
            <Ionicons
              name="play"
              size={16}
              color={typeof brandEnd === 'string' ? brandEnd : undefined}
            />
            <Text weight="medium" className="text-brand-end">
              {t('home.resume')}
            </Text>
          </View>
        </GradientView>
      </PressableFeedback>
      {others.map((attempt) => (
        <PressableFeedback
          key={attempt.attemptId}
          onPress={() => open(attempt.attemptId)}
          className="rounded-3xl"
        >
          <Card className="flex-row items-center gap-3 border border-border">
            <Ionicons name="play-circle" size={28} color={accent} />
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
