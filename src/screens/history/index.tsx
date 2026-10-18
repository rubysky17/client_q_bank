import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { type AttemptStatus, useAttempts } from '@/api/attempts';
import { EmptyView, ErrorView, LoadingView, Spinner, Text } from '@/components/ui';

import { AttemptRow } from './attempt-row';

export function HistoryScreen() {
  const { t, i18n } = useTranslation();
  const { push } = useRouter();
  const insets = useSafeAreaInsets();
  const {
    data: attempts,
    error,
    isPending,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAttempts();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Unfinished attempts reopen the test screen; closed ones show their result.
  const open = (id: string, status: AttemptStatus) =>
    push(
      status === 'IN_PROGRESS'
        ? { pathname: '/attempts/[id]', params: { id } }
        : { pathname: '/attempts/[id]/result', params: { id } },
    );

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

  if (isPending) return <LoadingView />;
  if (!attempts) return <ErrorView error={error} onRetry={refetch} />;

  const dateFormat = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <FlashList
      data={attempts}
      keyExtractor={(attempt) => attempt.id}
      renderItem={({ item }) => (
        <AttemptRow
          id={item.id}
          title={item.examTitle}
          status={item.status}
          statusLabel={t(`status.${item.status}`)}
          dateLabel={dateFormat.format(new Date(item.startedAt))}
          scoreLabel={
            item.status === 'ABANDONED'
              ? t('history.progress', { answered: item.answeredCount, total: item.totalQuestions })
              : item.score === null
                ? null
                : t('history.score', { score: item.score, max: item.maxScore })
          }
          percent={item.percent}
          passed={item.passed}
          onPress={open}
        />
      )}
      ItemSeparatorComponent={Gap}
      ListHeaderComponent={
        <Text type="h3" className="pb-4">
          {t('history.title')}
        </Text>
      }
      ListEmptyComponent={<EmptyView message={t('history.empty')} />}
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
