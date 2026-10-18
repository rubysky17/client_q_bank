import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { CaseStudy, Difficulty, QuestionMedia as Media } from '@/api/attempts';
import { Chip, Text } from '@/components/ui';

import { CaseStudyPanel } from './case-study-panel';
import { Paragraphs } from './paragraphs';
import { QuestionMedia } from './question-media';

type QuestionStemProps = {
  caseStudy: CaseStudy | null;
  content: string;
  /** Only CONTENT images are shown here; explanation images belong to the explanation. */
  media: readonly Media[];
  caseStudyOpen?: boolean;
};

/** Case study, stem and figures of a question. */
export function QuestionStem({
  caseStudy,
  content,
  media,
  caseStudyOpen = true,
}: QuestionStemProps) {
  return (
    <View className="gap-4">
      {caseStudy ? (
        <CaseStudyPanel key={caseStudy.title} caseStudy={caseStudy} initiallyOpen={caseStudyOpen} />
      ) : null}
      <Paragraphs text={content} weight="medium" />
      <QuestionMedia media={media.filter((item) => item.placement === 'CONTENT')} />
    </View>
  );
}

type QuestionTagsProps = {
  /** "Section 1 · Q17" style label. */
  label: string;
  domain?: string | null;
  difficulty?: Difficulty | null;
};

export function QuestionTags({ label, domain, difficulty }: QuestionTagsProps) {
  const { t } = useTranslation();

  return (
    <View className="flex-row flex-wrap items-center gap-2">
      <Chip size="sm" variant="soft">
        <Chip.Label>{label}</Chip.Label>
      </Chip>
      {domain ? (
        <Chip size="sm" variant="soft" color="accent">
          <Chip.Label>{domain}</Chip.Label>
        </Chip>
      ) : null}
      {difficulty ? (
        <Chip size="sm" variant="soft" color={difficulty === 'EXPERT' ? 'danger' : 'warning'}>
          <Chip.Label>{t(`difficulty.${difficulty}`)}</Chip.Label>
        </Chip>
      ) : null}
    </View>
  );
}

type ExplanationProps = {
  explanation: string | null;
  media: readonly Media[];
};

/** The explanation with the images that belong to it (e.g. the solved table). */
export function Explanation({ explanation, media }: ExplanationProps) {
  const { t } = useTranslation();
  const images = media.filter((item) => item.placement === 'EXPLANATION');
  if (!explanation && images.length === 0) return null;

  return (
    <View className="gap-3 rounded-2xl bg-surface-secondary p-4">
      <Text type="body-xs" weight="semibold" color="muted" className="uppercase">
        {t('review.explanation')}
      </Text>
      {explanation ? <Paragraphs text={explanation} type="body-sm" /> : null}
      <QuestionMedia media={images} />
    </View>
  );
}

/** "Section 1 · Q17" when the source number is known, else the position in the attempt. */
export function useQuestionLabel() {
  const { t } = useTranslation();
  return (sectionTitle: string, sourceNumber: number | null, fallback: number) =>
    `${sectionTitle} · ${t('question.number', { n: sourceNumber ?? fallback })}`;
}
