import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { SessionState } from '@/attempt-engine/types';
import { Button, Card, Text, useThemeColor } from '@/components/ui';
import { dispatchAttempt } from '@/stores/attempt-sessions';

type SectionIntroProps = {
  state: SessionState;
  sectionTitle: (order: number) => string;
};

/** Before the first section: the format and the rules, then "start". */
export function SectionIntro({ state, sectionTitle }: SectionIntroProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const accent = useThemeColor('accent');
  const first = state.sections[0];
  const rules = [
    { icon: 'time-outline', text: t('sectioned.ruleClock') },
    { icon: 'pause-circle-outline', text: t('sectioned.rulePause') },
    { icon: 'close-circle-outline', text: t('sectioned.ruleEliminate') },
    { icon: 'flag-outline', text: t('sectioned.ruleFlag') },
    { icon: 'lock-closed-outline', text: t('sectioned.ruleLock') },
    { icon: 'cloud-offline-outline', text: t('sectioned.ruleOffline') },
  ] as const;

  return (
    <View className="flex-1">
      <ScrollView contentContainerClassName="gap-4 p-4">
        <Text type="h3">{state.examTitle}</Text>
        <Card className="gap-2">
          {state.sections.map((section) => (
            <View key={section.order} className="flex-row justify-between">
              <Text>{sectionTitle(section.order)}</Text>
              <Text color="muted">
                {t('home.minutes', { count: Math.round(section.budgetMs / 60_000) })}
              </Text>
            </View>
          ))}
          {state.breakMinutes === null ? null : (
            <Text type="body-sm" color="muted">
              {t('sectioned.breakBetween', { count: state.breakMinutes })}
            </Text>
          )}
        </Card>
        <View className="gap-3">
          {rules.map((rule) => (
            <View key={rule.icon} className="flex-row gap-3">
              <Ionicons name={rule.icon} size={20} color={accent} />
              <Text type="body-sm" className="flex-1 leading-5">
                {rule.text}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <View
        className="border-t border-separator bg-background px-4 pt-3"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        <Button
          onPress={() =>
            first &&
            dispatchAttempt(state.attemptId, { type: 'SECTION_START', sectionOrder: first.order })
          }
        >
          <Button.Label>
            {t('sectioned.startSection', { title: first ? sectionTitle(first.order) : '' })}
          </Button.Label>
        </Button>
      </View>
    </View>
  );
}
