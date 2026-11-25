import { useEffect, useState } from 'preact/hooks'
import type { Item } from '../shared/schemas'
import { api } from './api'

/** Wandelt abgefangene Fehler in eine verständliche deutsche Meldung um. */
function formatError(err: unknown): string {
  if (err instanceof TypeError) {
    return 'Server nicht erreichbar. Bitte prüfe, ob das Backend läuft.'
  }
  if (err instanceof Error && err.message) {
    return err.message
  }
  return 'Ein unbekannter Fehler ist aufgetreten.'
}

export function App() {
  const [items, setItems] = useState<Item[]>([])
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api
      .list()
      .then(setItems)
      .catch((err: unknown) => setError(formatError(err)))
      .finally(() => setLoading(false))
  }, [])

  async function handleAdd(e: Event) {
    e.preventDefault()
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setError('Bitte gib einen Titel für den neuen Eintrag ein.')
      return
    }

    setError('')
    setSubmitting(true)
    try {
      const created = await api.create({
        title: trimmedTitle,
        category: category.trim() || 'Allgemein',
        note: '',
      })
      setItems((prev) => [...prev, created])
      setTitle('')
      setCategory('')
    } catch (err: unknown) {
      setError(formatError(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggle(item: Item) {
    setError('')
    try {
      const updated = await api.update(item.id, { done: !item.done })
      setItems((prev) => prev.map((entry) => (entry.id === item.id ? updated : entry)))
    } catch (err: unknown) {
      setError(formatError(err))
    }
  }

  async function handleDelete(id: number) {
    setError('')
    try {
      await api.remove(id)
      setItems((prev) => prev.filter((entry) => entry.id !== id))
    } catch (err: unknown) {
      setError(formatError(err))
    }
  }

  const doneCount = items.filter((item) => item.done).length

  return (
    <div class="min-h-screen bg-slate-50 text-slate-900">
      <main class="mx-auto max-w-2xl px-4 py-6 sm:p-6">
        <header class="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="h-6 w-6"
                aria-hidden="true"
              >
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
            <div>
              <h1 class="text-2xl font-bold text-brand sm:text-3xl">Projekt-Checkliste</h1>
              <p class="text-sm text-slate-600">
                Aufgaben anlegen, abhaken und verwalten.
              </p>
            </div>
          </div>

          <span class="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
            {doneCount} von {items.length} erledigt
          </span>
        </header>

        <form
          onSubmit={handleAdd}
          noValidate
          class="mb-6 flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row"
        >
          <input
            type="text"
            aria-label="Titel"
            placeholder="Neuer Eintrag (z. B. Tests schreiben)"
            maxLength={80}
            value={title}
            onInput={(e) => {
              setTitle((e.target as HTMLInputElement).value)
              if (error) setError('')
            }}
            class="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
          <input
            type="text"
            aria-label="Kategorie"
            placeholder="Kategorie (z. B. Frontend)"
            maxLength={40}
            value={category}
            onInput={(e) => setCategory((e.target as HTMLInputElement).value)}
            class="min-w-0 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 sm:w-44"
          />
          <button
            type="submit"
            disabled={submitting}
            class="inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Hinzufügen
          </button>
        </form>

        {error && (
          <div
            role="alert"
            class="mb-4 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
          >
            <div class="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="h-4 w-4 shrink-0"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError('')}
              aria-label="Fehlermeldung schließen"
              class="cursor-pointer rounded px-1.5 py-0.5 text-xs font-semibold text-red-700 hover:bg-red-100"
            >
              ✕
            </button>
          </div>
        )}

        {loading ? (
          <p class="py-8 text-center text-sm text-slate-500">Einträge werden geladen …</p>
        ) : items.length === 0 ? (
          <div class="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            Noch keine Einträge vorhanden. Lege oben deinen ersten Eintrag an!
          </div>
        ) : (
          <ul class="space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                class={`flex items-start justify-between gap-3 rounded-xl border border-slate-200 p-4 shadow-sm transition ${
                  item.done ? 'bg-slate-100/70' : 'bg-white'
                }`}
              >
                <label class="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => handleToggle(item)}
                    aria-label={`${item.title} als erledigt markieren`}
                    class="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded accent-brand"
                  />
                  <div class="min-w-0 flex-1">
                    <span class="inline-block rounded bg-brand/10 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-brand">
                      {item.category}
                    </span>
                    <h2
                      class={`mt-1 break-words font-semibold ${
                        item.done ? 'text-slate-400 line-through' : 'text-slate-900'
                      }`}
                    >
                      {item.title}
                    </h2>
                    {item.note && (
                      <p
                        class={`mt-0.5 break-words text-sm ${
                          item.done ? 'text-slate-400' : 'text-slate-600'
                        }`}
                      >
                        {item.note}
                      </p>
                    )}
                  </div>
                </label>

                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  aria-label={`${item.title} löschen`}
                  class="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="h-3.5 w-3.5"
                    aria-hidden="true"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                  <span class="hidden sm:inline">Löschen</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
