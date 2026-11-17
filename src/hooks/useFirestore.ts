/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/hooks/useFirestore.ts
 * Purpose: Generic async data fetching hook with loading, error, and refresh support,
 *          plus optional fallback sample data when a Firestore collection has not been seeded yet.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseFirestoreResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  usingFallback: boolean;
  refetch: () => Promise<void>;
}

export function useFirestore<T>(
  fetcher: () => Promise<T[]>,
  fallbackItems: T[] = [],
  enabled = true
): UseFirestoreResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  // Keep the latest fetcher/fallback in refs. Pages pass inline arrow functions
  // (e.g. useFirestore(() => getPackages(30), samplePackages)), which are new on every
  // render. Putting them in the useCallback deps caused an infinite refetch loop,
  // leaving the UI stuck on the loading spinner.
  const fetcherRef = useRef(fetcher);
  const fallbackRef = useRef(fallbackItems);
  fetcherRef.current = fetcher;
  fallbackRef.current = fallbackItems;

  const refetch = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current();
      const fallbackItems = fallbackRef.current;
      if (result.length === 0 && fallbackItems.length > 0) {
        setData(fallbackItems);
        setUsingFallback(true);
      } else {
        setData(result);
        setUsingFallback(false);
      }
    } catch (err) {
      const fallbackItems = fallbackRef.current;
      // If a public page hasn't been seeded yet or hits offline state, still display fallback if provided
      if (fallbackItems.length > 0) {
        setData(fallbackItems);
        setUsingFallback(true);
      } else {
        setError(err instanceof Error ? err.message : 'Unable to load data.');
      }
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, usingFallback, refetch };
}
