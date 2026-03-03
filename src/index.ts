import { Hono } from 'hono'
import { cors } from 'hono/cors'

// Binding D1 Cloudflare
type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

// Agar frontend bisa nge-hit API ini
app.use('*', cors()) 

app.get('/api/patients', async (c) => {
  // Anda akan menyematkan otorisasi (JWT) untuk mem-filter berdasarkan clinicId
  // Dummy query select
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM patients ORDER BY createdAt DESC"
  ).all()
  
  return c.json(results)
})

export default app
