"use client";

import { useCallback, useRef, useState } from "react";
import {
  apiFetchWithProgress,
  extractErrorMessage,
  type DownloadProgress,
  type ProgressInit,
} from "./api";

export interface ApiProgressState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  /** 0–100, or null while the size is unknown. */
  percent: number | null;
  loaded: number;
  total: number | null;
  indeterminate: boolean;
}

const IDLE = {
  data: null,
  error: null,
  loading: false,
  percent: null,
  loaded: 0,
  total: null,
  indeterminate: false,
} as const;

/**
 * Runs an API request while tracking download progress.
 *
 * Two behaviours worth knowing:
 *
 * - When the server sends no `Content-Length` (compressed or chunked responses,
 *   which is most JSON endpoints), `percent` stays null and `indeterminate` is
 *   true. Render a spinner or an indeterminate bar in that case — do not
 *   fabricate a number.
 * - Overlapping calls are handled: only the most recent request may write to
 *   state, so a slow earlier response cannot overwrite a newer one.
 */
export function useApiProgress<T = unknown>() {
  const [state, setState] = useState<ApiProgressState<T>>({ ...IDLE });
  const requestId = useRef(0);

  const run = useCallback(
    async (path: string, init: Omit<ProgressInit, "onProgress"> = {}): Promise<T | null> => {
      const id = ++requestId.current;
      const isCurrent = () => id === requestId.current;

      setState({ ...IDLE, loading: true, indeterminate: true });

      try {
        const res = await apiFetchWithProgress(path, {
          ...init,
          onProgress: (p: DownloadProgress) => {
            if (!isCurrent()) return;
            setState((prev) => ({
              ...prev,
              percent: p.percent,
              loaded: p.loaded,
              total: p.total,
              indeterminate: p.indeterminate,
            }));
          },
        });

        const body: unknown = await res.json().catch(() => ({}));
        if (!isCurrent()) return null;

        if (!res.ok) {
          const message = extractErrorMessage(body, `Request failed (${res.status})`);
          setState({ ...IDLE, error: message });
          return null;
        }

        setState({
          ...IDLE,
          data: body as T,
          percent: 100,
          loaded: 0,
          total: null,
        });
        return body as T;
      } catch (err) {
        if (!isCurrent()) return null;
        setState({
          ...IDLE,
          error: err instanceof Error ? err.message : "Network error",
        });
        return null;
      }
    },
    [],
  );

  const reset = useCallback(() => {
    requestId.current++;
    setState({ ...IDLE });
  }, []);

  return { ...state, run, reset };
}

/** Human-readable byte count for progress labels. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
