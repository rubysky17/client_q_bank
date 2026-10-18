import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { type CatalogExamDetail, useCatalogExam, useStartAttempt } from '@/api/catalog';
import { describeError } from '@/api/errors';
import { Button, Card, Chip, ErrorView, LoadingView, Spinner, Text } from '@/components/ui';

type ExamDetailScreenProps = {
  id: string;
};

export function ExamDetailScreen({ id }: ExamDetailScreenProps) {
  const { t } = useTranslation();
  const { push } = useRouter();
  const insets = useSafeAreaInsets();
  const { data: exam, error, isPending, refetch } = useCatalogExam(id);
  const { mutate: start, isPending: isStarting, error: startError } = useStartAttempt(id);

  if (isPending) return <LoadingView />;
  if (!exam) return <ErrorView error={error} onRetry={refetch} />;

  const openAttempt = (attemptId: string) =>
    push({ pathname: '/attempts/[id]', params: { id: attemptId } });

  const onStart = () => {
    if (exam.inProgressAttemptId) {
      openAttempt(exam.inProgressAttemptId);
      return;
    }
    start(undefined, { onSuccess: (attempt) => openAttempt(attempt.id) });
  };

  return (
    <View className="flex-1">
      <FlashList
        data={exam.sections}
        keyExtractor={(section) => section.id}
        renderItem={({ item }) => (
          <SectionRow
            order={item.order}
            title={item.title}
            instructions={item.instructions}
            questionsLabel={t('exam.sectionQuestions', { count: item.questionCount })}
          />
        )}
        ItemSeparatorComponent={Gap}
        ListHeaderComponent={<ExamSummary exam={exam} />}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 16 }}
      />
      <View
        className="gap-2 border-t border-separator bg-background px-4 pt-3"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        {startError ? (
          <Text type="body-sm" className="text-danger">
            {describeError(startError, t)}
          </Text>
        ) : null}
        <Button onPress={onStart} isDisabled={isStarting}>
          {isStarting ? <Spinner size="sm" /> : null}
          <Button.Label>
            {exam.inProgressAttemptId ? t('exam.resume') : t('exam.start')}
          </Button.Label>
        </Button>
      </View>
    </View>
  );
}

function ExamSummary({ exam }: { exam: CatalogExamDetail }) {
  const { t } = useTranslation();

  return (
    <View className="gap-4 pb-4">
      <View className="flex-row">
        <Chip size="sm" variant="soft" color="accent">
          <Chip.Label>{exam.topic.name}</Chip.Label>
        </Chip>
      </View>
      <View className="gap-1">
        <Text type="h3">{exam.title}</Text>
        <Text type="body-sm" color="muted">
          {t('exam.by', { name: exam.owner.fullName })}
        </Text>
      </View>
      {exam.description ? <Text className="leading-6">{exam.description}</Text> : null}

      <Card className="flex-row flex-wrap gap-y-3">
        <Fact label={t('exam.questions')} value={String(exam.questionCount)} />
        <Fact
          label={t('exam.duration')}
          value={
            exam.durationMinutes === null
              ? t('home.untimed')
              : t('home.minutes', { count: exam.durationMinutes })
          }
        />
        <Fact
          label={t('exam.passMark')}
          value={exam.passingScore === null ? t('exam.noPassMark') : `${exam.passingScore}%`}
        />
        <Fact label={t('exam.totalPoints')} value={String(exam.totalPoints)} />
      </Card>

      {exam.myAttemptCount > 0 ? (
        <Text type="body-sm" color="muted">
          {t('exam.myAttempts', { count: exam.myAttemptCount })}
        </Text>
      ) : null}

      <Text type="body-sm" weight="medium" color="muted">
        {t('exam.structure')}
      </Text>
    </View>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View className="w-1/2 gap-0.5">
      <Text type="body-xs" color="muted">
        {label}
      </Text>
      <Text weight="semibold">{value}</Text>
    </View>
  );
}

type SectionRowProps = {
  order: number;
  title: string;
  instructions: string | null;
  questionsLabel: string;
};

function SectionRow({ order, title, instructions, questionsLabel }: SectionRowProps) {
  return (
    <Card className="flex-row items-center gap-3">
      <View className="size-9 items-center justify-center rounded-full bg-accent-soft">
        <Text weight="semibold" className="text-accent-soft-foreground">
          {order}
        </Text>
      </View>
      <View className="flex-1 gap-0.5">
        <Text weight="semibold">{title}</Text>
        {instructions ? (
          <Text type="body-sm" color="muted" numberOfLines={2}>
            {instructions}
          </Text>
        ) : null}
      </View>
      <Text type="body-sm" color="muted">
        {questionsLabel}
      </Text>
    </Card>
  );
}

function Gap() {
  return <View className="h-3" />;
}
