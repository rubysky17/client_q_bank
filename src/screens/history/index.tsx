import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import type { TFunction } from 'i18next';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { type AttemptListItem, type AttemptStatus, useAttempts } from '@/api/attempts';
import {
  EmptyView,
  ErrorView,
  LoadingView,
  FilterPill,
  Spinner,
  Text,
  toneFor,
} from '@/components/ui';

import { AttemptRow, type RowOutcome } from './attempt-row';
import { HISTORY_FILTERS, type HistoryFilter, historyRows } from './rows';

function statusLabel(attempt: AttemptListItem, outcome: RowOutcome, t: TFunction) {
  switch (outcome) {
    case 'passed':
      return t('history.passed');
    case 'failed':
      return t('history.failed');
    default:
      return t(`status.${attempt.status}`);
  }
}

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
  const [filter, setFilter] = useState<HistoryFilter>('all');
  // "This week" is measured from when the screen opened.
  const [now] = useState(() => Date.now());

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
      data={historyRows(attempts, filter, now)}
      keyExtractor={(row) => row.key}
      getItemType={(row) => row.kind}
      renderItem={({ item }) =>
        item.kind === 'heading' ? (
          <Text type="body-xs" weight="semibold" color="muted" className="pt-2 pb-2 uppercase">
            {t(`history.${item.group}`)}
          </Text>
        ) : (
          <View className="pb-3">
            <AttemptRow
              id={item.attempt.id}
              title={item.attempt.examTitle}
              tone={toneFor(item.attempt.examId)}
              status={item.attempt.status}
              outcome={item.outcome}
              statusLabel={statusLabel(item.attempt, item.outcome, t)}
              dateLabel={dateFormat.format(new Date(item.attempt.startedAt))}
              scoreLabel={
                item.outcome === 'progress' || item.attempt.status === 'ABANDONED'
                  ? t('history.progress', {
                      answered: item.attempt.answeredCount,
                      total: item.attempt.totalQuestions,
                    })
                  : item.attempt.score === null
                    ? null
                    : t('history.score', {
                        score: item.attempt.score,
                        max: item.attempt.maxScore,
                      })
              }
              percent={item.attempt.percent}
              progress={
                item.attempt.totalQuestions > 0
                  ? Math.round((item.attempt.answeredCount / item.attempt.totalQuestions) * 100)
                  : 0
              }
              onPress={open}
            />
          </View>
        )
      }
      ListHeaderComponent={
        <View className="gap-4 pb-3">
          <Text type="h2">{t('history.title')}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2"
          >
            {HISTORY_FILTERS.map((value) => (
              <FilterPill
                key={value}
                label={t(`history.filter.${value}`)}
                isSelected={value === filter}
                onPress={() => setFilter(value)}
              />
            ))}
          </ScrollView>
        </View>
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
