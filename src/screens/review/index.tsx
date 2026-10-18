import Ionicons from '@expo/vector-icons/Ionicons';
import { FlashList } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import {
  type ReviewQuestion,
  SingleChoiceAnswerKeySchema,
  SingleChoiceDataSchema,
  SingleChoiceResponseSchema,
  useAttemptReview,
} from '@/api/attempts';
import { Card, Chip, ErrorView, LoadingView, Text, useThemeColor } from '@/components/ui';
import { optionLetter } from '@/utils/format-duration';

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

/** One question with the user's pick, the correct option and the explanation. */
function ReviewCard({ question }: { question: ReviewQuestion }) {
  const { t } = useTranslation();
  const data = SingleChoiceDataSchema.safeParse(question.data);
  const key = SingleChoiceAnswerKeySchema.safeParse(question.answerKey);
  const response = SingleChoiceResponseSchema.safeParse(question.response);
  const correctId = key.success ? key.data.correctOptionId : null;
  const pickedId = response.success ? response.data.optionId : null;
  const verdict = pickedId === null ? 'notAnswered' : question.isCorrect ? 'correct' : 'wrong';

  return (
    <Card className="gap-3">
      <View className="flex-row flex-wrap items-center gap-2">
        <Text type="body-sm" weight="semibold">
          {`#${question.order}`}
        </Text>
        <Chip
          size="sm"
          variant="soft"
          color={verdict === 'correct' ? 'success' : verdict === 'wrong' ? 'danger' : 'default'}
        >
          <Chip.Label>{t(`review.${verdict}`)}</Chip.Label>
        </Chip>
        <Chip size="sm" variant="soft">
          <Chip.Label>{t(`difficulty.${question.difficulty}`)}</Chip.Label>
        </Chip>
        {question.domain ? (
          <Chip size="sm" variant="soft">
            <Chip.Label>{question.domain.name}</Chip.Label>
          </Chip>
        ) : null}
        <Text type="body-xs" color="muted" className="ml-auto">
          {`${question.score ?? 0}/${question.points}`}
        </Text>
      </View>

      <Text weight="medium" className="leading-6">
        {question.content}
      </Text>

      {data.success ? (
        <View className="gap-2">
          {data.data.options.map((option, index) => (
            <ReviewOption
              key={option.id}
              letter={optionLetter(index)}
              content={option.content}
              isCorrect={option.id === correctId}
              isPicked={option.id === pickedId}
            />
          ))}
        </View>
      ) : null}

      {question.explanation ? (
        <View className="gap-1 rounded-xl bg-surface-secondary p-3">
          <Text type="body-xs" weight="semibold" color="muted">
            {t('review.explanation')}
          </Text>
          <Text type="body-sm" className="leading-5">
            {question.explanation}
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

type ReviewOptionProps = {
  letter: string;
  content: string;
  isCorrect: boolean;
  isPicked: boolean;
};

function ReviewOption({ letter, content, isCorrect, isPicked }: ReviewOptionProps) {
  const [success, danger] = useThemeColor(['success', 'danger']);
  const tone = isCorrect
    ? 'border-success bg-success-soft'
    : isPicked
      ? 'border-danger bg-danger-soft'
      : 'border-border';

  return (
    <View className={`flex-row items-center gap-3 rounded-xl border p-3 ${tone}`}>
      <Text weight="semibold">{letter}</Text>
      <Text type="body-sm" className="flex-1">
        {content}
      </Text>
      {isCorrect ? <Ionicons name="checkmark-circle" size={18} color={success} /> : null}
      {isPicked && !isCorrect ? <Ionicons name="close-circle" size={18} color={danger} /> : null}
    </View>
  );
}

function Gap() {
  return <View className="h-3" />;
}
