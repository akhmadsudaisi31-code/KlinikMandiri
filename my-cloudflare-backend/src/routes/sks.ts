import { Hono } from 'hono'
// No external uuid package needed, Cloudflare Workers have crypto.randomUUID()

type Bindings = {
  DB: D1Database
}

const sks = new Hono<{ Bindings: Bindings }>()

const getClinicId = (c: any) => c.get('jwtPayload').uid

// Get all SKS records for the clinic
sks.get('/', async (c) => {
  const clinicId = getClinicId(c)
  
  const results = await c.env.DB.prepare(
    // EFISIENSI D1: kolom eksplisit + LIMIT 200, tidak lagi SELECT * tanpa batas
    'SELECT id, patientName, patientRm, diagnosis, occupation, address, startDate, endDate, days, ticketNumber, createdAt FROM sks_records WHERE clinicId = ? ORDER BY createdAt DESC LIMIT 200'
  ).bind(clinicId).all()
  
  return c.json(results.results)
})

// Create a new SKS record
sks.post('/', async (c) => {
  const clinicId = getClinicId(c)
  const body = await c.req.json()
  
  const id = crypto.randomUUID()
  
  await c.env.DB.prepare(
    `INSERT INTO sks_records (
      id, clinicId, patientId, patientName, patientRm, 
      diagnosis, occupation, address, startDate, endDate, 
      days, ticketNumber
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id,
    clinicId,
    body.patientId,
    body.patientName,
    body.patientRm,
    body.diagnosis,
    body.occupation,
    body.address,
    body.startDate,
    body.endDate,
    body.days,
    body.ticketNumber
  ).run()
  
  return c.json({ id, success: true })
})

// Update an SKS record
sks.put('/:id', async (c) => {
  const clinicId = getClinicId(c)
  const id = c.req.param('id')
  const body = await c.req.json()
  
  await c.env.DB.prepare(
    `UPDATE sks_records SET 
      diagnosis = ?, occupation = ?, address = ?, 
      startDate = ?, endDate = ?, days = ?, ticketNumber = ?
     WHERE id = ? AND clinicId = ?`
  ).bind(
    body.diagnosis,
    body.occupation,
    body.address,
    body.startDate,
    body.endDate,
    body.days,
    body.ticketNumber,
    id,
    clinicId
  ).run()
  
  return c.json({ success: true })
})

// Delete an SKS record
sks.delete('/:id', async (c) => {
  const clinicId = getClinicId(c)
  const id = c.req.param('id')
  
  await c.env.DB.prepare(
    'DELETE FROM sks_records WHERE id = ? AND clinicId = ?'
  ).bind(id, clinicId).run()
  
  return c.json({ success: true })
})

export default sks
