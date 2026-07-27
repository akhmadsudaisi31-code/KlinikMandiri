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

const getDefaultFeatures = (clinicType: string, tier: string = 'STANDARD') => {
    const isDental = clinicType === 'Dokter Gigi' || clinicType === 'Terapis Gigi';
    const isBidan = clinicType === 'Bidan';
    
    // BASIC: Only Reports & Medicines
    if (tier === 'BASIC') {
        return {
            anc: false,
            kb: false,
            immunization: false,
            dental: false,
            lab: true, // Lab sederhana
            reports: true,
            medicines: true,
            physic_systemic: false,
            lab_upload: false
        };
    }

    // STANDARD: ANC, KB, Imunisasi, Fisik Sistemik, Reports, Medicines + Multi User
    if (tier === 'STANDARD') {
        return {
            anc: isBidan,
            kb: isBidan,
            immunization: isBidan,
            dental: isDental,
            lab: true,
            reports: true,
            medicines: true,
            physic_systemic: true,
            lab_upload: false,
            multi_user: true,
            backup_cloud: false // Manual only
        };
    }

    // PRO: All Features + Lab Upload + Weekly Cloud Backup
    return {
        anc: true, 
        kb: true,
        immunization: true,
        dental: true,
        lab: true,
        reports: true,
        medicines: true,
        physic_systemic: true,
        lab_upload: true,
        multi_user: true,
        backup_cloud: true // Weekly Auto Cloud Backup
    };
}

auth.post('/register', async (c) => {
  const body = await c.req.json()
  const id = crypto.randomUUID()
  const tier = body.tier || 'STANDARD';
  
  try {
    const passHash = await hashPassword(body.password)
    const clinicType = body.clinicType || 'Bidan';
    const defaultFeatures = getDefaultFeatures(clinicType, tier);

    await c.env.DB.batch([
        c.env.DB.prepare(
          'INSERT INTO clinics (id, name, email, password, phone, subscriptionPlan, status, isAdmin, clinicType, tier) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(id, body.clinicName, body.email, passHash, body.phone, body.subscriptionPlan, 'pending', 0, clinicType, tier),
        
        c.env.DB.prepare(
            'INSERT INTO clinic_settings (clinicId, enabledFeatures_json) VALUES (?, ?)'
        ).bind(id, JSON.stringify(defaultFeatures))
    ]);

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
            clinicType: body.clinicType || 'Bidan',
            tier: tier
        }
    })
  } catch (e: any) {
    const errorMsg = e.message || String(e);
    
    // Log error to D1 for admin visibility
    try {
        await c.env.DB.prepare(
            `INSERT INTO error_logs (id, clinicId, userEmail, url, errorMessage, errorStack, metadata, createdAt) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
            crypto.randomUUID(),
            'registration',
            body.email || 'unknown',
            '/api/auth/register',
            `Registration Failed: ${errorMsg}`,
            e.stack || '',
            JSON.stringify({ payload: { ...body, password: '***' } }),
            new Date().toISOString()
        ).run();
    } catch (logErr) {
        console.error("Failed to log registration error:", logErr);
    }

    if (errorMsg && errorMsg.includes('UNIQUE constraint failed: clinics.email')) {
        return c.json({ error: 'Email ini sudah terdaftar. Silakan gunakan email lain atau login.' }, 400);
    }
    return c.json({ error: 'Gagal mendaftar' }, 400)
  }
})

auth.post('/login', async (c) => {
  const body = await c.req.json()
  
  let userType = 'OWNER';
  let user: any = await c.env.DB.prepare(
    'SELECT * FROM clinics WHERE email = ?'
  ).bind(body.email).first();

  if (!user) {
      user = await c.env.DB.prepare(
          'SELECT * FROM clinic_users WHERE email = ?'
      ).bind(body.email).first();
      if (user) {
          userType = user.role;
      }
  }

  if (!user || !(await verifyPassword(body.password, user.password))) {
    return c.json({ error: 'Email atau password salah' }, 401)
  }

  let clinicStatus = user.status;
  let clinicValidUntil = user.validUntil;

  if (userType !== 'OWNER') {
      const parentClinic: any = await c.env.DB.prepare(
          'SELECT status, validUntil FROM clinics WHERE id = ?'
      ).bind(user.clinicId).first();
      if (parentClinic) {
          clinicStatus = parentClinic.status;
          clinicValidUntil = parentClinic.validUntil;
      }
  }

  const token = await sign({ 
    uid: userType === 'OWNER' ? user.id : user.clinicId, 
    subId: userType !== 'OWNER' ? user.id : undefined,
    email: user.email, 
    status: clinicStatus || 'active',
    isAdmin: userType === 'OWNER' ? user.isAdmin : 0,
    role: userType === 'OWNER' ? 'OWNER' : user.role,
    validUntil: clinicValidUntil,
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24)
  }, getSecretFromEnv(c.env))

  if (userType === 'OWNER') {
      try {
          await c.env.DB.prepare('UPDATE clinics SET lastLoginAt = CURRENT_TIMESTAMP WHERE id = ?').bind(user.id).run();
      } catch(e) { console.error('Failed updating lastLoginAt', e) }
  }

  return c.json({ 
    token, 
    user: { 
      uid: userType === 'OWNER' ? user.id : user.clinicId, 
      subId: userType !== 'OWNER' ? user.id : undefined,
      email: user.email, 
      displayName: user.name,
      status: userType === 'OWNER' ? user.status : 'active',
      isAdmin: userType === 'OWNER' ? user.isAdmin : 0,
      clinicType: userType === 'OWNER' ? user.clinicType : undefined,
      validUntil: userType === 'OWNER' ? user.validUntil : undefined,
      role: userType === 'OWNER' ? 'OWNER' : user.role
    } 
  })
})

auth.get('/me', async (c) => {
    const payload: any = c.get('jwtPayload')
    const clinic: any = await c.env.DB.prepare(`
        SELECT c.id, c.name, c.email as clinicEmail, c.phone, c.status, c.isAdmin, c.subscriptionPlan, c.clinicType, c.validUntil, s.enabledFeatures_json 
        FROM clinics c
        LEFT JOIN clinic_settings s ON c.id = s.clinicId
        WHERE c.id = ?
    `).bind(payload.uid).first()
    
    if (!clinic) return c.json({ error: 'Klinik tidak ditemukan' }, 404);

    if (!payload.role || payload.role === 'OWNER') {
        return c.json({
            ...clinic,
            email: clinic.clinicEmail,
            role: 'OWNER',
            features: clinic.enabledFeatures_json ? (typeof clinic.enabledFeatures_json === 'string' ? JSON.parse(clinic.enabledFeatures_json) : clinic.enabledFeatures_json) : {}
        })
    }

    const staff: any = await c.env.DB.prepare('SELECT id, name, email, role FROM clinic_users WHERE id = ?').bind(payload.subId).first();
    if (!staff) return c.json({ error: 'Akun staf tidak ditemukan' }, 404);
    
    return c.json({
        id: clinic.id,
        subId: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        status: clinic.status,
        isAdmin: clinic.isAdmin,
        subscriptionPlan: clinic.subscriptionPlan,
        clinicType: clinic.clinicType,
        validUntil: clinic.validUntil,
        features: clinic.enabledFeatures_json ? (typeof clinic.enabledFeatures_json === 'string' ? JSON.parse(clinic.enabledFeatures_json) : clinic.enabledFeatures_json) : {}
    });
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
