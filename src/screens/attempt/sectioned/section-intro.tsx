import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import type { SessionState } from '@/attempt-engine/types';
import {
  ActionBar,
  Card,
  GradientButton,
  GradientGlow,
  GradientView,
  IconTile,
  Text,
  TONES,
} from '@/components/ui';
import { dispatchAttempt } from '@/stores/attempt-sessions';

type SectionIntroProps = {
  state: SessionState;
  sectionTitle: (order: number) => string;
};

/** Before the first section: the format and the rules, then "start". */
export function SectionIntro({ state, sectionTitle }: SectionIntroProps) {
  const { t } = useTranslation();
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
      <ScrollView contentContainerClassName="gap-4 px-4 pt-2 pb-4">
        <GradientView className="gap-3 rounded-3xl p-5">
          <GradientGlow className="-top-16 -right-12 size-48" />
          <Text type="body-sm" weight="medium" className="text-on-brand-muted">
            {t('sectioned.introEyebrow', { count: state.sections.length })}
          </Text>
          <View className="gap-2">
            {state.sections.map((section) => (
              <View
                key={section.order}
                className="flex-row items-center gap-3 rounded-2xl bg-on-brand-subtle px-3 py-2.5"
              >
                <View className="size-7 items-center justify-center rounded-full bg-on-brand">
                  <Text type="body-xs" weight="semibold" className="text-brand-end">
                    {section.order}
                  </Text>
                </View>
                <Text weight="medium" className="flex-1 text-on-brand" numberOfLines={1}>
                  {sectionTitle(section.order)}
                </Text>
                <Text type="body-sm" className="text-on-brand-muted">
                  {t('home.minutes', { count: Math.round(section.budgetMs / 60_000) })}
                </Text>
              </View>
            ))}
          </View>
          {state.breakMinutes === null ? null : (
            <Text type="body-sm" className="text-on-brand-muted">
              {t('sectioned.breakBetween', { count: state.breakMinutes })}
            </Text>
          )}
        </GradientView>
        <Card className="gap-4 border border-border">
          <Text weight="semibold">{t('sectioned.rulesTitle')}</Text>
          {rules.map((rule, index) => (
            <View key={rule.icon} className="flex-row items-center gap-3">
              <IconTile icon={rule.icon} tone={TONES[index % TONES.length]!} size="sm" />
              <Text type="body-sm" className="flex-1 leading-5">
                {rule.text}
              </Text>
            </View>
          ))}
        </Card>
      </ScrollView>
      <ActionBar>
        <GradientButton
          className="flex-1"
          icon="play"
          label={t('sectioned.startSection', { title: first ? sectionTitle(first.order) : '' })}
          onPress={() => {
            if (first) {
              dispatchAttempt(state.attemptId, {
                type: 'SECTION_START',
                sectionOrder: first.order,
              });
            }
          }}
        />
      </ActionBar>
    </View>
  );
}
