import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { CaseStudy, Difficulty, QuestionMedia as Media } from '@/api/attempts';
import { Chip, IconTile, Text } from '@/components/ui';

import { CaseStudyPanel } from './case-study-panel';
import { Paragraphs } from './paragraphs';
import { QuestionMedia } from './question-media';

type QuestionStemProps = {
  caseStudy: CaseStudy | null;
  content: string;
  /** Only CONTENT images are shown here; explanation images belong to the explanation. */
  media: readonly Media[];
  caseStudyOpen?: boolean;
  /** Turns on the vocabulary layer, e.g. the question id (blocks `${vocabId}:stem:…`). */
  vocabId?: string;
};

/** Case study, stem and figures of a question. */
export function QuestionStem({
  caseStudy,
  content,
  media,
  caseStudyOpen = true,
  vocabId,
}: QuestionStemProps) {
  return (
    <View className="gap-4">
      {caseStudy ? (
        <CaseStudyPanel
          key={caseStudy.title}
          caseStudy={caseStudy}
          initiallyOpen={caseStudyOpen}
          vocabId={vocabId === undefined ? undefined : `${vocabId}:case`}
        />
      ) : null}
      <Paragraphs
        text={content}
        weight="medium"
        vocabId={vocabId === undefined ? undefined : `${vocabId}:stem`}
      />
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
  /** Turns on the vocabulary layer (block id prefix). */
  vocabId?: string;
};

/** The explanation with the images that belong to it (e.g. the solved table). */
export function Explanation({ explanation, media, vocabId }: ExplanationProps) {
  const { t } = useTranslation();
  const images = media.filter((item) => item.placement === 'EXPLANATION');
  if (!explanation && images.length === 0) return null;

  return (
    <View className="gap-3 rounded-2xl border border-border bg-surface-secondary p-4">
      <View className="flex-row items-center gap-2">
        <IconTile tone="amber" icon="bulb-outline" size="sm" />
        <Text type="body-sm" weight="semibold">
          {t('review.explanation')}
        </Text>
      </View>
      {explanation ? (
        <Paragraphs
          text={explanation}
          type="body-sm"
          vocabId={vocabId === undefined ? undefined : `${vocabId}:explanation`}
        />
      ) : null}
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
