import type {
  CollectionWithCount,
  CreateCollectionInput,
  Share,
  UpdateCollectionInput,
} from '@bookmarkvault/shared';
import { notFound } from '@evolonix/react-router-next';
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { api, ApiError } from '~/lib/api-client';

const keys = {
  all: ['collections'] as const,
  detail: (id: string) => ['collections', id] as const,
  shares: (id: string) => ['collections', id, 'shares'] as const,
};

/** All of the signed-in user's collections (suspends). */
export function useCollections() {
  return useSuspenseQuery({
    queryKey: keys.all,
    queryFn: () => api.get<CollectionWithCount[]>('/api/collections'),
  });
}

/** A single collection by id (suspends). A 404 routes to `not-found.tsx`. */
export function useCollection(id: string) {
  return useSuspenseQuery({
    queryKey: keys.detail(id),
    queryFn: async () => {
      try {
        return await api.get<CollectionWithCount>(`/api/collections/${id}`);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) notFound();
        throw error;
      }
    },
  });
}

export function useCreateCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCollectionInput) =>
      api.post<CollectionWithCount>('/api/collections', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
}

export function useUpdateCollection(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateCollectionInput) =>
      api.patch<CollectionWithCount>(`/api/collections/${id}`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all });
      qc.invalidateQueries({ queryKey: keys.detail(id) });
    },
  });
}

export function useDeleteCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/api/collections/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
}

export function useCollectionShares(id: string) {
  return useSuspenseQuery({
    queryKey: keys.shares(id),
    queryFn: () => api.get<Share[]>(`/api/collections/${id}/shares`),
  });
}

export function useCreateShare(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<Share>(`/api/collections/${id}/shares`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.shares(id) });
      qc.invalidateQueries({ queryKey: keys.detail(id) });
    },
  });
}

export function useDeleteShare(collectionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => api.delete<void>(`/api/shares/${token}`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: keys.shares(collectionId) }),
  });
}
