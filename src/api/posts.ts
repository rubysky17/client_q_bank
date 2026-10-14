import {
  infiniteQueryOptions,
  queryOptions,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { z } from 'zod';

import { api } from './client';
import { queryKeys } from './query-keys';

export const PostSchema = z.object({
  id: z.number(),
  title: z.string(),
  body: z.string(),
  tags: z.array(z.string()),
  reactions: z.object({ likes: z.number(), dislikes: z.number() }),
  views: z.number(),
  userId: z.number(),
});
export type Post = z.infer<typeof PostSchema>;

const PostsPageSchema = z.object({
  posts: z.array(PostSchema),
  total: z.number(),
  skip: z.number(),
  limit: z.number(),
});

const PAGE_SIZE = 20;

export const postsQueryOptions = infiniteQueryOptions({
  queryKey: queryKeys.posts.list(),
  queryFn: ({ pageParam, signal }) =>
    api
      .get('posts', { searchParams: { limit: PAGE_SIZE, skip: pageParam }, signal })
      .json(PostsPageSchema),
  initialPageParam: 0,
  getNextPageParam: ({ skip, limit, total }) => (skip + limit < total ? skip + limit : undefined),
});

export function usePosts() {
  return useInfiniteQuery({
    ...postsQueryOptions,
    // Flatten pages once here; TanStack keeps item references stable between renders.
    select: (data) => data.pages.flatMap((page) => page.posts),
  });
}

export const postQueryOptions = (id: number) =>
  queryOptions({
    queryKey: queryKeys.posts.detail(id),
    queryFn: ({ signal }) => api.get(`posts/${id}`, { signal }).json(PostSchema),
  });

export function usePost(id: number) {
  const queryClient = useQueryClient();

  return useQuery({
    ...postQueryOptions(id),
    // Show the post from the list cache instantly while the detail request runs.
    placeholderData: () =>
      queryClient
        .getQueryData(postsQueryOptions.queryKey)
        ?.pages.flatMap((page) => page.posts)
        .find((post) => post.id === id),
  });
}
