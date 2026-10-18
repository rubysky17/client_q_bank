import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { CaseStudy } from '@/api/attempts';
import { PressableFeedback, Text, useThemeColor } from '@/components/ui';

import { Paragraphs } from './paragraphs';

type CaseStudyPanelProps = {
  caseStudy: CaseStudy;
  /** Open at first; the reader can fold it away once read. */
  initiallyOpen?: boolean;
};

/** The shared scenario of "(Refer to the case study)" questions, foldable. */
export function CaseStudyPanel({ caseStudy, initiallyOpen = true }: CaseStudyPanelProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const accent = useThemeColor('accent');

  return (
    <View className="gap-3 rounded-2xl border border-accent-soft bg-accent-soft/40 p-4">
      <PressableFeedback
        onPress={() => setIsOpen(!isOpen)}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        accessibilityHint={isOpen ? t('question.hideCaseStudy') : t('question.showCaseStudy')}
        className="flex-row items-center gap-2"
      >
        <Ionicons name="document-text-outline" size={18} color={accent} />
        <View className="flex-1">
          <Text type="body-xs" weight="semibold" className="text-accent uppercase">
            {t('question.caseStudy')}
          </Text>
          <Text weight="semibold">{caseStudy.title}</Text>
        </View>
        <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={accent} />
      </PressableFeedback>
      {isOpen ? <Paragraphs text={caseStudy.content} type="body-sm" /> : null}
    </View>
  );
}
