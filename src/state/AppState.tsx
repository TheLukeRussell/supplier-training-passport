// App-wide state: loads the data, layers the demo's changes on top, and hands
// the passport and standings everything they need. Screens read it with useApp().

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DEMO_SEED, DEMO_TODAY, DEMO_TODAY_SHARE, LINE } from '../config'
import { DataError, loadAttendance } from '../data/source'
import type { AttendanceRow } from '../data/types'
import { pickDefaultRep, pickTodayAttendees } from '../lib/demo'
import { buildModel, findRep, withAttendance, type Model, type Rep, type Training } from '../lib/model'
import { standings, type StandingRow } from '../lib/ranking'
import type { Context } from '../lib/rules'
import { readSaved, writeSaved, type SavedDemo } from './storage'

export type LoadStatus = 'loading' | 'error' | 'empty' | 'ready'
export type Preview = 'live' | 'loading' | 'empty' | 'error'

interface Ready {
  model: Model
  ctx: Context
  board: StandingRow[]
  viewAs: Rep
  today: Training | undefined
}

interface AppValue {
  status: LoadStatus
  error: string | null
  retry: () => void
  ready: Ready | null
  setViewAs: (repId: string) => void
  // Marks today's attendance. Pass the rep whose passport is open so they
  // get the stamp; with no rep it uses whoever you're viewing as.
  record: (repId?: string) => void
  recorded: boolean
  reset: () => void
  undoReset: () => void
  canUndo: boolean
  storageOk: boolean
  slideFrom: string[] | null
  clearSlide: () => void
  landing: ReadonlySet<string>
  landed: (email: string) => void
  preview: Preview
  setPreview: (preview: Preview) => void
}

const AppContext = createContext<AppValue | null>(null)

const UNDO_MS = 10000

export function AppProvider({ children }: { children: ReactNode }) {
  const [rows, setRows] = useState<AttendanceRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [preview, setPreview] = useState<Preview>('live')

  // Read storage once, up front. If it throws, we know it is blocked.
  const [initial] = useState(readSaved)
  const [saved, setSaved] = useState<SavedDemo>(initial.saved)
  const storageOk = initial.ok
  const [undo, setUndo] = useState<SavedDemo | null>(null)
  const [slideFrom, setSlideFrom] = useState<string[] | null>(null)
  const [landing, setLanding] = useState<ReadonlySet<string>>(new Set())

  useEffect(() => {
    const controller = new AbortController()
    loadAttendance(controller.signal)
      .then(setRows)
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setError(err instanceof DataError ? err.message : 'Something went wrong reading the attendance data.')
      })
    return () => controller.abort()
  }, [attempt])

  // Write-through to storage. A failed write is fine: the demo keeps working
  // from memory, it just won't survive a reload.
  useEffect(() => {
    writeSaved(saved)
  }, [saved])

  // The undo offer goes away on its own after a bit.
  useEffect(() => {
    if (!undo) return
    const timer = window.setTimeout(() => setUndo(null), UNDO_MS)
    return () => window.clearTimeout(timer)
  }, [undo])

  const baseModel = useMemo(() => (rows ? buildModel(rows) : null), [rows])

  const ready = useMemo<Ready | null>(() => {
    if (!baseModel || baseModel.reps.length === 0 || baseModel.trainings.length === 0) return null
    const today = baseModel.trainings.find((t) => t.date === DEMO_TODAY)
    // Only trust the saved recording if it still matches today's training.
    const recording = saved.recorded && today && saved.recorded.trainingId === today.id ? saved.recorded : null
    const model = recording ? withAttendance(baseModel, recording.trainingId, recording.emails) : baseModel
    const ctx: Context = { today: DEMO_TODAY, todayRecorded: Boolean(recording), line: LINE }
    const baseCtx: Context = { ...ctx, todayRecorded: false }
    const viewAs = (saved.viewAs && findRep(baseModel, saved.viewAs)) || pickDefaultRep(baseModel, baseCtx) || baseModel.reps[0]
    return { model, ctx, board: standings(model, ctx), viewAs, today }
  }, [baseModel, saved])

  const status: LoadStatus =
    preview !== 'live' ? preview : error ? 'error' : !rows ? 'loading' : ready ? 'ready' : 'empty'

  const setViewAs = useCallback((repId: string) => setSaved((s) => ({ ...s, viewAs: repId })), [])

  const record = useCallback((repId?: string) => {
    if (!ready || !ready.today || ready.ctx.todayRecorded || !baseModel) return
    // The rep being recorded is the one whose passport is open, when there
    // is one. They become the rep you're viewing as, so Standings highlights
    // the same person whose stamp just landed.
    const rep = (repId && findRep(baseModel, repId)) || ready.viewAs
    const emails = pickTodayAttendees(baseModel, ready.today, rep, DEMO_TODAY_SHARE, DEMO_SEED)
    // Remember the board order from right before, so Standings can slide
    // each row from where it was to where it lands.
    setSlideFrom(ready.board.map((row) => row.rep.id))
    setLanding(new Set(emails))
    setUndo(null)
    setSaved((s) => ({ ...s, viewAs: rep.id, recorded: { trainingId: ready.today!.id, emails } }))
  }, [ready, baseModel])

  // Reset keeps a copy of what it wiped so Undo can put it back.
  const reset = useCallback(() => {
    setUndo(saved)
    setSaved({})
    setSlideFrom(null)
    setLanding(new Set())
  }, [saved])

  const undoReset = useCallback(() => {
    if (!undo) return
    setSaved(undo)
    setUndo(null)
  }, [undo])

  const clearSlide = useCallback(() => setSlideFrom(null), [])

  const landed = useCallback((email: string) => {
    setLanding((current) => {
      if (!current.has(email)) return current
      const next = new Set(current)
      next.delete(email)
      return next
    })
  }, [])

  const value: AppValue = {
    status,
    error: preview === 'error' ? 'This is a preview of the error state. Nothing is actually broken.' : error,
    retry: () => {
      setPreview('live')
      setRows(null)
      setError(null)
      setAttempt((n) => n + 1)
    },
    ready: status === 'ready' ? ready : null,
    setViewAs,
    record,
    recorded: Boolean(ready?.ctx.todayRecorded),
    reset,
    undoReset,
    canUndo: undo !== null,
    storageOk,
    slideFrom,
    clearSlide,
    landing,
    landed,
    preview,
    setPreview,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppValue {
  const value = useContext(AppContext)
  if (!value) throw new Error('useApp needs to sit inside <AppProvider>')
  return value
}
