import { useState, useEffect, useRef } from 'react';
import { useLoadingState } from './useLoadingState';

const cache = new Map();

export const useFetchData = <T,>(
  url: string
): [T | null, boolean, Error | null] => {
  const [data, setData] = useState<T | null>(null)
  const cacheRef = useRef(cache)
  const { isLoading: loading, setIsLoading } = useLoadingState(150)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!url) {
      setIsLoading(false);
      return;
    }

    if (cacheRef.current.has(url)) {
      setData(cacheRef.current.get(url));
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const response = await fetch(url);
        const result = await response.json();
        cacheRef.current.set(url, result);
        setData(result);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return [data, loading, error];
};
