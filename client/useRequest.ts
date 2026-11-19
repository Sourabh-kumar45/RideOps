"use client";

/**
 * Small data-loading hook used by every screen.
 *
 * - Keeps the previous data while reloading, so screens dim instead of
 *   flashing a spinner.
 * - Ignores answers to older requests (e.g. when clicking tickets quickly).
 */
import { useCallback, useEffect, useRef, useState } from "react";

export interface RequestState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  /** Runs the request again. */
  reload: () => void;
}

/** Runs `load` on mount and again whenever any value in `deps` changes. */
export function useRequest<T>(load: () => Promise<T>, deps: readonly unknown[]): RequestState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);
  const latest = useRef(0);

  useEffect(() => {
    const id = ++latest.current;
    setLoading(true);
    load()
      .then((result) => {
        if (id !== latest.current) return;
        setData(result);
        setError(null);
      })
      .catch((err: unknown) => {
        if (id === latest.current) setError(err instanceof Error ? err.message : "Something went wrong.");
      })
      .finally(() => {
        if (id === latest.current) setLoading(false);
      });
    // `load` is deliberately not a dependency: callers list what it uses in `deps`,
    // so an inline arrow function does not trigger a request on every render.
  }, [...deps, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { data, error, loading, reload };
}
