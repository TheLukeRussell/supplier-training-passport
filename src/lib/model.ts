// Turns the flat export (one row per rep per training) into reps, trainings and
// a lookup of who was invited to and attended what. Everything else reads this.

import type { AttendanceRow, TrainingFormat } from '../data/types'

export interface Training {
  id: string
  supplier: string
  title: string
  date: string // YYYY-MM-DD
  format: TrainingFormat
}

export interface Rep {
  id: string // url-safe, from the email
  email: string
  name: string
  team: string
}

export interface Entry {
  invited: boolean
  attended: boolean
}

export interface Model {
  reps: Rep[] // sorted by name
  trainings: Training[] // sorted by date
  entries: Map<string, Entry>
}

const NOT_INVITED: Entry = { invited: false, attended: false }

const key = (email: string, trainingId: string) => `${email}|${trainingId}`

// The part before the @, lowercased, dots and anything odd turned into hyphens.
// jo.smith@example.com becomes jo-smith. Good enough for a shareable URL.
export function repIdFromEmail(email: string): string {
  return email
    .split('@')[0]
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function buildModel(rows: AttendanceRow[]): Model {
  const reps = new Map<string, Rep>()
  const trainings = new Map<string, Training>()
  const entries = new Map<string, Entry>()

  for (const row of rows) {
    const email = row.rep_email.trim().toLowerCase()
    if (!reps.has(email)) {
      reps.set(email, { id: repIdFromEmail(email), email, name: row.rep_name, team: row.team })
    }
    if (!trainings.has(row.training_id)) {
      trainings.set(row.training_id, {
        id: row.training_id,
        supplier: row.supplier,
        title: row.title,
        date: row.date,
        format: row.format,
      })
    }
    // Someone can't attend a training they weren't invited to, so attended
    // only counts when invited is true. Keeps a messy export from inflating rates.
    entries.set(key(email, row.training_id), {
      invited: Boolean(row.invited),
      attended: Boolean(row.invited) && Boolean(row.attended),
    })
  }

  return {
    reps: [...reps.values()].sort((a, b) => a.name.localeCompare(b.name)),
    trainings: [...trainings.values()].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id)),
    entries,
  }
}

export function entryFor(model: Model, rep: Rep, trainingId: string): Entry {
  return model.entries.get(key(rep.email, trainingId)) ?? NOT_INVITED
}

export function findRep(model: Model, repId: string): Rep | undefined {
  return model.reps.find((rep) => rep.id === repId)
}

// The demo's "record today's attendance". Returns a new model where the given
// reps attended the given training. Only invited reps can be marked.
export function withAttendance(model: Model, trainingId: string, emails: Iterable<string>): Model {
  const entries = new Map(model.entries)
  for (const email of emails) {
    const k = key(email, trainingId)
    const entry = entries.get(k)
    if (entry?.invited) entries.set(k, { invited: true, attended: true })
  }
  return { ...model, entries }
}
