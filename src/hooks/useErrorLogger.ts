import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = 'https://my-cloudflare-backend.praktek-mandiri.workers.dev/api/errors';
const BUILD_VERSION = import.meta.env.VITE_BUILD_VERSION || 'unknown';

// Rate limiting: cegah spam ke D1 saat terjadi error massal
// (misal: saat D1 limit kena sendiri, jangan tambah beban dengan kirim log error)
const errorTimestamps: Record<string, number> = {}; // per error-key: kapan terakhir kirim
const recentReports: number[] = []; // timestamps semua report dalam 5 menit terakhir
const PER_KEY_QUIET_MS = 30_000;   // 30 detik per error type
const GLOBAL_MAX_PER_5MIN = 10;    // max 10 report dalam 5 menit
const GLOBAL_WINDOW_MS = 5 * 60_000;

function isRateLimited(key: string): boolean {
  const now = Date.now();

  // Cek per-key cooldown
  if (now - (errorTimestamps[key] || 0) < PER_KEY_QUIET_MS) return true;

  // Cek global window limit
  const windowStart = now - GLOBAL_WINDOW_MS;
  const recentCount = recentReports.filter(t => t > windowStart).length;
  if (recentCount >= GLOBAL_MAX_PER_5MIN) return true;

  return false;
}

function markSent(key: string): void {
  const now = Date.now();
  errorTimestamps[key] = now;
  recentReports.push(now);
  // Bersihkan timestamps lama agar array tidak membengkak
  const cutoff = now - GLOBAL_WINDOW_MS;
  while (recentReports.length > 0 && recentReports[0] < cutoff) {
    recentReports.shift();
  }
}

/**
 * Hook yang menangkap semua error JavaScript yang tidak tertangani (unhandled)
 * dan mengirimkannya ke backend Cloudflare D1 untuk dicatat sebagai log.
 *
 * Gunakan di komponen root atau App.tsx.
 * Dilengkapi rate limiting: maks 1 kirim per 30 detik per error type,
 * dan maks 10 kiriman dalam 5 menit secara global.
 */
export function useErrorLogger() {
  const { user } = useAuth();

  useEffect(() => {
    const sendError = async (payload: Record<string, any>) => {
      try {
        await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clinicId: user?.uid || 'unauthenticated',
            userId: user?.uid || null,
            userEmail: user?.email || null,
            url: window.location.href,
            buildVersion: BUILD_VERSION,
            userAgent: navigator.userAgent,
            ...payload,
          }),
          keepalive: true, // Pastikan terkirim walau tab ditutup
        });
      } catch {
        // Jangan throw error baru dari error logger
      }
    };

    // Handler untuk uncaught JS errors
    const onError = (event: ErrorEvent) => {
      const key = `js:${event.message}`;
      if (isRateLimited(key)) return;
      markSent(key);
      sendError({
        errorMessage: event.message,
        errorStack: event.error?.stack || '',
      });
    };

    // Handler untuk unhandled promise rejections
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const err = event.reason;
      const key = `promise:${err?.message || String(err)}`;
      if (isRateLimited(key)) return;
      markSent(key);
      sendError({
        errorMessage: err?.message || String(err),
        errorStack: err?.stack || '',
      });
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, [user]);
}

/**
 * Kirim error manual ke Cloudflare logger.
 * Gunakan di catch block yang ingin dilaporkan.
 * Sudah dilengkapi rate limiting: maks 1 kirim per 30 detik per error type,
 * dan maks 10 kiriman dalam 5 menit secara global.
 */
export async function reportError(
  error: unknown,
  context?: { clinicId?: string; userId?: string; userEmail?: string; metadata?: any }
): Promise<void> {
  const err = error instanceof Error ? error : new Error(String(error));
  const key = `manual:${err.message}`;

  if (isRateLimited(key)) return;
  markSent(key);

  try {
    const payload = {
        clinicId: context?.clinicId || 'manual',
        userId: context?.userId || null,
        userEmail: context?.userEmail || null,
        url: window.location.href,
        errorMessage: err.message,
        errorStack: err.stack || '',
        metadata: context?.metadata ? (typeof context.metadata === 'string' ? context.metadata : JSON.stringify(context.metadata)) : null,
        buildVersion: BUILD_VERSION,
        userAgent: navigator.userAgent,
    };
    
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch (e) {
    // Avoid recursion if logger fails
    console.error('Logger failed:', e);
  }
}
