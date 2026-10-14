/**
 * Every query key lives here so invalidation is typo-proof:
 * `queryClient.invalidateQueries({ queryKey: queryKeys.posts.all })`.
 */
export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  posts: {
    all: ['posts'] as const,
    list: () => [...queryKeys.posts.all, 'list'] as const,
    detail: (id: number) => [...queryKeys.posts.all, 'detail', id] as const,
  },
};
