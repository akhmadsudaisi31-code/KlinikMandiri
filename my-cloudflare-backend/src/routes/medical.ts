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
  const search = c.req.query('search') // Pencarian nama/RM server-side
  const page = parseInt(c.req.query('page') || '1')
  const pageSize = parseInt(c.req.query('pageSize') || '0') // 0 = no pagination (ambil semua)
  const activeDate = c.req.query('activeDate') // Untuk ExaminationList (Antrean / Riwayat)

  let query = 'SELECT id, rm, name, namaSuami, gender, category, address, occupation, dob, ageDisplay, nik, poli, allergies, keluhan, createdAt, updatedAt FROM patients WHERE clinicId = ?'
  const params: any[] = [clinicId]

  if (startDate && endDate) {
    query += ' AND createdAt >= ? AND createdAt <= ?'
    params.push(startDate, endDate)
  }

  // Server-side search untuk mendukung pencarian pada dataset besar
  if (search) {
    query += ' AND (LOWER(name) LIKE ? OR LOWER(rm) LIKE ?)'
    const searchPattern = `%${search.toLowerCase()}%`
    params.push(searchPattern, searchPattern)
  }

  // Filter antrean aktif & riwayat antrean berdasarkan tanggal
  if (activeDate) {
    const startIso = new Date(`${activeDate}T00:00:00+07:00`).toISOString()
    const endIso = new Date(`${activeDate}T23:59:59.999+07:00`).toISOString()
    
    // ARSITEKTUR HEMAT D1: Ganti klausa OR menjadi UNION agar SQLite dapat menggunakan
    // index idx_patients_clinic_poli dan idx_examinations_clinic_created secara langsung.
    // Menghilangkan scan 2.700 pasien per polling antrean!
    const unionQuery = `
      SELECT id, rm, name, namaSuami, gender, category, address, occupation, dob, ageDisplay, nik, poli, allergies, keluhan, createdAt, updatedAt
      FROM patients 
      WHERE clinicId = ? AND poli = 'Pemeriksaan'
      UNION
      SELECT p.id, p.rm, p.name, p.namaSuami, p.gender, p.category, p.address, p.occupation, p.dob, p.ageDisplay, p.nik, p.poli, p.allergies, p.keluhan, p.createdAt, p.updatedAt
      FROM examinations e
      JOIN patients p ON e.patientId = p.id AND p.clinicId = e.clinicId
      WHERE e.clinicId = ? AND e.createdAt >= ? AND e.createdAt <= ?
      ORDER BY createdAt DESC
    `
    const { results } = await c.env.DB.prepare(unionQuery).bind(clinicId, clinicId, startIso, endIso).all()
    return c.json(results)
  }

  // FIX KRITIS: Tidak lagi ada hard-limit LIMIT 1000 yang memotong pasien lama!
  // Pasien lama (RM kecil, createdAt lebih awal) sekarang selalu dikembalikan.
  query += ' ORDER BY createdAt DESC'

  if (pageSize > 0) {
    const offset = (page - 1) * pageSize
    query += ` LIMIT ${pageSize} OFFSET ${offset}`
  }
  
  const { results } = await c.env.DB.prepare(query).bind(...params).all()
  return c.json(results)
})

medical.get('/patients/count', async (c) => {
  const clinicId = getClinicId(c)
  const result: any = await c.env.DB.prepare('SELECT COUNT(*) as total FROM patients WHERE clinicId = ?').bind(clinicId).first()
  return c.json({ total: result?.total || 0 })
})

medical.get('/patients/next-rm', async (c) => {
  const clinicId = getClinicId(c)
  
  // ARSITEKTUR HEMAT D1: Baca langsung counter lastRmNumber dari clinic_settings (1 baris saja).
  // Jauh lebih cepat dan hemat dibanding memindai ribuan pasien dengan MAX(REPLACE(rm)).
  const settings: any = await c.env.DB.prepare(
    'SELECT lastRmNumber FROM clinic_settings WHERE clinicId = ?'
  ).bind(clinicId).first()

  let nextNum = 1
  if (settings && typeof settings.lastRmNumber === 'number' && settings.lastRmNumber > 0) {
    nextNum = settings.lastRmNumber + 1
  } else {
    // Fallback pertama kali jika setting belum terinisialisasi: cari max lalu simpan
    const maxResult: any = await c.env.DB.prepare(
      `SELECT MAX(CAST(REPLACE(REPLACE(rm, 'RM-', ''), '-', '') AS INTEGER)) as maxNum 
       FROM patients 
       WHERE clinicId = ? AND rm LIKE 'RM-%'`
    ).bind(clinicId).first()
    nextNum = (maxResult?.maxNum || 0) + 1
    
    // Inisialisasi ke clinic_settings untuk request berikutnya
    try {
      await c.env.DB.prepare(
        'UPDATE clinic_settings SET lastRmNumber = ? WHERE clinicId = ?'
      ).bind(maxResult?.maxNum || 0, clinicId).run()
    } catch(e) {}
  }

  const rm = `RM-${String(nextNum).padStart(4, '0')}`
  return c.json({ rm })
})

medical.get('/patients/:id', async (c) => {
  const clinicId = getClinicId(c)
  const id = c.req.param('id')
  const result = await c.env.DB.prepare(
    // EFISIENSI D1: kolom eksplisit, tidak lagi SELECT *
    'SELECT id, rm, name, namaSuami, gender, category, address, occupation, dob, ageYears, ageMonths, ageDisplay, nik, poli, allergies, keluhan, createdAt, updatedAt FROM patients WHERE id = ? AND clinicId = ?'
  ).bind(id, clinicId).first()
  return c.json(result)
})

medical.post('/patients', async (c) => {
  const clinicId = getClinicId(c)
  const body = await c.req.json()

  let finalRm = body.rm;
  let assignedNum: number | null = null;

  // --- CEK ATAU BUAT RM ---
  if (finalRm === 'AUTO') {
     // ARSITEKTUR HEMAT D1: Ambil nomor dari clinic_settings counter
     const settings: any = await c.env.DB.prepare(
       'SELECT lastRmNumber FROM clinic_settings WHERE clinicId = ?'
     ).bind(clinicId).first();

     let nextNum = 1;
     if (settings && typeof settings.lastRmNumber === 'number' && settings.lastRmNumber > 0) {
       nextNum = settings.lastRmNumber + 1;
     } else {
       const maxResult: any = await c.env.DB.prepare(
         `SELECT MAX(CAST(REPLACE(rm, 'RM-', '') AS INTEGER)) as maxNum 
          FROM patients 
          WHERE clinicId = ? AND rm LIKE 'RM-%'`
       ).bind(clinicId).first();
       nextNum = (maxResult?.maxNum || 0) + 1;
     }

     // Safety-net: pastikan RM yang dipilih benar-benar belum dipakai
     let success = false;
     let attempts = 0;
     while (!success && attempts < 20) {
         finalRm = `RM-${String(nextNum).padStart(4, '0')}`;
         const existing = await c.env.DB.prepare('SELECT id FROM patients WHERE clinicId = ? AND rm = ?').bind(clinicId, finalRm).first();
         if (!existing) {
             success = true;
             assignedNum = nextNum;
         } else {
             nextNum++;
             attempts++;
         }
     }
     if (!success) {
         return c.json({ error: 'Mohon maaf, sistem kesulitan membuat nomor RM otomatis. Silakan coba masukkan nomor secara manual.' }, 400);
     }
  }
  
  // --- CEK UNIK RM (Jika diisi manual) ---
  if (finalRm && finalRm !== '-' && body.rm !== 'AUTO') {
    const existing: any = await c.env.DB.prepare(
      'SELECT id FROM patients WHERE clinicId = ? AND rm = ?'
    ).bind(clinicId, finalRm).first()
    
    if (existing) {
      return c.json({ error: `Nomor RM ${finalRm} sudah digunakan oleh pasien lain di klinik ini.` }, 400)
    }
  }

  // --- CEK UNIK NAMA + DOB (Selalu cek untuk mencegah duplikasi di database) ---
  if (body.name && body.dob) {
    const existing: any = await c.env.DB.prepare(
      'SELECT id FROM patients WHERE clinicId = ? AND name = ? AND dob = ?'
    ).bind(clinicId, body.name, body.dob).first()

    if (existing) {
      return c.json({ error: `Pasien dengan nama "${body.name}" dan tanggal lahir yang sama sudah ada dalam data klinik.` }, 400)
    }
  }

  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  
  // Batch insert patient dan update lastRmNumber secara atomik jika ada auto-assigned number
  if (assignedNum) {
    await c.env.DB.batch([
      c.env.DB.prepare(
        `INSERT INTO patients (id, clinicId, rm, name, namaSuami, gender, category, address, occupation, dob, ageYears, ageMonths, ageDisplay, nik, poli, allergies, keluhan, createdBy, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        id, clinicId, finalRm, body.name, body.namaSuami || null, body.gender, body.category, 
        body.address, body.occupation || null, body.dob, body.ageYears, body.ageMonths, body.ageDisplay, body.nik || null, body.poli, body.allergies || null, body.keluhan || null, clinicId, now, now
      ),
      c.env.DB.prepare(
        'UPDATE clinic_settings SET lastRmNumber = MAX(COALESCE(lastRmNumber, 0), ?) WHERE clinicId = ?'
      ).bind(assignedNum, clinicId)
    ])
  } else {
    await c.env.DB.prepare(
      `INSERT INTO patients (id, clinicId, rm, name, namaSuami, gender, category, address, occupation, dob, ageYears, ageMonths, ageDisplay, nik, poli, allergies, keluhan, createdBy, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id, clinicId, finalRm, body.name, body.namaSuami || null, body.gender, body.category, 
      body.address, body.occupation || null, body.dob, body.ageYears, body.ageMonths, body.ageDisplay, body.nik || null, body.poli, body.allergies || null, body.keluhan || null, clinicId, now, now
    ).run()
  }
  
  return c.json({ id })
})

medical.put('/patients/:id', async (c) => {
  const clinicId = getClinicId(c)
  const id = c.req.param('id')
  const body = await c.req.json()
  
  const updates: string[] = []
  const values: any[] = []

  const allowedFields = [
    'name', 'namaSuami', 'gender', 'category', 'address', 'occupation', 'dob',
    'ageYears', 'ageMonths', 'ageDisplay', 'nik', 'poli', 'allergies', 'keluhan', 'updatedAt'
  ]

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates.push(`${field} = ?`)
      values.push(body[field])
    }
  }

  if (updates.length > 0) {
    if (body.updatedAt === undefined) {
      updates.push(`updatedAt = ?`)
      values.push(new Date().toISOString())
    }

    const query = `UPDATE patients SET ${updates.join(', ')} WHERE id = ? AND clinicId = ?`
    values.push(id, clinicId)

    await c.env.DB.prepare(query).bind(...values).run()
  }
  
  return c.json({ success: true })
})

medical.delete('/patients/:id', async (c) => {
  const clinicId = getClinicId(c)
  const id = c.req.param('id')

  const patient: any = await c.env.DB.prepare(
    'SELECT id FROM patients WHERE id = ? AND clinicId = ?'
  ).bind(id, clinicId).first()

  if (!patient) return c.json({ error: 'Data pasien tidak ditemukan atau sudah dihapus.' }, 404)

  await c.env.DB.batch(getPatientDeleteStatements(c.env.DB, id, clinicId))
  return c.json({ success: true })
})

// --- MEDICINES ---
medical.get('/medicines', async (c) => {
  const clinicId = getClinicId(c)
  const { results } = await c.env.DB.prepare(
    'SELECT id, name, unit, price, createdAt FROM medicines WHERE clinicId = ? ORDER BY name ASC LIMIT 1000'
  ).bind(clinicId).all()
  return c.json(results)
})

medical.get('/medicines/count', async (c) => {
  const clinicId = getClinicId(c)
  const result: any = await c.env.DB.prepare('SELECT COUNT(*) as total FROM medicines WHERE clinicId = ?').bind(clinicId).first()
  return c.json({ total: result?.total || 0 })
})

medical.get('/medicines/:id', async (c) => {
  const clinicId = getClinicId(c)
  const id = c.req.param('id')
  const result = await c.env.DB.prepare(
    'SELECT * FROM medicines WHERE id = ? AND clinicId = ?'
  ).bind(id, clinicId).first()
  
  if (!result) return c.json({ error: 'Data obat tidak ditemukan atau sudah dihapus.' }, 404)
  return c.json(result)
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

medical.put('/medicines/:id', async (c) => {
  const clinicId = getClinicId(c)
  const id = c.req.param('id')
  const body = await c.req.json()
  
  await c.env.DB.prepare(
    'UPDATE medicines SET name = ?, unit = ?, price = ?, updatedAt = ? WHERE id = ? AND clinicId = ?'
  ).bind(body.name, body.unit, body.price || 0, new Date().toISOString(), id, clinicId).run()
  
  return c.json({ success: true })
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
  
  // Format WIB boundaries (UTC+7) manually to ensure strictly 'today' in local time
  const now = new Date()
  const wibTimeStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(now)
  
  const startIso = new Date(`${wibTimeStr}T00:00:00+07:00`).toISOString()
  const endIso = new Date(`${wibTimeStr}T23:59:59.999+07:00`).toISOString()
  
  const { results } = await c.env.DB.prepare(
    `SELECT id, patientId, patientName, patientRm, diagnosa, biaya, tindakan,
            keluhanUtama, medicines_json, createdAt, date, updatedAt
     FROM examinations 
     WHERE clinicId = ? AND createdAt >= ? AND createdAt <= ? 
     ORDER BY createdAt DESC`
  ).bind(clinicId, startIso, endIso).all()
  
  const formatted = results.map((r: any) => ({
    ...r,
    medicines: JSON.parse(r.medicines_json || '[]')
  }))
  
  return c.json(formatted)
})

medical.get('/examinations/today/count', async (c) => {
  const clinicId = getClinicId(c)
  const now = new Date()
  const wibTimeStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(now)
  const startIso = new Date(`${wibTimeStr}T00:00:00+07:00`).toISOString()
  const endIso = new Date(`${wibTimeStr}T23:59:59.999+07:00`).toISOString()
  
  const result: any = await c.env.DB.prepare(
    "SELECT COUNT(*) as total FROM examinations WHERE clinicId = ? AND createdAt >= ? AND createdAt <= ?"
  ).bind(clinicId, startIso, endIso).first()
  
  return c.json({ total: result?.total || 0 })
})

medical.get('/examinations', async (c) => {
  const clinicId = getClinicId(c)
  const patientId = c.req.query('patientId')
  const startDate = c.req.query('startDate')
  const endDate = c.req.query('endDate')
  // EFISIENSI D1: filter kategori di server (ANC/Persalinan), bukan di client
  const category = c.req.query('category') // 'anc' | 'persalinan' | kosong = semua
  
  let query = `
    SELECT examinations.id, examinations.clinicId, examinations.patientId, examinations.patientName,
           examinations.patientRm, examinations.diagnosa, examinations.icd10, examinations.biaya,
           examinations.tindakan, examinations.edukasi, examinations.rencanaTindakLanjut,
           examinations.keluhanUtama, examinations.medicines_json, examinations.extendedData_json,
           examinations.createdAt, examinations.date, examinations.updatedAt,
           patients.namaSuami, patients.ageDisplay, patients.address, patients.occupation 
    FROM examinations 
    LEFT JOIN patients ON examinations.patientId = patients.id AND patients.clinicId = examinations.clinicId 
    WHERE examinations.clinicId = ?
  `
  let params: any[] = [clinicId]
  
  if (patientId) {
    query += ' AND examinations.patientId = ?'
    params.push(patientId)
  }

  // Filter menggunakan createdAt langsung agar index idx_examinations_clinic_created aktif
  // (COALESCE di WHERE/ORDER BY akan menonaktifkan index SQLite)
  if (startDate && endDate) {
    query += ' AND examinations.createdAt >= ? AND examinations.createdAt <= ?'
    params.push(startDate, endDate)
  }

  // Filter kategori di sisi server agar tidak mengirim semua data ke client
  if (category === 'anc') {
    query += ` AND (examinations.extendedData_json LIKE '%"category":"Bumil"%' OR examinations.extendedData_json LIKE '%"hpht"%' OR examinations.extendedData_json LIKE '%"lila"%')`
  } else if (category === 'persalinan') {
    query += ` AND (examinations.extendedData_json LIKE '%"category":"Persalinan"%' OR examinations.extendedData_json LIKE '%"isPersalinan":true%')`
  }
  
  // ORDER BY menggunakan kolom yang sudah ada index-nya
  query += ' ORDER BY examinations.createdAt DESC'
  
  const { results } = await c.env.DB.prepare(query).bind(...params).all()
  
  const formatted = results.map((r: any) => ({
    ...r,
    // Tampilkan date: pakai kolom date jika ada, fallback ke createdAt (untuk display saja, bukan filter)
    date: r.date || r.createdAt,
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
  
  if (!result) return c.json({ error: 'Data pemeriksaan tidak ditemukan atau sudah dihapus.' }, 404)
  
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

medical.delete('/examinations/:id', async (c) => {
  const clinicId = getClinicId(c)
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM examinations WHERE id = ? AND clinicId = ?').bind(id, clinicId).run()
  return c.json({ success: true })
})


medical.post('/examinations', async (c) => {
  const clinicId = getClinicId(c)
  const body = await c.req.json()

  // --- CEK IDEMPOTENCY (Mencegah Double-Submit Tidak Sengaja) ---
  // Hanya cegah duplikasi dalam 3 MENIT terakhir (bukan 1 jam).
  // Ini cukup untuk mencegah double-click tanpa mengganggu workflow normal dokter.
  const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString()
  const duplicate: any = await c.env.DB.prepare(
    'SELECT id FROM examinations WHERE clinicId = ? AND patientId = ? AND createdAt > ? LIMIT 1'
  ).bind(clinicId, body.patientId, threeMinutesAgo).first()

  if (duplicate && !body.forceSave) {
    return c.json({ 
      error: 'Data pasien ini baru saja disimpan dalam 3 menit terakhir. Klik simpan sekali lagi jika Anda ingin tetap menyimpannya sebagai kunjungan baru.',
      code: 'DUPLICATE_EXAMINATION',
      existingId: duplicate.id 
    }, 409)
  }

  const id = crypto.randomUUID()
  const nowISO = new Date().toISOString()
  
  const patient: any = await c.env.DB.prepare('SELECT id FROM patients WHERE id = ? AND clinicId = ?').bind(body.patientId, clinicId).first()
  if (!patient) return c.json({ error: 'Mohon maaf, data pasien tidak ditemukan dalam sistem klinik.' }, 404)

  await c.env.DB.prepare(
    `INSERT INTO examinations (id, clinicId, patientId, patientName, patientRm, keluhanUtama, riwayatPenyakitSekarang, tensi, nadi, suhu, respirasi, bb, tb, spo2, pemeriksaanFisik, diagnosa, icd10, medicines_json, tindakan, edukasi, rencanaTindakLanjut, biaya, extendedData_json, createdBy, date, createdAt) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id, clinicId, body.patientId, body.patientName, body.patientRm, body.keluhanUtama, body.riwayatPenyakitSekarang,
    body.tensi, body.nadi, body.suhu, body.respirasi, body.bb, body.tb, body.spo2, body.pemeriksaanFisik,
    body.diagnosa, body.icd10, JSON.stringify(body.medicines || []), body.tindakan, body.edukasi,
    body.rencanaTindakLanjut, body.biaya, body.extendedData_json, clinicId, nowISO, nowISO
  ).run()

  // Clear keluhan in patient master data so it doesn't persist for the next visit
  await c.env.DB.prepare(
    'UPDATE patients SET keluhan = NULL WHERE id = ? AND clinicId = ?'
  ).bind(body.patientId, clinicId).run()
  
  return c.json({ id })
})

// --- VISITS ---
medical.get('/visits', async (c) => {
  const clinicId = getClinicId(c)
  const patientId = c.req.query('patientId')
  const { results } = await c.env.DB.prepare(
    // EFISIENSI D1: kolom eksplisit
    'SELECT id, diagnosis, therapy, notes, cost, date, createdAt, updatedAt FROM visits WHERE clinicId = ? AND patientId = ? ORDER BY date DESC'
  ).bind(clinicId, patientId).all()
  return c.json(results)
})

medical.post('/visits', async (c) => {
  const clinicId = getClinicId(c)
  const body = await c.req.json()
  const id = crypto.randomUUID()
  
  const patient: any = await c.env.DB.prepare('SELECT id FROM patients WHERE id = ? AND clinicId = ?').bind(body.patientId, clinicId).first()
  if (!patient) return c.json({ error: 'Mohon maaf, data pasien tidak ditemukan dalam sistem klinik.' }, 404)

  await c.env.DB.prepare(
    `INSERT INTO visits (id, clinicId, patientId, patientName, patientRm, diagnosis, therapy, notes, cost, createdBy) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id, clinicId, body.patientId, body.patientName, body.patientRm, 
    body.diagnosis, body.therapy, body.notes, body.cost, clinicId
  ).run()
  
  return c.json({ id })
})

medical.put('/visits/:id', async (c) => {
  const clinicId = getClinicId(c)
  const id = c.req.param('id')
  const body = await c.req.json()
  
  await c.env.DB.prepare(
    'UPDATE visits SET diagnosis = ?, therapy = ?, notes = ?, cost = ?, updatedAt = ? WHERE id = ? AND clinicId = ?'
  ).bind(body.diagnosis, body.therapy, body.notes, body.cost, new Date().toISOString(), id, clinicId).run()
  
  return c.json({ success: true })
})

medical.delete('/visits/:id', async (c) => {
  const clinicId = getClinicId(c)
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM visits WHERE id = ? AND clinicId = ?').bind(id, clinicId).run()
  return c.json({ success: true })
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
      if (!patient) return c.json({ error: 'Mohon maaf, data pasien tidak ditemukan dalam sistem klinik.' }, 404)
  }

  await c.env.DB.prepare(
    'INSERT INTO notifications (id, clinicId, type, patientId, patientName, message, toRole) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, clinicId, body.type, body.patientId, body.patientName, body.message, body.toRole).run()
  
  return c.json({ id })
})

medical.get('/stats/advanced', async (c) => {
  const clinicId = getClinicId(c)
  
  // 1. Monthly Revenue (Last 6 Months)
  const revenueQuery = `
    SELECT strftime('%Y-%m', createdAt) as month, SUM(biaya) as total 
    FROM examinations 
    WHERE clinicId = ? 
    AND createdAt >= date('now', '-6 months')
    GROUP BY month 
    ORDER BY month ASC
  `
  const revenue = await c.env.DB.prepare(revenueQuery).bind(clinicId).all()

  // 2. Top 5 Diagnoses
  const diagnosesQuery = `
    SELECT icd10, diagnosa, COUNT(*) as count 
    FROM examinations 
    WHERE clinicId = ? AND icd10 IS NOT NULL 
    GROUP BY icd10, diagnosa 
    ORDER BY count DESC LIMIT 5
  `
  const diagnoses = await c.env.DB.prepare(diagnosesQuery).bind(clinicId).all()

  // 3. Gender Distribution
  const genderQuery = `
    SELECT gender, COUNT(*) as count 
    FROM patients 
    WHERE clinicId = ? 
    GROUP BY gender
  `
  const gender = await c.env.DB.prepare(genderQuery).bind(clinicId).all()

  return c.json({
    revenue: revenue.results,
    diagnoses: diagnoses.results,
    gender: gender.results
  })
})

// ARSITEKTUR HEMAT D1: Endpoint gabungan 4-in-1 untuk Dashboard
// Menghilangkan 4 network roundtrip dan mengeksekusi dalam 1 batch D1 terpadu
medical.get('/dashboard/stats', async (c) => {
  const clinicId = getClinicId(c)
  const now = new Date()
  const wibTimeStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(now)
  const startIso = new Date(`${wibTimeStr}T00:00:00+07:00`).toISOString()
  const endIso = new Date(`${wibTimeStr}T23:59:59.999+07:00`).toISOString()

  try {
    const [patientsRes, examsRes, medicinesRes, broadcastRes] = await c.env.DB.batch([
      c.env.DB.prepare('SELECT COUNT(*) as total FROM patients WHERE clinicId = ?').bind(clinicId),
      c.env.DB.prepare('SELECT COUNT(*) as total FROM examinations WHERE clinicId = ? AND createdAt >= ? AND createdAt <= ?').bind(clinicId, startIso, endIso),
      c.env.DB.prepare('SELECT COUNT(*) as total FROM medicines WHERE clinicId = ?').bind(clinicId),
      c.env.DB.prepare('SELECT message FROM broadcasts ORDER BY createdAt DESC LIMIT 1')
    ])

    const totalPatients = (patientsRes.results?.[0] as any)?.total || 0
    const todayExaminations = (examsRes.results?.[0] as any)?.total || 0
    const medicineStock = (medicinesRes.results?.[0] as any)?.total || 0
    const announcement = (broadcastRes.results?.[0] as any)?.message || null

    return c.json({
      totalPatients,
      todayExaminations,
      medicineStock,
      announcement
    })
  } catch (err: any) {
    console.error("Dashboard stats error:", err)
    return c.json({ totalPatients: 0, todayExaminations: 0, medicineStock: 0, announcement: null })
  }
})

export default medical
