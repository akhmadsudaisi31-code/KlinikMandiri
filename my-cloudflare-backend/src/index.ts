import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { jwt } from 'hono/jwt'
import auth from './routes/auth'
import medical from './routes/medical'
import admin from './routes/admin'
import settings from './routes/settings'
import sks from './routes/sks'
import icd from './routes/icd'

type Bindings = {
  DB: D1Database
  JWT_SECRET: string
  RESEND_API_KEY: string
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
  if (path === '/api/auth/login' || path === '/api/auth/register' || path === '/api/auth/reset-password') {
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

// 2. Clinic Status & Admin Check
app.use('/api/*', async (c, next) => {
  const path = c.req.path
  if (path === '/api/auth/login' || path === '/api/auth/register' || path === '/api/auth/me' || path === '/api/auth/renew' || path === '/api/auth/reset-password') {
    return next()
  }

  const payload: any = c.get('jwtPayload')
  if (!payload) return next(); // Should be caught by JWT middleware but just in case
  
  if (payload.isAdmin !== 1) {
    try {
      const clinic: any = await c.env.DB.prepare('SELECT status, validUntil FROM clinics WHERE id = ?').bind(payload.uid).first();
      
      if (!clinic || clinic.status !== 'active') {
          return c.json({ error: 'Akun Anda belum aktif atau telah ditangguhkan.', status: clinic?.status || 'inactive' }, 403)
      }
      
      if (clinic.validUntil && new Date(clinic.validUntil).getTime() < Date.now()) {
          return c.json({ error: 'Masa aktif langganan habis.', status: 'expired', validUntil: clinic.validUntil }, 403)
      }
    } catch (e) {
      console.error("Clinic check error:", e);
      // If DB fails, we might want to allow common requests or fail safe. 
      // For now, let's just continue to see if it works.
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

export default app
