import { Hono } from 'hono'
import { itemInput, itemPatch } from '../shared/schemas'
import type { Store } from './store'

// Die App wird als Funktion gebaut, damit Tests sie mit einem Test-Store starten können.
export function createApp(store: Store) {
  const app = new Hono()

  app.get('/api/health', (c) => c.json({ status: 'ok' }))

  app.get('/api/items', async (c) => c.json(await store.list()))

  // POST /api/items -> Eintrag anlegen (Zod-Validierung, Status 201)
  app.post('/api/items', async (c) => {
    const parsed = itemInput.safeParse(await c.req.json().catch(() => null))
    if (!parsed.success) {
      return c.json({ error: 'Ungültige Eingabe', details: parsed.error.issues }, 400)
    }
    const item = await store.create(parsed.data)
    return c.json(item, 201)
  })

  // PATCH /api/items/:id -> Eintrag ändern (Zod-Validierung, Status 200 oder 404)
  app.patch('/api/items/:id', async (c) => {
    const id = Number(c.req.param('id'))
    if (Number.isNaN(id)) {
      return c.json({ error: 'Ungültige ID' }, 400)
    }
    const parsed = itemPatch.safeParse(await c.req.json().catch(() => null))
    if (!parsed.success) {
      return c.json({ error: 'Ungültige Eingabe', details: parsed.error.issues }, 400)
    }
    const item = await store.update(id, parsed.data)
    if (!item) {
      return c.json({ error: 'Eintrag nicht gefunden' }, 404)
    }
    return c.json(item, 200)
  })

  // DELETE /api/items/:id -> Eintrag löschen (Status 204 oder 404)
  app.delete('/api/items/:id', async (c) => {
    const id = Number(c.req.param('id'))
    if (Number.isNaN(id)) {
      return c.json({ error: 'Ungültige ID' }, 400)
    }
    const deleted = await store.remove(id)
    if (!deleted) {
      return c.json({ error: 'Eintrag nicht gefunden' }, 404)
    }
    return c.body(null, 204)
  })

  return app
}
