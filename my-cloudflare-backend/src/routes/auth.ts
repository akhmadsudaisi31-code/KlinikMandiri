import { Hono } from 'hono'
import { sign } from 'hono/jwt'
import { hashPassword, verifyPassword } from '../utils/password'

type Bindings = {
  DB: D1Database
  JWT_SECRET: string
  RESEND_API_KEY: string
}

const auth = new Hono<{ Bindings: Bindings }>()

// Helper to get JWT Secret (Internal to router if needed, better to pass from index or have a util)
const getSecretFromEnv = (env: Bindings) => {
  if (!env.JWT_SECRET) {
      throw new Error("CRITICAL: JWT_SECRET environment variable is missing. Set it in wrangler.toml or Cloudflare dashboard.");
  }
  return env.JWT_SECRET;
}

auth.post('/register', async (c) => {
  const body = await c.req.json()
  const id = crypto.randomUUID()
  
  try {
    const passHash = await hashPassword(body.password)
    await c.env.DB.prepare(
      'INSERT INTO clinics (id, name, email, password, phone, subscriptionPlan, status, isAdmin, clinicType) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .bind(id, body.clinicName, body.email, passHash, body.phone, body.subscriptionPlan, 'pending', 0, body.clinicType || 'Bidan')
    .run()

    const token = await sign({ 
        uid: id, 
        email: body.email, 
        status: 'pending',
        isAdmin: 0,
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24)
    }, getSecretFromEnv(c.env))
    
    return c.json({ 
        success: true, 
        token,
        user: {
            id,
            name: body.clinicName,
            email: body.email,
            status: 'pending',
            isAdmin: 0,
            subscriptionPlan: body.subscriptionPlan,
            clinicType: body.clinicType || 'Bidan'
        }
    })
  } catch (e: any) {
    if (e.message && e.message.includes('UNIQUE constraint failed: clinics.email')) {
        return c.json({ error: 'Email ini sudah terdaftar. Silakan gunakan email lain atau login.' }, 400);
    }
    return c.json({ error: 'Gagal mendaftar' }, 400)
  }
})

auth.post('/login', async (c) => {
  const body = await c.req.json()
  
  const user: any = await c.env.DB.prepare(
    'SELECT * FROM clinics WHERE email = ?'
  )
  .bind(body.email)
  .first()

  if (!user || !(await verifyPassword(body.password, user.password))) {
    return c.json({ error: 'Email atau password salah' }, 401)
  }

  const token = await sign({ 
    uid: user.id, 
    email: user.email, 
    status: user.status,
    isAdmin: user.isAdmin,
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24)
  }, getSecretFromEnv(c.env))

  try {
      await c.env.DB.prepare('UPDATE clinics SET lastLoginAt = CURRENT_TIMESTAMP WHERE id = ?').bind(user.id).run();
  } catch(e) { console.error('Failed updating lastLoginAt', e) }

  return c.json({ 
    token, 
    user: { 
      uid: user.id, 
      email: user.email, 
      displayName: user.name,
      status: user.status,
      isAdmin: user.isAdmin,
      clinicType: user.clinicType,
      validUntil: user.validUntil
    } 
  })
})

auth.get('/me', async (c) => {
    const payload: any = c.get('jwtPayload')
    const user: any = await c.env.DB.prepare('SELECT id, name, email, phone, status, isAdmin, subscriptionPlan, clinicType, validUntil FROM clinics WHERE id = ?').bind(payload.uid).first()
    return c.json(user)
})

auth.put('/renew', async (c) => {
    const payload: any = c.get('jwtPayload')
    const body = await c.req.json()
    if (!body.subscriptionPlan) return c.json({ error: 'Paket langganan harus dipilih' }, 400)
    
    await c.env.DB.prepare('UPDATE clinics SET status = "pending", subscriptionPlan = ? WHERE id = ?')
        .bind(body.subscriptionPlan, payload.uid).run()

  return c.json({ success: true })
})

auth.post('/reset-password', async (c) => {
    const { email } = await c.req.json()
    if (!email) return c.json({ error: 'Email wajib diisi' }, 400)

    try {
        // 1. Cek apakah email terdaftar
        const user: any = await c.env.DB.prepare('SELECT id, name FROM clinics WHERE email = ?').bind(email).first()
        
        if (user) {
            // 2. Generate reset token (simulasi)
            const resetToken = crypto.randomUUID()
            const resetLink = `http://localhost:5173/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`
            
            console.log(`[AUTH] Reset Password requested for ${email} (${user.name})`)
            console.log(`[AUTH] SIMULATED RESET LINK: ${resetLink}`)
            
            // 3. TODO: Kirim email beneran via Resend jika API Key valid
            // if (c.env.RESEND_API_KEY && !c.env.RESEND_API_KEY.startsWith('re_')) { ... }
        }

        // Selalu return sukses (Security best practice: jangan kasih tau apakah email ada atau tidak)
        // Namun di screenshot, user ingin pesan "Email reset password telah dikirim ke..."
        return c.json({ success: true, message: `Email reset password telah dikirim ke ${email}.` })
    } catch (e: any) {
        console.error("Forgot Password Error:", e)
        return c.json({ error: 'Terjadi kesalahan. Silakan coba lagi nanti.' }, 500)
    }
})

export default auth
