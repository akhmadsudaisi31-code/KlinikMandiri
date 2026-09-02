import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { jwt } from 'hono/jwt'
import auth from './routes/auth'
import medical from './routes/medical'
import admin from './routes/admin'
import settings from './routes/settings'
import sks from './routes/sks'
import icd from './routes/icd'
import errorLogs from './routes/errorLogs'
import upload from './routes/upload'

type Bindings = {
  DB: D1Database
  JWT_SECRET: string
  RESEND_API_KEY: string
  LAB_RESULTS: R2Bucket
}

const app = new Hono<{ Bindings: Bindings }>()

// Helper to get JWT Secret
const getSecret = (env: Bindings) => {
  if (!env.JWT_SECRET) {
      throw new Error("CRITICAL: JWT_SECRET environment variable is missing. Set it in wrangler.toml or Cloudflare dashboard.");
  }
  return env.JWT_SECRET;
}

// 1. Better CORS (Restrict in Production)
app.use('*', async (c, next) => {
  const isProd = c.env.JWT_SECRET; // Simple heuristic for production vs local
  const origin = c.req.header('Origin');
  const allowedOrigins = [
      'https://satset-rm.pages.dev', 
      'https://klinikmandiri.pages.dev',
      'http://localhost:5173'
  ];

  const corsMiddleware = cors({
    origin: (origin) => {
        if (!isProd) return origin;
        if (!origin) return allowedOrigins[0];
        
        // Allow production domains
        if (allowedOrigins.includes(origin)) return origin;
        
        // Allow local network origins (for phone/tablet testing)
        if (origin.startsWith('http://192.168.') || origin.startsWith('http://10.')) {
            return origin;
        }
        
        return allowedOrigins[0];
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  });
  
  return corsMiddleware(c, next);
});

// 2. Global Error Masking
app.onError((err: any, c) => {
  console.error("Global Error Handler:", err);
  const errMsg = err?.message || String(err);
  
  // Deteksi khusus jika Cloudflare D1 Free Tier Limit terlampaui
  if (errMsg.includes("exceeded D1's free tier daily row read limit") || errMsg.includes("D1_ERROR")) {
    return c.json({
      error: "Batas akses database harian Cloudflare telah tercapai. Kuota akan di-reset otomatis pada 07:00 WIB (00:00 UTC).",
      isD1Limit: true,
      message: errMsg,
      status: 429
    }, 429);
  }

  const status = err.status || 500;
  return c.json({ 
      error: err.message || 'Terjadi kesalahan pada server.',
      message: err.message,
      stack: c.env.JWT_SECRET ? undefined : err.stack,
      status
  }, status);
});

// 3. Health Check
app.get('/', (c) => c.text('KlinikMandiri API is running'))

// --- PROTECTED ROUTES MIDDLEWARE ---

// 1. JWT Verification
app.use('/api/*', async (c, next) => {
  const path = c.req.path
  if (path.includes('/auth/login') || path.includes('/auth/register') || path.includes('/auth/reset-password')
    || (path.includes('/errors') && c.req.method === 'POST')
    || (path.includes('/upload/lab-result/') && c.req.method === 'GET')) { 
    return next()
  }
  
  const secret = c.env.JWT_SECRET;
  if (!secret) {
      throw new Error("JWT_SECRET environment variable is missing. Authentication cannot function.");
  }

  const handler = jwt({
    secret,
    alg: 'HS256'
  })
  
  return handler(c, next)
})

// 3. Demo Sandboxing Middleware (Prevent writes for demo users)
app.use('/api/*', async (c, next) => {
  const method = c.req.method
  const payload: any = c.get('jwtPayload')
  
  if (['POST', 'PUT', 'DELETE'].includes(method) && payload?.uid?.startsWith('demo-')) {
    console.log(`[DEMO] Simulating ${method} request for user ${payload.uid}`);
    return c.json({ 
      success: true, 
      message: 'Mode Demo: Perubahan disimulasikan dan tidak disimpan ke server agar akun demo tetap bersih.',
      isDemo: true 
    }, 200)
  }
  return next()
})

// 2. Clinic Status & Admin Check
app.use('/api/*', async (c, next) => {
  const path = c.req.path
  if (path.includes('/auth/login') || path.includes('/auth/register') || path.includes('/auth/me') || path.includes('/auth/renew') || path.includes('/auth/reset-password') || path.includes('/auth/refresh-token')
    || (path.includes('/upload/lab-result/') && c.req.method === 'GET')) {
    return next()
  }

  const payload: any = c.get('jwtPayload')
  if (!payload) return next(); // Should be caught by JWT middleware but just in case
  
  if (payload.isAdmin !== 1) {
    // Cek status dari JWT payload secara instan (tanpa DB Query)
    if (payload.status !== 'active') {
        return c.json({ error: 'Akun Anda belum aktif atau telah ditangguhkan.', status: payload.status || 'inactive' }, 403)
    }
    
    if (payload.validUntil && new Date(payload.validUntil).getTime() < Date.now()) {
        return c.json({ error: 'Masa aktif langganan habis.', status: 'expired', validUntil: payload.validUntil }, 403)
    }
  }
  
  return next()
})

// --- MOUNT ROUTERS ---
app.route('/api/auth', auth)
app.route('/api', medical)
app.route('/api', settings)
app.route('/api/admin', admin)
app.route('/api/sks', sks)
app.route('/api/icd', icd)
app.route('/api/upload', upload)
app.route('/api', errorLogs)

// Global Broadcast GET for clinic users
app.get('/api/broadcast', async (c) => {
    try {
        const lastBroadcast = await c.env.DB.prepare('SELECT message FROM broadcasts ORDER BY createdAt DESC LIMIT 1').first();
        return c.json(lastBroadcast || { message: null });
    } catch (e) {
        return c.json({ message: null });
    }
});

export default app
