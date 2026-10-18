import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCatalog } from '@/api/catalog';
import { useReportExams } from '@/api/reports';
import { EmptyView, ErrorView, Spinner, toneFor, useThemeColor } from '@/components/ui';

import { ContinueCards } from './continue-cards';
import { ExamCard } from './exam-card';
import { HomeHeader } from './home-header';
import { HomeSkeleton } from './home-skeleton';

export function HomeScreen() {
  const { t } = useTranslation();
  const { push } = useRouter();
  const insets = useSafeAreaInsets();
  const mutedColor = useThemeColor('muted');
  const {
    data: exams,
    error,
    isPending,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCatalog();
  const { data: reportExams } = useReportExams();
  const avgByExam = new Map(reportExams?.map((r) => [r.examId, r.avgCorrectPercent]));
  // Separate flag so background refetches don't show the pull-to-refresh spinner.
  const [isRefreshing, setIsRefreshing] = useState(false);

  // One callback for every row (rows call it with their id).
  const openExam = (id: string) => push({ pathname: '/exams/[id]', params: { id } });

  const refresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  };

  if (isPending) return <HomeSkeleton />;
  if (!exams) {
    // Offline: the exam list can't load, but unfinished attempts on the device can be continued.
    return (
      <View className="flex-1" style={{ paddingTop: insets.top + 12 }}>
        <View className="px-4">
          <ContinueCards />
        </View>
        <ErrorView error={error} onRetry={refetch} />
      </View>
    );
  }

  return (
    <FlashList
      data={exams}
      keyExtractor={(exam) => exam.id}
      extraData={reportExams}
      renderItem={({ item, index }) => {
        const avgPercent = avgByExam.get(item.id) ?? null;
        return (
          <ExamCard
            id={item.id}
            title={item.title}
            topic={item.topic.name}
            tone={toneFor(item.topic.id)}
            avgPercent={avgPercent}
            avgLabel={avgPercent === null ? t('home.notTaken') : t('home.avgCorrect')}
            isBelowPass={
              avgPercent !== null && item.passingScore !== null && avgPercent < item.passingScore
            }
            questionsLabel={t('home.questions', { count: item.questionCount })}
            durationLabel={
              item.durationMinutes === null
                ? t('home.untimed')
                : t('home.minutes', { count: item.durationMinutes })
            }
            passLabel={
              item.passingScore === null ? null : t('home.passMark', { percent: item.passingScore })
            }
            index={index}
            iconColor={mutedColor}
            onPress={openExam}
          />
        );
      }}
      ItemSeparatorComponent={Gap}
      ListHeaderComponent={HomeHeader}
      ListEmptyComponent={EmptyView}
      ListFooterComponent={isFetchingNextPage ? <Spinner className="my-6 self-center" /> : null}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      refreshing={isRefreshing}
      onRefresh={refresh}
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingHorizontal: 16,
        paddingBottom: 24,
      }}
    />
  );
}

function Gap() {
  return <View className="h-3" />;
}
