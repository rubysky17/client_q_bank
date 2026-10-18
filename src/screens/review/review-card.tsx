import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { ReviewQuestion } from '@/api/attempts';
import {
  AnswerView,
  Explanation,
  parseAnswer,
  parseInput,
  parseKey,
  QuestionStem,
  QuestionTags,
  useQuestionLabel,
} from '@/components/question';
import { Card, Text, useThemeColor } from '@/components/ui';

import { outcomeOf } from './review-filters';

// Literal class names so Tailwind generates them.
export const VERDICT = {
  correct: { bg: 'bg-success-soft', fg: 'text-success-soft-foreground', icon: 'checkmark-circle' },
  wrong: { bg: 'bg-danger-soft', fg: 'text-danger-soft-foreground', icon: 'close-circle' },
  notAnswered: { bg: 'bg-default', fg: 'text-default-foreground', icon: 'remove-circle-outline' },
} as const;

/** One question with the user's answer, the correct one and the explanation. */
export function ReviewCard({ question }: { question: ReviewQuestion }) {
  const { t } = useTranslation();
  const label = useQuestionLabel();
  const input = parseInput(question.type, question.data);
  const key = parseKey(question.type, question.answerKey);
  const answer = parseAnswer(question.type, question.response);
  const verdict = outcomeOf(question);
  const tone = VERDICT[verdict];
  const [success, danger, muted] = useThemeColor(['success', 'danger', 'muted']);

  return (
    <Card className="gap-4 border border-border">
      <View className="flex-row flex-wrap items-center gap-2">
        <View className={`flex-row items-center gap-1 rounded-full px-2.5 py-1 ${tone.bg}`}>
          <Ionicons
            name={tone.icon}
            size={14}
            color={verdict === 'correct' ? success : verdict === 'wrong' ? danger : muted}
          />
          <Text type="body-xs" weight="semibold" className={tone.fg}>
            {t(`review.${verdict}`)}
          </Text>
        </View>
        <Text type="body-xs" weight="medium" color="muted" className="ml-auto">
          {`${question.score ?? 0}/${question.points}`}
        </Text>
      </View>
      <QuestionTags
        label={label(question.sectionTitle, question.sourceNumber, question.order)}
        domain={question.domain?.name}
        difficulty={question.difficulty}
      />
      {/* Folded: the same case study repeats over several questions in a row. */}
      <QuestionStem
        caseStudy={question.caseStudy}
        content={question.content}
        media={question.media}
        caseStudyOpen={false}
      />
      {input ? <AnswerView input={input} answer={answer} solution={key} /> : null}
      <Explanation explanation={question.explanation} media={question.media} />
    </Card>
  );
}
