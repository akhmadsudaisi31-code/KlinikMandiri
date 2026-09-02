import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
}

const errorLogs = new Hono<{ Bindings: Bindings }>()

/**
 * POST /api/errors
 * Endpoint terbuka (tidak butuh auth) untuk menerima laporan error dari frontend.
 * Data disimpan ke tabel error_logs di D1.
 *
 * Body:
 *   clinicId, userId, userEmail, url, errorMessage,
 *   errorStack, componentStack, buildVersion, userAgent
 */
errorLogs.post('/errors', async (c) => {
  try {
    const body = await c.req.json()
    const errMsg = body.errorMessage || ''
    
    // Jangan catat error D1 limit ke database agar tidak membuang write rows
    if (errMsg.includes("exceeded D1's free tier daily row read limit") || errMsg.includes("D1_ERROR")) {
      return c.json({ ok: true, skipped: true })
    }

    const id = crypto.randomUUID()
    const createdAt = new Date().toISOString()

    await c.env.DB.prepare(
      `INSERT INTO error_logs 
         (id, clinicId, userId, userEmail, url, errorMessage, errorStack, componentStack, buildVersion, userAgent, metadata, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      body.clinicId || 'unknown',
      body.userId || null,
      body.userEmail || null,
      body.url || null,
      (body.errorMessage || '').substring(0, 2000),
      (body.errorStack || '').substring(0, 5000),
      (body.componentStack || '').substring(0, 3000),
      body.buildVersion || null,
      (body.userAgent || '').substring(0, 500),
      body.metadata || null,
      createdAt
    ).run()

    return c.json({ ok: true, id })
  } catch (e: any) {
    // Jangan biarkan error logger sendiri menyebabkan error ke client
    console.error('error_logs INSERT failed:', e?.message)
    return c.json({ ok: false }, 200)
  }
})

/**
 * GET /api/errors?page=1&limit=20&clinicId=xxx
 * Hanya bisa diakses oleh Super Admin (isAdmin = 1).
 * Mengembalikan daftar error terbaru dengan pagination.
 */
errorLogs.get('/errors', async (c) => {
  const jwtPayload = c.get('jwtPayload') as any
  if (!jwtPayload || !jwtPayload.isAdmin) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const page = Math.max(Number(c.req.query('page') || 1), 1)
  const limit = Math.max(Number(c.req.query('limit') || 20), 1)
  const offset = (page - 1) * limit
  const clinicId = c.req.query('clinicId') || null

  let query = 'SELECT * FROM error_logs'
  let countQuery = 'SELECT COUNT(*) as total FROM error_logs'
  const params: any[] = []

  if (clinicId) {
    query += ' WHERE clinicId = ?'
    countQuery += ' WHERE clinicId = ?'
    params.push(clinicId)
  }

  query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?'
  
  const totalRes: any = await c.env.DB.prepare(countQuery).bind(...params).first()
  const { results } = await c.env.DB.prepare(query).bind(...params, limit, offset).all()
  
  return c.json({
    data: results,
    pagination: {
        total: totalRes?.total || 0,
        page,
        limit,
        totalPages: Math.ceil((totalRes?.total || 0) / limit)
    }
  })
})

/**
 * DELETE /api/errors/clear-all
 * Hapus SEMUA log error.
 */
errorLogs.delete('/errors/clear-all', async (c) => {
  const jwtPayload = c.get('jwtPayload') as any
  if (!jwtPayload || !jwtPayload.isAdmin) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  await c.env.DB.prepare('DELETE FROM error_logs').run()
  return c.json({ success: true })
})

/**
 * DELETE /api/errors/:id
 * Hapus log error spesifik.
 */
errorLogs.delete('/errors/:id', async (c) => {
  const jwtPayload = c.get('jwtPayload') as any
  if (!jwtPayload || !jwtPayload.isAdmin) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM error_logs WHERE id = ?').bind(id).run()
  
  return c.json({ success: true })
})

/**
 * DELETE /api/errors/cleanup
 * Hapus log error lebih dari 30 hari.
 */
errorLogs.delete('/errors/cleanup', async (c) => {
  const jwtPayload = c.get('jwtPayload') as any
  if (!jwtPayload || !jwtPayload.isAdmin) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const result = await c.env.DB.prepare(
    'DELETE FROM error_logs WHERE createdAt < ?'
  ).bind(thirtyDaysAgo).run()

  return c.json({ deleted: result.meta?.changes || 0 })
})

export default errorLogs
