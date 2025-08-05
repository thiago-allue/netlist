// src/hooks/useNetlists.js

// React Query v5 hooks for CRUD operations on netlists.
// ──────────────────────────────────────────────────────────
//  useNetlists()      – list   submissions  (GET /netlists)
//  useNetlist(id)     – single submission   (GET /netlists/:id)
//  useUploadNetlist() – upload mutation     (POST /netlists)
// ──────────────────────────────────────────────────────────

import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import api from '../api/client';

// ──────────────────────────────────────────────────────────
// 1) List – GET /api/netlists
// ──────────────────────────────────────────────────────────
export const useNetlists = () =>
  useQuery({
    queryKey: ['netlists'],

    // Axios GET that returns the response body.

    queryFn: async () => (await api.get('/netlists')).data,
  });

// ──────────────────────────────────────────────────────────
// 2) Detail – GET /api/netlists/:id
// ──────────────────────────────────────────────────────────
export const useNetlist = id =>
  useQuery({

    // Fetch only when id is defined to avoid 404s on mount.
    enabled: !!id,
    queryKey: ['netlists', id],
    queryFn: async () => (await api.get(`/netlists/${id}`)).data,
  });

// ──────────────────────────────────────────────────────────
// 3) Upload – POST /api/netlists
// ──────────────────────────────────────────────────────────
export const useUploadNetlist = () => {
  const qc = useQueryClient();

  return useMutation({

    // Decide headers: multipart/form-data vs JSON.
    mutationFn: async payload => {
      const cfg =
        payload instanceof FormData
          ? {} // Axios sets multipart headers automatically.
          : { headers: { 'Content-Type': 'application/json' } };

      // Return only the response body.
      return (await api.post('/netlists', payload, cfg)).data;
    },

    // Refresh cached list after success so UI updates immediately.
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['netlists'] });
    },
  });
};
