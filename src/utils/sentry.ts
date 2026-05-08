import * as Sentry from '@sentry/react';

/**
 * Inisialisasi Sentry Error Monitoring.
 * Hanya aktif di production build.
 * DSN bisa dikonfigurasi lewat env var VITE_SENTRY_DSN.
 *
 * Cara mendapatkan DSN:
 * 1. Daftar di https://sentry.io/signup/ (gratis)
 * 2. Buat project React
 * 3. Salin DSN dan set di .env: VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;

  if (!dsn) {
    // Sentry tidak aktif jika DSN belum dikonfigurasi
    if (import.meta.env.DEV) {
      console.info('[Sentry] DSN belum dikonfigurasi. Set VITE_SENTRY_DSN di .env untuk mengaktifkan.');
    }
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE, // "development" | "production"
    enabled: import.meta.env.PROD,     // Hanya aktif di production build
    tracesSampleRate: 0.1,             // Capture 10% traces untuk performance monitoring
    
    // Session Replay - rekam sesi saat error terjadi
    replaysOnErrorSampleRate: 1.0,     // Selalu rekam saat ada error
    replaysSessionSampleRate: 0.0,     // Tidak rekam sesi normal (hemat kuota)
    
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,    // Sembunyikan semua teks (lindungi data pasien)
        blockAllMedia: true,  // Blokir gambar/media dari rekaman
        maskAllInputs: true,  // Sembunyikan semua input form
      }),
    ],

    // Filter error yang tidak penting
    beforeSend(event) {
      // Abaikan error koneksi jaringan biasa
      if (event.exception?.values?.[0]?.value?.includes('Failed to fetch')) {
        return null;
      }
      // Abaikan error unauthorized (sudah ditangani di api.ts)
      if (event.exception?.values?.[0]?.value === 'Unauthorized') {
        return null;
      }
      return event;
    },
  });
}

/**
 * Set user context di Sentry.
 * Panggil setelah login berhasil.
 * Jangan masukkan data identitas pasien.
 */
export function setSentryUser(user: { uid: string; email: string; name: string; clinicType?: string }) {
  Sentry.setUser({
    id: user.uid,
    email: user.email,
    username: user.name,
  });
  Sentry.setTag('clinic_type', user.clinicType || 'unknown');
}

/**
 * Hapus user context di Sentry.
 * Panggil saat logout.
 */
export function clearSentryUser() {
  Sentry.setUser(null);
}

/**
 * Capture error manual ke Sentry.
 * Gunakan untuk error yang sudah ditangani tapi masih perlu dilaporkan.
 */
export function captureSentryError(error: unknown, context?: Record<string, string>) {
  if (context) {
    Sentry.setContext('extra', context);
  }
  Sentry.captureException(error);
}
