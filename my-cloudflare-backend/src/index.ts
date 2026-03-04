import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { jwt, sign, verify } from 'hono/jwt'

type Bindings = {
  DB: D1Database
  JWT_SECRET: string
  RESEND_API_KEY: string
}

const app = new Hono<{ Bindings: Bindings }>()

// Middleware
app.use('*', cors())

// Secret default jika belum di set di Cloudflare Dashboard
const SECRET = 'satset-rm-super-secret-key-123'

// --- AUTH ROUTES (Public) ---

app.post('/api/auth/register', async (c) => {
  const body = await c.req.json()
  const id = crypto.randomUUID()
  
  try {
    await c.env.DB.prepare(
      'INSERT INTO clinics (id, name, email, password, phone, subscriptionPlan, status, isAdmin, clinicType) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .bind(id, body.clinicName, body.email, body.password, body.phone, body.subscriptionPlan, 'pending', 0, body.clinicType || 'Bidan')
    .run()

    // Generate token so user can be logged in instantly
    const token = await sign({ 
        uid: id, 
        email: body.email, 
        status: 'pending',
        isAdmin: 0,
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24)
    }, c.env.JWT_SECRET || SECRET)
    
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
    console.error("Database Error:", e);
    if (e.message && e.message.includes('UNIQUE constraint failed: clinics.email')) {
        return c.json({ error: 'Email ini sudah terdaftar. Silakan gunakan email lain atau login.' }, 400);
    }
    return c.json({ error: e.message || 'Gagal mendaftar', details: e }, 400)
  }
})

app.post('/api/auth/login', async (c) => {
  const body = await c.req.json()
  
  const user: any = await c.env.DB.prepare(
    'SELECT * FROM clinics WHERE email = ? AND password = ?'
  )
  .bind(body.email, body.password)
  .first()

  if (!user) {
    return c.json({ error: 'Email atau password salah' }, 401)
  }

  const token = await sign({ 
    uid: user.id, 
    email: user.email, 
    status: user.status,
    isAdmin: user.isAdmin,
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 jam
  }, c.env.JWT_SECRET || SECRET)

  // Update last login timestamp
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

// --- PROTECTED ROUTES ---
app.use('/api/*', async (c, next) => {
  const path = c.req.path
  if (path === '/api/auth/login' || path === '/api/auth/register' || path === '/api/auth/reset-password') {
    return next()
  }
  
  const jwtMiddleware = jwt({
    secret: c.env.JWT_SECRET || SECRET,
    alg: 'HS256'
  })
  
  // Custom Status Check
  await jwtMiddleware(c, async () => {}) // Trigger validation
  const payload: any = c.get('jwtPayload')
  
  // Admin bypass status check for their own tools, or allow everyone to see /api/auth/me
  if (path !== '/api/auth/me' && path !== '/api/auth/renew' && payload.isAdmin !== 1) {
      const clinic: any = await c.env.DB.prepare('SELECT status, validUntil FROM clinics WHERE id = ?').bind(payload.uid).first();
      
      if (!clinic || clinic.status !== 'active') {
          return c.json({ error: 'Akun Anda belum aktif atau telah ditangguhkan.', status: clinic?.status || 'inactive' }, 403)
      }
      
      // Jika validUntil terlewat, tolak semua akses data medik
      if (clinic.validUntil && new Date(clinic.validUntil).getTime() < Date.now()) {
          return c.json({ error: 'Masa aktif langganan habis.', status: 'expired', validUntil: clinic.validUntil }, 403)
      }
  }
  
  return next()
})

async function sendEmail(env: Bindings, to: string, subject: string, html: string) {
  if (!env.RESEND_API_KEY) {
     console.log("Email mocked (No RESEND_API_KEY):", to, subject);
     return;
  }
  
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Admin SatSet RM <onboarding@resend.dev>',
        to,
        subject,
        html
      })
    });
    const result: any = await res.json();
    if (res.ok) {
        console.log("Email sent successfully:", result.id);
    } else {
        console.error("Email send failed with Resend API Error:", result);
    }
  } catch(e) {
    console.error("Email send network/parsing error:", e);
  }
}

const getEmailTemplate = (type: 'success' | 'rejected', clinicName: string): string => {
  const isSuccess = type === 'success';
  const color = isSuccess ? '#0ea5e9' : '#f43f5e'; // Sky 500 for success/primary, Rose 500 for error
  const title = isSuccess ? 'Aktivasi Akun Berhasil 🎉' : 'Aktivasi Akun Ditolak ⚠️';
  const body = isSuccess 
    ? `Selamat! Akun klinik <b>${clinicName}</b> telah berhasil diaktifkan. Anda sekarang dapat masuk (login) dan menikmati seluruh fitur unggulan aplikasi SatSet RM.`
    : `Mohon maaf, aktivasi akun klinik <b>${clinicName}</b> saat ini tidak dapat kami setujui. Hal ini mungkin terjadi jika Anda belum mentransfer nominal yang sesuai atau bukti pembayaran tidak valid.`;
  
  const ctaText = isSuccess ? 'Masuk ke Dashboard' : 'Hubungi Dukungan CS (WA)';
  const ctaLink = isSuccess ? 'https://satset-rm.pages.dev/login' : 'https://wa.me/6281234567890'; // Sesuaikan nomor WA support

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                
                <!-- Header -->
                <tr>
                  <td align="center" style="padding: 40px 20px; background-color: ${color};">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: -0.5px; font-weight: 800;">SatSet RM</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px; font-weight: 500; letter-spacing: 1px;">SISTEM REKAM MEDIS DIGITAL</p>
                  </td>
                </tr>
                
                <!-- Body Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #0f172a; margin-top: 0; font-size: 22px; font-weight: 700;">${title}</h2>
                    <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                      Halo <strong>${clinicName}</strong>,<br><br>
                      ${body}
                    </p>
                    
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td align="center">
                          <a href="${ctaLink}" style="display: inline-block; padding: 14px 28px; background-color: ${color}; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                            ${ctaText}
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td align="center" style="padding: 24px 30px; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
                    <p style="color: #94a3b8; font-size: 12px; margin: 0; line-height: 1.5;">
                      &copy; ${new Date().getFullYear()} SatSet RM. Hak cipta dilindungi undang-undang.<br>
                      Email ini dibuat otomatis, mohon tidak membalas ke alamat email ini.
                    </p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

// --- ADMIN ENDPOINTS ---
app.get('/api/admin/clinics', async (c) => {
    const payload: any = c.get('jwtPayload')
    if (payload.isAdmin !== 1) return c.json({ error: 'Unauthorized' }, 403)
    
    const { results } = await c.env.DB.prepare('SELECT id, name, email, phone, status, subscriptionPlan, validUntil, createdAt FROM clinics WHERE isAdmin = 0 ORDER BY createdAt DESC').all()
    return c.json(results)
})

app.put('/api/admin/clinics/:id', async (c) => {
    const payload: any = c.get('jwtPayload')
    if (payload.isAdmin !== 1) return c.json({ error: 'Unauthorized' }, 403)
    
    const id = c.req.param('id')
    const body = await c.req.json()
    
    const clinic: any = await c.env.DB.prepare('SELECT id FROM clinics WHERE id = ?').bind(id).first()
    if (!clinic) return c.json({ error: 'Klinik tidak ditemukan' }, 404)

    // Calculate validUntil dynamically and add to SET query
    let validUntilQuery = "validUntil = datetime('now', '+1 year')"; // Default YEARLY
    if (body.subscriptionPlan === 'MONTHLY') validUntilQuery = "validUntil = datetime('now', '+1 month')";
    if (body.subscriptionPlan === '2YEARS') validUntilQuery = "validUntil = datetime('now', '+2 years')";
    if (body.subscriptionPlan === 'LIFETIME') validUntilQuery = "validUntil = datetime('now', '+100 years')";

    await c.env.DB.prepare(
        `UPDATE clinics SET name = ?, email = ?, phone = ?, subscriptionPlan = ?, ${validUntilQuery} WHERE id = ?`
    ).bind(body.name, body.email, body.phone, body.subscriptionPlan, id).run()
    
    return c.json({ success: true })
})

app.put('/api/admin/clinics/:id/validity', async (c) => {
    const payload: any = c.get('jwtPayload')
    if (payload.isAdmin !== 1) return c.json({ error: 'Unauthorized' }, 403)
    
    const id = c.req.param('id')
    const body = await c.req.json()
    
    if (!body.modifier) return c.json({ error: 'Modifier required' }, 400)
    
    await c.env.DB.prepare(`UPDATE clinics SET validUntil = datetime('now', ?) WHERE id = ?`).bind(body.modifier, id).run()
    
    return c.json({ success: true })
})

app.delete('/api/admin/clinics/:id', async (c) => {
    const payload: any = c.get('jwtPayload')
    if (payload.isAdmin !== 1) return c.json({ error: 'Unauthorized' }, 403)
    
    const id = c.req.param('id')
    
    // Batch delete to cleanly remove the clinic and all its associated data
    await c.env.DB.batch([
        c.env.DB.prepare('DELETE FROM patients WHERE clinicId = ?').bind(id),
        c.env.DB.prepare('DELETE FROM medicines WHERE clinicId = ?').bind(id),
        c.env.DB.prepare('DELETE FROM examinations WHERE clinicId = ?').bind(id),
        c.env.DB.prepare('DELETE FROM visits WHERE clinicId = ?').bind(id),
        c.env.DB.prepare('DELETE FROM notifications WHERE clinicId = ?').bind(id),
        c.env.DB.prepare('DELETE FROM clinics WHERE id = ?').bind(id)
    ])
    
    return c.json({ success: true })
})

app.put('/api/admin/clinics/:id/activate', async (c) => {
    const payload: any = c.get('jwtPayload')
    if (payload.isAdmin !== 1) return c.json({ error: 'Unauthorized' }, 403)
    
    const id = c.req.param('id')
    // Get clinic info for email
    const clinic: any = await c.env.DB.prepare('SELECT email, name FROM clinics WHERE id = ?').bind(id).first()
    
    if (!clinic) return c.json({ error: 'Klinik tidak ditemukan' }, 404)

    let validUntilQuery = "datetime('now', '+1 year')"; // Default YEARLY
    if (clinic.subscriptionPlan === 'MONTHLY') validUntilQuery = "datetime('now', '+1 month')";
    if (clinic.subscriptionPlan === '2YEARS') validUntilQuery = "datetime('now', '+2 years')";
    if (clinic.subscriptionPlan === 'LIFETIME') validUntilQuery = "datetime('now', '+100 years')";

    await c.env.DB.prepare(`UPDATE clinics SET status = "active", validUntil = ${validUntilQuery} WHERE id = ?`).bind(id).run()
    
    // Send Success Email
    await sendEmail(
        c.env, 
        clinic.email, 
        'Aktivasi Akun SatSet RM Berhasil', 
        getEmailTemplate('success', clinic.name)
    );
    
    return c.json({ success: true })
})

app.put('/api/admin/clinics/:id/reject', async (c) => {
    const payload: any = c.get('jwtPayload')
    if (payload.isAdmin !== 1) return c.json({ error: 'Unauthorized' }, 403)
    
    const id = c.req.param('id')
    const clinic: any = await c.env.DB.prepare('SELECT email, name FROM clinics WHERE id = ?').bind(id).first()
    
    if (!clinic) return c.json({ error: 'Klinik tidak ditemukan' }, 404)

    await c.env.DB.prepare('UPDATE clinics SET status = "rejected" WHERE id = ?').bind(id).run()
    
    // Send Rejection Email
    await sendEmail(
        c.env, 
        clinic.email, 
        'Informasi Aktivasi Akun SatSet RM', 
        getEmailTemplate('rejected', clinic.name)
    );
    
    return c.json({ success: true })
})

app.post('/api/admin/impersonate/:id', async (c) => {
    const payload: any = c.get('jwtPayload')
    if (payload.isAdmin !== 1) return c.json({ error: 'Unauthorized' }, 403)
    
    const id = c.req.param('id')
    const clinic: any = await c.env.DB.prepare('SELECT * FROM clinics WHERE id = ?').bind(id).first()
    
    if (!clinic) return c.json({ error: 'Klinik tidak ditemukan' }, 404)

    const token = await sign({ 
        uid: clinic.id, 
        email: clinic.email, 
        status: clinic.status,
        isAdmin: clinic.isAdmin,
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 2) // 2 hours impersonation
    }, c.env.JWT_SECRET || SECRET)

    return c.json({ 
        token, 
        user: { 
          uid: clinic.id, 
          email: clinic.email, 
          displayName: clinic.name,
          status: clinic.status,
          isAdmin: clinic.isAdmin,
          clinicType: clinic.clinicType
        } 
    })
})

app.get('/api/admin/clinics/:id/activity', async (c) => {
    const payload: any = c.get('jwtPayload')
    if (payload.isAdmin !== 1) return c.json({ error: 'Unauthorized' }, 403)
    
    const id = c.req.param('id')
    const clinic: any = await c.env.DB.prepare('SELECT lastLoginAt FROM clinics WHERE id = ?').bind(id).first()
    
    if (!clinic) return c.json({ error: 'Klinik tidak ditemukan' }, 404)
    
    // Aggregate counts
    const patientsCount = await c.env.DB.prepare('SELECT COUNT(*) as c FROM patients WHERE clinicId = ?').bind(id).first()
    const medicinesCount = await c.env.DB.prepare('SELECT COUNT(*) as c FROM medicines WHERE clinicId = ?').bind(id).first()
    const examsCount = await c.env.DB.prepare('SELECT COUNT(*) as c FROM examinations WHERE clinicId = ?').bind(id).first()
    
    return c.json({
        lastLoginAt: clinic.lastLoginAt,
        totalPatients: (patientsCount as any)?.c || 0,
        totalMedicines: (medicinesCount as any)?.c || 0,
        totalExaminations: (examsCount as any)?.c || 0
    })
})

app.delete('/api/admin/system/reset', async (c) => {
    const payload: any = c.get('jwtPayload')
    if (payload.isAdmin !== 1) return c.json({ error: 'Unauthorized' }, 403)
    
    const body: any = await c.req.json().catch(() => ({}))
    if (body.confirmation !== 'RESET') return c.json({ error: 'Konfirmasi tidak valid' }, 400)
    
    try {
        await c.env.DB.prepare('DELETE FROM patients').run()
        await c.env.DB.prepare('DELETE FROM medicines').run()
        await c.env.DB.prepare('DELETE FROM examinations').run()
        await c.env.DB.prepare('DELETE FROM visits').run()
        await c.env.DB.prepare('DELETE FROM notifications').run()
        await c.env.DB.prepare('DELETE FROM clinics WHERE isAdmin = 0').run()
        
        return c.json({ success: true, message: 'Semua data telah direset' })
    } catch (e: any) {
        console.error('Reset Failed:', e)
        return c.json({ error: 'Gagal melakukan reset database' }, 500)
    }
})

app.get('/api/auth/me', async (c) => {
    const payload: any = c.get('jwtPayload')
    const user: any = await c.env.DB.prepare('SELECT id, name, email, phone, status, isAdmin, subscriptionPlan, clinicType, validUntil FROM clinics WHERE id = ?').bind(payload.uid).first()
    return c.json(user)
})

app.put('/api/auth/renew', async (c) => {
    const payload: any = c.get('jwtPayload')
    const body = await c.req.json()
    
    if (!body.subscriptionPlan) return c.json({ error: 'Paket langganan harus dipilih' }, 400)
    
    await c.env.DB.prepare('UPDATE clinics SET status = "pending", subscriptionPlan = ? WHERE id = ?')
        .bind(body.subscriptionPlan, payload.uid).run()

    return c.json({ success: true })
})

// Helper untuk ambil clinicId dari Token
const getClinicId = (c: any) => c.get('jwtPayload').uid

// --- PATIENTS ---
app.get('/api/patients', async (c) => {
  const clinicId = getClinicId(c)
  const { results } = await c.env.DB.prepare(
    // Optimize: only fetch columns needed for list view (not address, extendedData, etc)
    'SELECT id, rm, name, namaSuami, gender, category, dob, ageDisplay, poli, allergies, createdAt, updatedAt FROM patients WHERE clinicId = ? ORDER BY createdAt DESC LIMIT 1000'
  ).bind(clinicId).all()
  c.header('Cache-Control', 'private, max-age=10, stale-while-revalidate=30')
  return c.json(results)
})

app.get('/api/patients/next-rm', async (c) => {
  const clinicId = getClinicId(c)
  const count: any = await c.env.DB.prepare(
    'SELECT COUNT(*) as total FROM patients WHERE clinicId = ?'
  ).bind(clinicId).first()
  
  const nextNum = (count?.total || 0) + 1
  const rm = `RM-${String(nextNum).padStart(4, '0')}`
  return c.json({ rm })
})

app.get('/api/patients/:id', async (c) => {
  const clinicId = getClinicId(c)
  const id = c.req.param('id')
  const result = await c.env.DB.prepare(
    'SELECT * FROM patients WHERE id = ? AND clinicId = ?'
  ).bind(id, clinicId).first()
  return c.json(result)
})

app.post('/api/patients', async (c) => {
  const clinicId = getClinicId(c)
  const body = await c.req.json()
  const id = crypto.randomUUID()
  
  await c.env.DB.prepare(
    `INSERT INTO patients (id, clinicId, rm, name, namaSuami, gender, category, address, dob, ageYears, ageMonths, ageDisplay, poli, allergies, createdBy) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id, clinicId, body.rm, body.name, body.namaSuami || null, body.gender, body.category, 
    body.address, body.dob, body.ageYears, body.ageMonths, body.ageDisplay, body.poli, body.allergies || null, clinicId
  ).run()
  
  return c.json({ id })
})

app.put('/api/patients/:id', async (c) => {
  const clinicId = getClinicId(c)
  const id = c.req.param('id')
  const body = await c.req.json()
  
  // Sederhanakan update (hanya poli & updatedAt dulu untuk handle antrian)
  if (Object.keys(body).length === 2 && body.poli) {
      await c.env.DB.prepare(
        'UPDATE patients SET poli = ?, updatedAt = ? WHERE id = ? AND clinicId = ?'
      ).bind(body.poli, body.updatedAt || new Date().toISOString(), id, clinicId).run()
  } else {
      await c.env.DB.prepare(
        'UPDATE patients SET name=?, namaSuami=?, gender=?, category=?, address=?, dob=?, ageYears=?, ageMonths=?, ageDisplay=?, poli=?, allergies=?, updatedAt=? WHERE id=? AND clinicId=?'
      ).bind(
        body.name, body.namaSuami || null, body.gender, body.category, body.address, body.dob, 
        body.ageYears, body.ageMonths, body.ageDisplay, body.poli, body.allergies || null, new Date().toISOString(), id, clinicId
      ).run()
  }
  
  return c.json({ success: true })
})

app.delete('/api/patients/:id', async (c) => {
  const clinicId = getClinicId(c)
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM patients WHERE id = ? AND clinicId = ?').bind(id, clinicId).run()
  return c.json({ success: true })
})

// --- MEDICINES ---
app.get('/api/medicines', async (c) => {
  const clinicId = getClinicId(c)
  const { results } = await c.env.DB.prepare(
    // Optimize: select only fields needed (inventory data rarely changes)
    'SELECT id, name, unit, price FROM medicines WHERE clinicId = ? ORDER BY name ASC'
  ).bind(clinicId).all()
  // Cache-Control for 5 minutes – medicines data rarely changes mid-session
  c.header('Cache-Control', 'private, max-age=300, stale-while-revalidate=60')
  return c.json(results)
})

app.post('/api/medicines', async (c) => {
  const clinicId = getClinicId(c)
  const body = await c.req.json()
  const id = crypto.randomUUID()
  
  await c.env.DB.prepare(
    'INSERT INTO medicines (id, clinicId, name, unit, price, createdBy) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, clinicId, body.name, body.unit, body.price, clinicId).run()
  
  return c.json({ id })
})

app.delete('/api/medicines/:id', async (c) => {
  const clinicId = getClinicId(c)
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM medicines WHERE id = ? AND clinicId = ?').bind(id, clinicId).run()
  return c.json({ success: true })
})

// --- EXAMINATIONS ---
app.get('/api/examinations/today', async (c) => {
  const clinicId = getClinicId(c)
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM examinations WHERE clinicId = ? AND date LIKE ? ORDER BY createdAt DESC"
  ).bind(clinicId, `${today}%`).all()
  
  const formatted = results.map((r: any) => ({
    ...r,
    medicines: JSON.parse(r.medicines_json || '[]')
  }))
  
  return c.json(formatted)
})

app.get('/api/examinations', async (c) => {
  const clinicId = getClinicId(c)
  const patientId = c.req.query('patientId')
  const startDate = c.req.query('startDate')
  const endDate = c.req.query('endDate')
  
  let query = 'SELECT examinations.*, patients.namaSuami, patients.ageDisplay, patients.address FROM examinations LEFT JOIN patients ON examinations.patientId = patients.id WHERE examinations.clinicId = ?'
  let params: any[] = [clinicId]
  
  if (patientId) {
    query += ' AND examinations.patientId = ?'
    params.push(patientId)
  }

  if (startDate && endDate) {
    query += ' AND examinations.createdAt >= ? AND examinations.createdAt <= ?'
    params.push(startDate, endDate)
  }
  
  query += ' ORDER BY examinations.createdAt DESC'
  
  const { results } = await c.env.DB.prepare(query).bind(...params).all()
  
  // Parse medicines_json back to object
  const formatted = results.map((r: any) => ({
    ...r,
    medicines: JSON.parse(r.medicines_json || '[]'),
    // Mapping for backward compatibility in reports if needed
    cost: r.biaya,
    diagnosis: r.diagnosa
  }))
  
  return c.json(formatted)
})

app.post('/api/examinations', async (c) => {
  const clinicId = getClinicId(c)
  const body = await c.req.json()
  const id = crypto.randomUUID()
  
  await c.env.DB.prepare(
    `INSERT INTO examinations (id, clinicId, patientId, patientName, patientRm, keluhanUtama, riwayatPenyakitSekarang, tensi, nadi, suhu, respirasi, bb, tb, spo2, pemeriksaanFisik, diagnosa, icd10, medicines_json, tindakan, edukasi, rencanaTindakLanjut, biaya, extendedData_json, createdBy) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id, clinicId, body.patientId, body.patientName, body.patientRm, body.keluhanUtama, body.riwayatPenyakitSekarang,
    body.tensi, body.nadi, body.suhu, body.respirasi, body.bb, body.tb, body.spo2, body.pemeriksaanFisik,
    body.diagnosa, body.icd10, JSON.stringify(body.medicines || []), body.tindakan, body.edukasi,
    body.rencanaTindakLanjut, body.biaya, body.extendedData_json, clinicId
  ).run()
  
  return c.json({ id })
})

// --- VISITS ---
app.get('/api/visits', async (c) => {
  const clinicId = getClinicId(c)
  const patientId = c.req.query('patientId')
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM visits WHERE clinicId = ? AND patientId = ? ORDER BY date DESC'
  ).bind(clinicId, patientId).all()
  return c.json(results)
})

app.post('/api/visits', async (c) => {
  const clinicId = getClinicId(c)
  const body = await c.req.json()
  const id = crypto.randomUUID()
  
  await c.env.DB.prepare(
    `INSERT INTO visits (id, clinicId, patientId, patientName, patientRm, diagnosis, therapy, notes, cost, createdBy) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id, clinicId, body.patientId, body.patientName, body.patientRm, 
    body.diagnosis, body.therapy, body.notes, body.cost, clinicId
  ).run()
  
  return c.json({ id })
})

// --- NOTIFICATIONS ---
app.get('/api/notifications', async (c) => {
  const clinicId = getClinicId(c)
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM notifications WHERE clinicId = ? AND isRead = 0 ORDER BY createdAt DESC LIMIT 20'
  ).bind(clinicId).all()
  return c.json(results)
})

app.put('/api/notifications/:id/read', async (c) => {
  const clinicId = getClinicId(c)
  const id = c.req.param('id')
  await c.env.DB.prepare(
    'UPDATE notifications SET isRead = 1 WHERE id = ? AND clinicId = ?'
  ).bind(id, clinicId).run()
  return c.json({ success: true })
})

app.post('/api/notifications', async (c) => {
  const clinicId = getClinicId(c)
  const body = await c.req.json()
  const id = crypto.randomUUID()
  
  await c.env.DB.prepare(
    'INSERT INTO notifications (id, clinicId, type, patientId, patientName, message, toRole) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, clinicId, body.type, body.patientId, body.patientName, body.message, body.toRole).run()
  
  return c.json({ id })
})

export default app
