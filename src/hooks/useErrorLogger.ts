import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = 'https://my-cloudflare-backend.praktek-mandiri.workers.dev/api/errors';
const BUILD_VERSION = import.meta.env.VITE_BUILD_VERSION || 'unknown';

/**
 * Hook yang menangkap semua error JavaScript yang tidak tertangani (unhandled)
 * dan mengirimkannya ke backend Cloudflare D1 untuk dicatat sebagai log.
 *
 * Gunakan di komponen root atau App.tsx.
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
      sendError({
        errorMessage: event.message,
        errorStack: event.error?.stack || '',
      });
    };

    // Handler untuk unhandled promise rejections
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const err = event.reason;
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
 */
export async function reportError(
  error: unknown,
  context?: { clinicId?: string; userId?: string; userEmail?: string; metadata?: any }
): Promise<void> {
  const err = error instanceof Error ? error : new Error(String(error));
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
    
    // Use navigator.sendBeacon if it's a critical exit, but here fetch is fine
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch (e) {
    // Avoid recursion if logger fails
    console.error("Logger failed:", e);
  }
}
