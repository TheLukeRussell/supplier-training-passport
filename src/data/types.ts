// The shape of one row in the attendance export. One row per rep per training.
// The real export should match these column names, or source.ts maps them.

export type TrainingFormat = 'virtual' | 'in person'

export interface AttendanceRow {
  rep_email: string
  rep_name: string
  team: string
  training_id: string
  supplier: string
  title: string
  date: string // YYYY-MM-DD
  format: TrainingFormat
  invited: boolean
  attended: boolean
}
