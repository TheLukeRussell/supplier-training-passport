// Builds small fake exports for the tests, so each test reads like a story:
// "four trainings, Ana went to three of them".

import type { AttendanceRow } from '../data/types'

export interface FakeTraining {
  id: string
  date: string
  supplier?: string
}

// marks: one character per training. a = attended, m = missed (invited),
// - = not invited.
export function rowsFor(trainings: FakeTraining[], reps: Record<string, string>, team = 'East'): AttendanceRow[] {
  const rows: AttendanceRow[] = []
  for (const [name, marks] of Object.entries(reps)) {
    trainings.forEach((training, i) => {
      const mark = marks[i] ?? '-'
      rows.push({
        rep_email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        rep_name: name,
        team,
        training_id: training.id,
        supplier: training.supplier ?? 'Zebra',
        title: `${training.supplier ?? 'Zebra'} partner training`,
        date: training.date,
        format: 'virtual',
        invited: mark !== '-',
        attended: mark === 'a',
      })
    })
  }
  return rows
}

export const FOUR: FakeTraining[] = [
  { id: 't1', date: '2027-01-12' },
  { id: 't2', date: '2027-02-10' },
  { id: 't3', date: '2027-03-11' },
  { id: 't4', date: '2027-04-13' },
]
