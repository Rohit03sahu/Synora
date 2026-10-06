'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api-client';

export function useApiData<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(path !== null);

  useEffect(() => {
    let active = true;
    if (!path) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    apiGet<T>(path)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((reason: unknown) => {
        if (active) {
          const message = reason instanceof Error ? reason.message : 'Could not load data.';
          setError(message);
          console.error(`API request failed for ${path}.`, reason);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [path]);

  return { data, error, loading };
}
