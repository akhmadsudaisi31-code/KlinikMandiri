import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook untuk polling yang otomatis berhenti saat tab tidak aktif (hidden).
 * Saat tab kembali aktif (visible), langsung fetch sekali, lalu polling lanjut.
 *
 * @param callback - Fungsi yang dipanggil setiap interval
 * @param intervalMs - Interval polling dalam milidetik
 * @param enabled - Apakah polling aktif (default: true)
 */
export function useVisiblePolling(
  callback: () => void,
  intervalMs: number,
  enabled: boolean = true
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const poll = useCallback(() => {
    if (document.visibilityState === 'hidden') return;
    callbackRef.current();
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(poll, intervalMs);

    // Fetch langsung saat tab kembali visible (setelah di-background)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        callbackRef.current();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [poll, intervalMs, enabled]);
}
