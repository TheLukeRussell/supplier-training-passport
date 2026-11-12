// The one place that knows where attendance data comes from. Today it's a
// static JSON file next to the app. To use a real API later, change this file
// and nothing else: the UI only ever sees AttendanceRow[].

import type { AttendanceRow } from './types'

const DATA_PATH = 'data/attendance.json'

// BASE_URL is "/" in dev and "/supplier-training-passport/" on Pages, so the
// same relative path works in both.
export const dataUrl = `${import.meta.env.BASE_URL}${DATA_PATH}`

export class DataError extends Error {}

// Exports love to send "TRUE", "yes" or 1 instead of true. Accept the usual
// suspects so a spreadsheet export doesn't zero out everybody's rate.
function toBool(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  return ['true', 'yes', 'y', '1', 'x'].includes(String(value).trim().toLowerCase())
}

function toRow(raw: Record<string, unknown>): AttendanceRow {
  const format = String(raw.format ?? '').toLowerCase().includes('person') ? 'in person' : 'virtual'
  return {
    rep_email: String(raw.rep_email ?? '').trim(),
    rep_name: String(raw.rep_name ?? '').trim(),
    team: String(raw.team ?? '').trim(),
    training_id: String(raw.training_id ?? '').trim(),
    supplier: String(raw.supplier ?? '').trim(),
    title: String(raw.title ?? '').trim(),
    date: String(raw.date ?? '').slice(0, 10),
    format,
    invited: toBool(raw.invited),
    attended: toBool(raw.attended),
  }
}

export async function loadAttendance(signal?: AbortSignal): Promise<AttendanceRow[]> {
  let response: Response
  try {
    response = await fetch(dataUrl, { signal, cache: 'no-cache' })
  } catch (error) {
    if (signal?.aborted) throw error
    throw new DataError("The attendance file didn't come back. Check the connection and try again.")
  }
  if (!response.ok) {
    throw new DataError(`The server answered ${response.status} when asked for ${DATA_PATH}.`)
  }
  let body: unknown
  try {
    body = await response.json()
  } catch {
    throw new DataError(`${DATA_PATH} isn't valid JSON, so there's nothing to show.`)
  }
  if (!Array.isArray(body)) throw new DataError(`${DATA_PATH} should be a list of rows.`)
  return body
    .filter((raw): raw is Record<string, unknown> => typeof raw === 'object' && raw !== null)
    .map(toRow)
    .filter((row) => row.rep_email && row.training_id && /^\d{4}-\d{2}-\d{2}$/.test(row.date))
}
