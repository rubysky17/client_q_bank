import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePosts } from '@/api/posts';
import { EmptyView, ErrorView, LoadingView, Spinner, useThemeColor } from '@/components/ui';

import { HomeHeader } from './home-header';
import { PostCard } from './post-card';

export function HomeScreen() {
  const { push } = useRouter();
  const insets = useSafeAreaInsets();
  const mutedColor = useThemeColor('muted');
  const {
    data: posts,
    error,
    isPending,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePosts();
  // Separate flag so background refetches don't show the pull-to-refresh spinner.
  const [isRefreshing, setIsRefreshing] = useState(false);

  // One callback for every row (rows call it with their id).
  const openPost = (id: number) => push({ pathname: '/posts/[id]', params: { id: String(id) } });

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
  if (!posts) return <ErrorView error={error} onRetry={refetch} />;

  return (
    <FlashList
      data={posts}
      keyExtractor={(post) => String(post.id)}
      renderItem={({ item, index }) => (
        <PostCard
          id={item.id}
          title={item.title}
          body={item.body}
          views={item.views}
          likes={item.reactions.likes}
          index={index}
          iconColor={mutedColor}
          onPress={openPost}
        />
      )}
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
