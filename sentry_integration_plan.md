# Rencana Integrasi Sentry — KlinikMandiri

## Apa itu Sentry?
Sentry adalah platform *error monitoring* yang mencatat error secara otomatis dari browser client dan mengirimkan laporan detail (stack trace, user info, breadcrumbs) ke dashboard Anda. **Gratis untuk 1 project, 5.000 error/bulan.**

---

## Paket Gratis Sentry
| Fitur | Free Tier |
|-------|-----------|
| Error volume | 5.000 event/bulan |
| Projects | 1 |
| Team members | Unlimited |
| Retention | 30 hari |
| Alerts (email) | ✅ |
| Stack traces | ✅ |
| Source maps | ✅ |

Untuk skala klinik, 5.000 error/bulan **lebih dari cukup** (biasanya < 100 error real per bulan pada app sehat).

---

## Langkah Implementasi

### Step 1 — Daftar Akun Sentry (Gratis)
1. Buka [https://sentry.io/signup/](https://sentry.io/signup/)
2. Daftar dengan email (bisa pakai GitHub)
3. Pilih platform: **React**
4. Salin **DSN** yang diberikan (format: `https://xxxx@xxx.ingest.sentry.io/xxxx`)

### Step 2 — Install SDK
```bash
cd /home/naya/Documents/DevApp/KlinikMandiri
npm install @sentry/react
```

### Step 3 — Inisialisasi Sentry di `src/main.tsx`
```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN_HERE",       // Dari Step 1
  environment: import.meta.env.MODE, // "development" | "production"
  enabled: import.meta.env.PROD,     // Hanya aktif di production
  tracesSampleRate: 0.1,             // Capture 10% traces untuk performance
  replaysOnErrorSampleRate: 0.5,     // Replay 50% saat error
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: true,   // Lindungi data sensitif pasien
      blockAllMedia: true,
    }),
  ],
});
```

### Step 4 — Wrap Router dengan Error Boundary di `src/main.tsx`
```typescript
import { BrowserRouter } from "react-router-dom";
import * as Sentry from "@sentry/react";

const SentryRoutes = Sentry.withSentryReactRouterV6Routing(Routes);

// Di JSX:
<BrowserRouter>
  <Sentry.ErrorBoundary fallback={<p>Terjadi kesalahan. Tim sedang dihubungi.</p>}>
    <SentryRoutes>
      {/* routes... */}
    </SentryRoutes>
  </Sentry.ErrorBoundary>
</BrowserRouter>
```

### Step 5 — Tag User untuk Identifikasi Laporan (opsional)
Di `src/context/AuthContext.tsx`, setelah login berhasil:
```typescript
import * as Sentry from "@sentry/react";

// Setelah set user state:
Sentry.setUser({
  id: user.uid,
  email: user.email,
  username: user.name,
  // Jangan masukkan data sensitif pasien
});

// Saat logout:
Sentry.setUser(null);
```

### Step 6 — Source Maps untuk Stack Trace yang Readable
Tambahkan plugin Sentry Vite di `vite.config.ts`:
```bash
npm install @sentry/vite-plugin --save-dev
```
```typescript
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig({
  plugins: [
    react(),
    sentryVitePlugin({
      org: "YOUR_SENTRY_ORG",
      project: "klinikmandiri",
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
  build: { sourcemap: true }, // Wajib untuk source maps
});
```

---

## File yang Diubah

| File | Perubahan |
|------|-----------|
| `package.json` | Tambah `@sentry/react` |
| `src/main.tsx` | `Sentry.init()` + `ErrorBoundary` |
| `src/context/AuthContext.tsx` | `Sentry.setUser()` |
| `vite.config.ts` | `sentryVitePlugin` (opsional, untuk source maps) |

---

## Dashboard Sentry
Setelah error pertama masuk, di dashboard Sentry Anda akan melihat:
- **Stack trace** lengkap (baris kode mana yang error)
- **Breadcrumbs** (klik/aksi apa yang dilakukan user sebelum error)
- **User info** (klinik mana yang mengalami error)
- **Alert email** otomatis saat error baru muncul

---

## Catatan Keamanan (PENTING untuk Aplikasi Medis)
> ⚠️ Jangan masukkan data pasien (nama, NIK, diagnosa) ke Sentry event.  
> Aktifkan `maskAllText: true` di replay integration.  
> Gunakan `beforeSend` hook untuk menyaring sensitive fields jika perlu.
