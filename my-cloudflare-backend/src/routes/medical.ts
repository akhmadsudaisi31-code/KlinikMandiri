import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
}

const medical = new Hono<{ Bindings: Bindings }>()

const getClinicId = (c: any) => c.get('jwtPayload').uid

const getPatientDeleteStatements = (db: D1Database, patientId: string, clinicId: string) => [
  db.prepare('DELETE FROM examinations WHERE patientId = ? AND clinicId = ?').bind(patientId, clinicId),
  db.prepare('DELETE FROM visits WHERE patientId = ? AND clinicId = ?').bind(patientId, clinicId),
  db.prepare('DELETE FROM notifications WHERE patientId = ? AND clinicId = ?').bind(patientId, clinicId),
  db.prepare('DELETE FROM patients WHERE id = ? AND clinicId = ?').bind(patientId, clinicId)
]

// --- PATIENTS ---
medical.get('/patients', async (c) => {
  const clinicId = getClinicId(c)
  const startDate = c.req.query('startDate')
  const endDate = c.req.query('endDate')

  let query = 'SELECT id, rm, name, namaSuami, gender, category, address, occupation, dob, ageDisplay, poli, allergies, createdAt, updatedAt FROM patients WHERE clinicId = ?'
  const params: any[] = [clinicId]

  if (startDate && endDate) {
    query += ' AND createdAt >= ? AND createdAt <= ?'
    params.push(startDate, endDate)
  }

  query += ' ORDER BY createdAt DESC LIMIT 1000'
  
  const { results } = await c.env.DB.prepare(query).bind(...params).all()
  return c.json(results)
})

medical.get('/patients/next-rm', async (c) => {
  const clinicId = getClinicId(c)
  const count: any = await c.env.DB.prepare(
    'SELECT COUNT(*) as total FROM patients WHERE clinicId = ?'
  ).bind(clinicId).first()
  
  const nextNum = (count?.total || 0) + 1
  const rm = `RM-${String(nextNum).padStart(4, '0')}`
  return c.json({ rm })
})

medical.get('/patients/:id', async (c) => {
  const clinicId = getClinicId(c)
  const id = c.req.param('id')
  const result = await c.env.DB.prepare(
    'SELECT * FROM patients WHERE id = ? AND clinicId = ?'
  ).bind(id, clinicId).first()
  return c.json(result)
})

medical.post('/patients', async (c) => {
  const clinicId = getClinicId(c)
  const body = await c.req.json()

  // --- CEK UNIK RM (Kecuali '-') ---
  if (body.rm && body.rm !== '-') {
    const existing: any = await c.env.DB.prepare(
      'SELECT id FROM patients WHERE clinicId = ? AND rm = ?'
    ).bind(clinicId, body.rm).first()
    
    if (existing) {
      return c.json({ error: `Nomor RM ${body.rm} sudah terdaftar di klinik ini.` }, 400)
    }
  } else if (body.name && body.dob) {
    // --- CEK UNIK NAMA + DOB (Untuk Tanpa RM) ---
    const existing: any = await c.env.DB.prepare(
      'SELECT id FROM patients WHERE clinicId = ? AND name = ? AND dob = ?'
    ).bind(clinicId, body.name, body.dob).first()

    if (existing) {
      return c.json({ error: `Pasien dengan nama ${body.name} dan tanggal lahir ${body.dob} sudah terdaftar.` }, 400)
    }
  }

  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  await c.env.DB.prepare(
    `INSERT INTO patients (id, clinicId, rm, name, namaSuami, gender, category, address, occupation, dob, ageYears, ageMonths, ageDisplay, poli, allergies, createdBy, updatedAt) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id, clinicId, body.rm, body.name, body.namaSuami || null, body.gender, body.category, 
    body.address, body.occupation || null, body.dob, body.ageYears, body.ageMonths, body.ageDisplay, body.poli, body.allergies || null, clinicId, now
  ).run()
  
  return c.json({ id })
})

medical.put('/patients/:id', async (c) => {
  const clinicId = getClinicId(c)
  const id = c.req.param('id')
  const body = await c.req.json()
  
  const keys = Object.keys(body)
  if (keys.includes('poli') && keys.length <= 2) {
      await c.env.DB.prepare(
        'UPDATE patients SET poli = ?, updatedAt = ? WHERE id = ? AND clinicId = ?'
      ).bind(body.poli, body.updatedAt || new Date().toISOString(), id, clinicId).run()
  } else {
      await c.env.DB.prepare(
        'UPDATE patients SET name=?, namaSuami=?, gender=?, category=?, address=?, occupation=?, dob=?, ageYears=?, ageMonths=?, ageDisplay=?, poli=?, allergies=?, updatedAt=? WHERE id=? AND clinicId=?'
      ).bind(
        body.name, body.namaSuami || null, body.gender, body.category, body.address, body.occupation || null, body.dob, 
        body.ageYears, body.ageMonths, body.ageDisplay, body.poli, body.allergies || null, new Date().toISOString(), id, clinicId
      ).run()
  }
  
  return c.json({ success: true })
})

medical.delete('/patients/:id', async (c) => {
  const clinicId = getClinicId(c)
  const id = c.req.param('id')

  const patient: any = await c.env.DB.prepare(
    'SELECT id FROM patients WHERE id = ? AND clinicId = ?'
  ).bind(id, clinicId).first()

  if (!patient) return c.json({ error: 'Pasien tidak ditemukan' }, 404)

  await c.env.DB.batch(getPatientDeleteStatements(c.env.DB, id, clinicId))
  return c.json({ success: true })
})

// --- MEDICINES ---
medical.get('/medicines', async (c) => {
  const clinicId = getClinicId(c)
  const { results } = await c.env.DB.prepare(
    'SELECT id, name, unit, price FROM medicines WHERE clinicId = ? ORDER BY name ASC'
  ).bind(clinicId).all()
  return c.json(results)
})

medical.post('/medicines', async (c) => {
  const clinicId = getClinicId(c)
  const body = await c.req.json()
  const id = crypto.randomUUID()
  
  await c.env.DB.prepare(
    'INSERT INTO medicines (id, clinicId, name, unit, price, createdBy) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, clinicId, body.name, body.unit, body.price, clinicId).run()
  
  return c.json({ id })
})

medical.delete('/medicines/:id', async (c) => {
  const clinicId = getClinicId(c)
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM medicines WHERE id = ? AND clinicId = ?').bind(id, clinicId).run()
  return c.json({ success: true })
})

// --- EXAMINATIONS ---
medical.get('/examinations/today', async (c) => {
  const clinicId = getClinicId(c)
  const today = new Date().toISOString().split('T')[0]
  
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM examinations WHERE clinicId = ? AND date LIKE ? ORDER BY createdAt DESC"
  ).bind(clinicId, `${today}%`).all()
  
  const formatted = results.map((r: any) => ({
    ...r,
    medicines: JSON.parse(r.medicines_json || '[]')
  }))
  
  return c.json(formatted)
})

medical.get('/examinations', async (c) => {
  const clinicId = getClinicId(c)
  const patientId = c.req.query('patientId')
  const startDate = c.req.query('startDate')
  const endDate = c.req.query('endDate')
  
  // FIX: Added clinicId check to the JOIN condition for extra security
  let query = `
    SELECT examinations.*, patients.namaSuami, patients.ageDisplay, patients.address, patients.occupation 
    FROM examinations 
    LEFT JOIN patients ON examinations.patientId = patients.id AND patients.clinicId = examinations.clinicId 
    WHERE examinations.clinicId = ?
  `
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
  
  const formatted = results.map((r: any) => ({
    ...r,
    medicines: JSON.parse(r.medicines_json || '[]'),
    cost: r.biaya,
    diagnosis: r.diagnosa
  }))
  
  return c.json(formatted)
})

medical.get('/examinations/:id', async (c) => {
  const clinicId = getClinicId(c)
  const id = c.req.param('id')
  
  const result: any = await c.env.DB.prepare(
    `SELECT examinations.*, patients.namaSuami, patients.ageDisplay, patients.address, patients.occupation 
     FROM examinations 
     LEFT JOIN patients ON examinations.patientId = patients.id AND patients.clinicId = examinations.clinicId 
     WHERE examinations.id = ? AND examinations.clinicId = ?`
  ).bind(id, clinicId).first()
  
  if (!result) return c.json({ error: 'Pemeriksaan tidak ditemukan' }, 404)
  
  return c.json({
    ...result,
    medicines: JSON.parse(result.medicines_json || '[]'),
    cost: result.biaya,
    diagnosis: result.diagnosa
  })
})

medical.put('/examinations/:id', async (c) => {
  const clinicId = getClinicId(c)
  const id = c.req.param('id')
  const body = await c.req.json()
  
  await c.env.DB.prepare(
    `UPDATE examinations SET 
      keluhanUtama = ?, riwayatPenyakitSekarang = ?, tensi = ?, 
      nadi = ?, suhu = ?, respirasi = ?, bb = ?, tb = ?, 
      spo2 = ?, pemeriksaanFisik = ?, diagnosa = ?, 
      icd10 = ?, medicines_json = ?, tindakan = ?, 
      edukasi = ?, rencanaTindakLanjut = ?, biaya = ?, 
      extendedData_json = ?, updatedAt = ? 
     WHERE id = ? AND clinicId = ?`
  ).bind(
    body.keluhanUtama, body.riwayatPenyakitSekarang, body.tensi,
    body.nadi, body.suhu, body.respirasi, body.bb, body.tb,
    body.spo2, body.pemeriksaanFisik, body.diagnosa,
    body.icd10, JSON.stringify(body.medicines || []), body.tindakan,
    body.edukasi, body.rencanaTindakLanjut, body.biaya,
    body.extendedData_json, new Date().toISOString(),
    id, clinicId
  ).run()
  
  return c.json({ success: true })
})

medical.post('/examinations', async (c) => {
  const clinicId = getClinicId(c)
  const body = await c.req.json()

  // --- CEK IDEMPOTENCY (Pemeriksaan Ganda dalam waktu dekat) ---
  // Jika pasien sudah diperiksa dalam 1 jam terakhir dengan diagnosa yang sama, cegah duplikasi tidak sengaja.
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const duplicate: any = await c.env.DB.prepare(
    'SELECT id FROM examinations WHERE clinicId = ? AND patientId = ? AND createdAt > ? LIMIT 1'
  ).bind(clinicId, body.patientId, oneHourAgo).first()

  if (duplicate && !body.forceSave) {
    return c.json({ 
      error: 'Pasien ini baru saja diperiksa dalam 1 jam terakhir.',
      code: 'DUPLICATE_EXAMINATION',
      existingId: duplicate.id 
    }, 409)
  }

  const id = crypto.randomUUID()
  
  const patient: any = await c.env.DB.prepare('SELECT id FROM patients WHERE id = ? AND clinicId = ?').bind(body.patientId, clinicId).first()
  if (!patient) return c.json({ error: 'Pasien tidak ditemukan di klinik ini' }, 404)

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
medical.get('/visits', async (c) => {
  const clinicId = getClinicId(c)
  const patientId = c.req.query('patientId')
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM visits WHERE clinicId = ? AND patientId = ? ORDER BY date DESC'
  ).bind(clinicId, patientId).all()
  return c.json(results)
})

medical.post('/visits', async (c) => {
  const clinicId = getClinicId(c)
  const body = await c.req.json()
  const id = crypto.randomUUID()
  
  const patient: any = await c.env.DB.prepare('SELECT id FROM patients WHERE id = ? AND clinicId = ?').bind(body.patientId, clinicId).first()
  if (!patient) return c.json({ error: 'Pasien tidak ditemukan di klinik ini' }, 404)

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
medical.get('/notifications', async (c) => {
  const clinicId = getClinicId(c)
  const toRole = c.req.query('toRole')
  let query = 'SELECT * FROM notifications WHERE clinicId = ? AND isRead = 0'
  const params: any[] = [clinicId]

  if (toRole) {
    query += ' AND toRole = ?'
    params.push(toRole)
  }

  query += ' ORDER BY createdAt DESC LIMIT 20'

  const { results } = await c.env.DB.prepare(query).bind(...params).all()
  return c.json(results)
})

medical.put('/notifications/:id/read', async (c) => {
  const clinicId = getClinicId(c)
  const id = c.req.param('id')
  await c.env.DB.prepare(
    'UPDATE notifications SET isRead = 1 WHERE id = ? AND clinicId = ?'
  ).bind(id, clinicId).run()
  return c.json({ success: true })
})

medical.post('/notifications', async (c) => {
  const clinicId = getClinicId(c)
  const body = await c.req.json()
  const id = crypto.randomUUID()
  
  if (body.patientId) {
      const patient: any = await c.env.DB.prepare('SELECT id FROM patients WHERE id = ? AND clinicId = ?').bind(body.patientId, clinicId).first()
      if (!patient) return c.json({ error: 'Pasien tidak ditemukan di klinik ini' }, 404)
  }

  await c.env.DB.prepare(
    'INSERT INTO notifications (id, clinicId, type, patientId, patientName, message, toRole) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, clinicId, body.type, body.patientId, body.patientName, body.message, body.toRole).run()
  
  return c.json({ id })
})

export default medical
