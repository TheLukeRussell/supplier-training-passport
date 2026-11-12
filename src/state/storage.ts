// Demo changes survive a reload through localStorage. Some browsers block
// storage (private windows, locked-down work laptops) and throw on access,
// so every read and write is wrapped and the app just runs in memory instead.

import { STORAGE_KEY } from '../config'

export interface SavedDemo {
  viewAs?: string // rep id
  recorded?: { trainingId: string; emails: string[] }
}

export function readSaved(): { saved: SavedDemo; ok: boolean } {
  let raw: string | null
  try {
    raw = window.localStorage.getItem(STORAGE_KEY)
  } catch {
    // Only a read that throws means storage is blocked.
    return { saved: {}, ok: false }
  }
  if (!raw) return { saved: {}, ok: true }
  try {
    return { saved: clean(JSON.parse(raw)), ok: true }
  } catch {
    // Junk that won't parse. Start fresh; the next write replaces it.
    return { saved: {}, ok: true }
  }
}

// Keep only fields of the right shape. A half-written or hand-edited value
// used to crash the app on every load until the site data was cleared.
function clean(value: unknown): SavedDemo {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const { viewAs, recorded } = value as Record<string, unknown>
  const out: SavedDemo = {}
  if (typeof viewAs === 'string') out.viewAs = viewAs
  if (recorded && typeof recorded === 'object') {
    const { trainingId, emails } = recorded as Record<string, unknown>
    if (typeof trainingId === 'string' && Array.isArray(emails) && emails.every((e) => typeof e === 'string')) {
      out.recorded = { trainingId, emails }
    }
  }
  return out
}

export function writeSaved(saved: SavedDemo): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
    return true
  } catch {
    return false
  }
}
