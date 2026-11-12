// Every rule and knob for the passport lives here, so changing the line or the
// demo date is a one-line edit. The data script imports this file too.

// The President's Club line: the share of invited trainings a rep needs to attend.
// This is a placeholder until leadership sets the real number.
export const LINE = 0.75

// The demo pretends today is this date. It's a training day, so passports
// show a mix of stamped, missed and upcoming slots.
export const DEMO_TODAY = '2027-06-17'

export const PROGRAM_YEAR = 2027
export const ISSUE_DATE = '2027-01-01'
export const EXPIRY_DATE = '2027-12-31'

export const TEAMS = ['East', 'Central', 'West', 'Canada'] as const

// The suppliers running trainings this year. Keep them in this one array.
export const SUPPLIERS = [
  'Zebra',
  'Honeywell',
  'HP Poly',
  'HPE Aruba',
  'Juniper',
  'Extreme Networks',
  'Cambium',
  'Datalogic',
  'ASSA ABLOY',
  'Panasonic',
  'Brady',
  'Pioneer',
] as const

// When the demo records today's attendance, roughly this share of everyone
// else invited to today's training gets marked attended.
export const DEMO_TODAY_SHARE = 0.65

// Seeds for anything random. Same seed, same sample data, every time.
export const DATA_SEED = 2027
export const DEMO_SEED = 617

// Where the sample data file sits, relative to the app's base URL.
export const DATA_PATH = 'data/attendance.json'

// Key for demo changes in localStorage.
export const STORAGE_KEY = 'stp-demo-v1'
