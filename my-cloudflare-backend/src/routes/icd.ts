import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
}

const icd = new Hono<{ Bindings: Bindings }>()

icd.get('/search', async (c) => {
    const source = c.req.query('source') || 'who_icd10_2019'
    const q = c.req.query('q') || ''
    const limit = parseInt(c.req.query('limit') || '12')
    
    // Optimized search: prefix match on code OR partial match on title
    let query = 'SELECT code, title FROM icd_codes WHERE source = ?'
    let params: any[] = [source]
    
    if (q) {
        query += ' AND (code LIKE ? OR title LIKE ?)'
        params.push(`${q}%`, `%${q}%`)
    }
    
    query += ' ORDER BY code ASC LIMIT ?'
    params.push(limit)
    
    try {
        const { results } = await c.env.DB.prepare(query).bind(...params).all()
        return c.json(results)
    } catch (e: any) {
        console.error("ICD Search Error:", e)
        return c.json({ error: 'Gagal mencari referensi ICD', message: e.message }, 500)
    }
})

export default icd
