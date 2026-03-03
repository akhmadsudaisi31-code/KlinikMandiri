import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { jwt, sign, verify } from 'hono/jwt'

type Bindings = {
  DB: D1Database
  JWT_SECRET: string
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
      'INSERT INTO clinics (id, name, email, password, phone, subscriptionPlan, status, isAdmin) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .bind(id, body.clinicName, body.email, body.password, body.phone, body.subscriptionPlan, 'pending', 0)
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
            subscriptionPlan: body.subscriptionPlan
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

  return c.json({ 
    token, 
    user: { 
      uid: user.id, 
      email: user.email, 
      displayName: user.name,
      status: user.status,
      isAdmin: user.isAdmin
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
  if (path !== '/api/auth/me' && payload.status !== 'active' && payload.isAdmin !== 1) {
      return c.json({ error: 'Akun Anda belum aktif. Silakan lakukan konfirmasi pembayaran.', status: payload.status }, 403)
  }
  
  return next()
})

// --- ADMIN ENDPOINTS ---
app.get('/api/admin/clinics', async (c) => {
    const payload: any = c.get('jwtPayload')
    if (payload.isAdmin !== 1) return c.json({ error: 'Unauthorized' }, 403)
    
    const { results } = await c.env.DB.prepare('SELECT id, name, email, phone, status, subscriptionPlan, createdAt FROM clinics WHERE isAdmin = 0 ORDER BY createdAt DESC').all()
    return c.json(results)
})

app.put('/api/admin/clinics/:id/activate', async (c) => {
    const payload: any = c.get('jwtPayload')
    if (payload.isAdmin !== 1) return c.json({ error: 'Unauthorized' }, 403)
    
    const id = c.req.param('id')
    await c.env.DB.prepare('UPDATE clinics SET status = "active" WHERE id = ?').bind(id).run()
    return c.json({ success: true })
})

app.get('/api/auth/me', async (c) => {
    const payload: any = c.get('jwtPayload')
    const user: any = await c.env.DB.prepare('SELECT id, name, email, phone, status, isAdmin, subscriptionPlan FROM clinics WHERE id = ?').bind(payload.uid).first()
    return c.json(user)
})

// Helper untuk ambil clinicId dari Token
const getClinicId = (c: any) => c.get('jwtPayload').uid

// --- PATIENTS ---
app.get('/api/patients', async (c) => {
  const clinicId = getClinicId(c)
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM patients WHERE clinicId = ? ORDER BY createdAt DESC'
  ).bind(clinicId).all()
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
    `INSERT INTO patients (id, clinicId, rm, name, gender, category, address, dob, ageYears, ageMonths, ageDisplay, poli, allergies, createdBy) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id, clinicId, body.rm, body.name, body.gender, body.category, 
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
        'UPDATE patients SET name=?, gender=?, category=?, address=?, dob=?, ageYears=?, ageMonths=?, ageDisplay=?, poli=?, allergies=?, updatedAt=? WHERE id=? AND clinicId=?'
      ).bind(
        body.name, body.gender, body.category, body.address, body.dob, 
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
    'SELECT * FROM medicines WHERE clinicId = ? ORDER BY name ASC'
  ).bind(clinicId).all()
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
  
  let query = 'SELECT * FROM examinations WHERE clinicId = ?'
  let params: any[] = [clinicId]
  
  if (patientId) {
    query += ' AND patientId = ?'
    params.push(patientId)
  }

  if (startDate && endDate) {
    query += ' AND createdAt >= ? AND createdAt <= ?'
    params.push(startDate, endDate)
  }
  
  query += ' ORDER BY createdAt DESC'
  
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
