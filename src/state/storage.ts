// Demo changes survive a reload through localStorage. Some browsers block
// storage (private windows, locked-down work laptops) and throw on access,
// so every read and write is wrapped and the app just runs in memory instead.

import { STORAGE_KEY } from '../config'

export interface SavedDemo {
  viewAs?: string // rep id
  recorded?: { trainingId: string; emails: string[] }
}

export function readSaved(): { saved: SavedDemo; ok: boolean } {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { saved: {}, ok: true }
    const parsed = JSON.parse(raw)
    return { saved: typeof parsed === 'object' && parsed ? parsed : {}, ok: true }
  } catch {
    return { saved: {}, ok: false }
  }
}

export function writeSaved(saved: SavedDemo): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
    return true
  } catch {
    return false
  }
}
