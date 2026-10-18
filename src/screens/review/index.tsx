import { FlashList } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { type ReviewQuestion, useAttemptReview } from '@/api/attempts';
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
import { Card, Chip, ErrorView, LoadingView, Text } from '@/components/ui';

type ReviewScreenProps = {
  id: string;
};

export function ReviewScreen({ id }: ReviewScreenProps) {
  const { data: review, error, isPending, refetch } = useAttemptReview(id);

  if (isPending) return <LoadingView />;
  if (!review) return <ErrorView error={error} onRetry={refetch} />;

  return (
    <FlashList
      data={review.questions}
      keyExtractor={(question) => question.id}
      renderItem={({ item }) => <ReviewCard question={item} />}
      ItemSeparatorComponent={Gap}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 16 }}
    />
  );
}

/** One question with the user's answer, the correct one and the explanation. */
function ReviewCard({ question }: { question: ReviewQuestion }) {
  const { t } = useTranslation();
  const label = useQuestionLabel();
  const input = parseInput(question.type, question.data);
  const key = parseKey(question.type, question.answerKey);
  const answer = parseAnswer(question.type, question.response);
  const verdict = answer === null ? 'notAnswered' : question.isCorrect ? 'correct' : 'wrong';

  return (
    <Card className="gap-4">
      <View className="flex-row flex-wrap items-center gap-2">
        <Chip
          size="sm"
          variant="soft"
          color={verdict === 'correct' ? 'success' : verdict === 'wrong' ? 'danger' : 'default'}
        >
          <Chip.Label>{t(`review.${verdict}`)}</Chip.Label>
        </Chip>
        <Text type="body-xs" color="muted" className="ml-auto">
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

function Gap() {
  return <View className="h-3" />;
}
