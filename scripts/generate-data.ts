// Writes public/data/attendance.json, the sample export the demo runs on.
// Run it with `npm run data`. It's seeded, so you get the same file every time
// unless you change the plan below or DATA_SEED in src/config.ts.
//
// Every name here is made up. Emails use example.com on purpose.

import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DATA_SEED, DEMO_TODAY, SUPPLIERS, TEAMS } from '../src/config.ts'
import { seededRandom, shuffled } from '../src/lib/random.ts'

type Team = (typeof TEAMS)[number]

interface PlannedTraining {
  date: string
  supplier: (typeof SUPPLIERS)[number]
  format: 'virtual' | 'in person'
  teams: readonly Team[] | 'all'
}

// About two a month, all weekdays. Virtual ones invite everyone. In-person
// ones are regional, so only a couple of teams get invited. That's also why
// invite counts differ by team, which gives us a rep sitting exactly on the line.
const PLAN: PlannedTraining[] = [
  { date: '2027-01-12', supplier: 'Zebra', format: 'virtual', teams: 'all' },
  { date: '2027-01-28', supplier: 'Honeywell', format: 'in person', teams: ['East', 'Central'] },
  { date: '2027-02-10', supplier: 'HPE Aruba', format: 'virtual', teams: 'all' },
  { date: '2027-02-23', supplier: 'Juniper', format: 'virtual', teams: 'all' },
  { date: '2027-03-11', supplier: 'Datalogic', format: 'in person', teams: ['East', 'West'] },
  { date: '2027-03-24', supplier: 'Extreme Networks', format: 'virtual', teams: 'all' },
  { date: '2027-04-13', supplier: 'HP Poly', format: 'virtual', teams: 'all' },
  { date: '2027-04-29', supplier: 'Cambium', format: 'in person', teams: ['East', 'Canada'] },
  { date: '2027-05-12', supplier: 'ASSA ABLOY', format: 'virtual', teams: 'all' },
  { date: '2027-05-25', supplier: 'Panasonic', format: 'virtual', teams: 'all' },
  { date: '2027-06-03', supplier: 'Brady', format: 'in person', teams: ['East', 'Central'] },
  { date: '2027-06-17', supplier: 'Pioneer', format: 'virtual', teams: 'all' }, // demo "today"
  { date: '2027-07-14', supplier: 'Zebra', format: 'virtual', teams: 'all' },
  { date: '2027-07-27', supplier: 'Honeywell', format: 'virtual', teams: 'all' },
  { date: '2027-08-12', supplier: 'HPE Aruba', format: 'in person', teams: ['West', 'Canada'] },
  { date: '2027-08-25', supplier: 'Juniper', format: 'virtual', teams: 'all' },
  { date: '2027-09-14', supplier: 'Datalogic', format: 'virtual', teams: 'all' },
  { date: '2027-09-30', supplier: 'Extreme Networks', format: 'in person', teams: ['East', 'Central'] },
  { date: '2027-10-13', supplier: 'HP Poly', format: 'virtual', teams: 'all' },
  { date: '2027-10-26', supplier: 'Cambium', format: 'virtual', teams: 'all' },
  { date: '2027-11-11', supplier: 'ASSA ABLOY', format: 'in person', teams: ['Canada', 'East'] },
  { date: '2027-11-23', supplier: 'Panasonic', format: 'virtual', teams: 'all' },
  { date: '2027-12-08', supplier: 'Brady', format: 'virtual', teams: 'all' },
  { date: '2027-12-14', supplier: 'Pioneer', format: 'in person', teams: ['Central', 'West'] },
]

interface PlannedRep {
  name: string
  team: Team
  // How many of their recorded (pre-today) trainings they attended. The seed
  // decides which ones they missed. Picked by hand so the board tells a story:
  // a perfect record, a two-way tie for second, one rep exactly on the line,
  // roughly half above it, and a few who can't get there this year.
  attended: number
  startDate?: string
}

// Invites before today: East 11, Central 9, West 8, Canada 8.
const REPS: PlannedRep[] = [
  { name: 'Priya Natarajan', team: 'East', attended: 10 },
  { name: 'Marcus Bell', team: 'East', attended: 10 },
  { name: 'Elena Ruiz', team: 'East', attended: 9 },
  { name: 'Owen Fitzgerald', team: 'East', attended: 9 },
  { name: 'Hannah Kowalski', team: 'East', attended: 8 }, // 8 of 11, crosses the line today
  { name: 'Devon Price', team: 'East', attended: 7 },
  { name: 'Sofia Marchetti', team: 'East', attended: 6 },
  { name: 'Caleb Turner', team: 'East', attended: 5 },

  { name: 'Jordan Hale', team: 'Central', attended: 9 }, // perfect record
  { name: 'Aisha Bello', team: 'Central', attended: 8 },
  { name: 'Ryan Lindqvist', team: 'Central', attended: 7 },
  { name: 'Grace Nakamura', team: 'Central', attended: 7 },
  { name: 'Tyler Brooks', team: 'Central', attended: 7 },
  { name: 'Leah Abramson', team: 'Central', attended: 6 },
  { name: 'Mateo Silva', team: 'Central', attended: 5 },
  { name: 'Brianna Cole', team: 'Central', attended: 4 },

  { name: 'Kai Morales', team: 'West', attended: 7 },
  { name: 'Naomi Feld', team: 'West', attended: 7 },
  { name: 'Ethan Park', team: 'West', attended: 6 }, // 6 of 8, exactly on the line
  { name: 'Lucia Romero', team: 'West', attended: 5 },
  { name: 'Isaac Patel', team: 'West', attended: 5 },
  { name: 'Megan Doyle', team: 'West', attended: 4 },
  { name: 'Andre Thomas', team: 'West', attended: 4 },
  { name: 'Chloe Whitaker', team: 'West', attended: 3 },

  { name: 'Liam Tremblay', team: 'Canada', attended: 7 },
  { name: 'Amélie Gagnon', team: 'Canada', attended: 7 },
  { name: 'Noah Singh', team: 'Canada', attended: 5 },
  { name: 'Zoe MacLeod', team: 'Canada', attended: 4 },
  { name: 'Ben Okoro', team: 'Canada', attended: 3 },
  { name: 'Clara Dubois', team: 'Canada', attended: 0, startDate: '2027-06-01' }, // new hire, no stamps yet
]

const TITLES = {
  first: (s: string) => `${s} partner training`,
  second: (s: string) => `${s} sales update`,
  inPerson: (s: string) => `${s} solutions workshop`,
}

function emailFor(name: string): string {
  const clean = name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]+/g, '.')
  return `${clean}@example.com`
}

function isWeekday(date: string): boolean {
  const [y, m, d] = date.split('-').map(Number)
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  return day !== 0 && day !== 6
}

// Fail loudly if someone edits the plan into something the demo can't use.
function check(condition: boolean, message: string): void {
  if (!condition) throw new Error(`generate-data: ${message}`)
}

check(PLAN.length === 24, 'expected 24 trainings')
check(PLAN.every((t) => t.date.startsWith('2027-') && isWeekday(t.date)), 'every training must be a 2027 weekday')
check(PLAN.some((t) => t.date === DEMO_TODAY), 'one training has to land on DEMO_TODAY')
for (const supplier of SUPPLIERS) {
  check(PLAN.filter((t) => t.supplier === supplier).length === 2, `${supplier} should run twice`)
}
check(REPS.length === 30, 'expected 30 reps')

const trainings = PLAN.map((t, i) => {
  const seen = PLAN.slice(0, i).some((p) => p.supplier === t.supplier)
  const title = t.format === 'in person' ? TITLES.inPerson(t.supplier) : seen ? TITLES.second(t.supplier) : TITLES.first(t.supplier)
  return { ...t, id: `t${String(i + 1).padStart(2, '0')}`, title }
})

const random = seededRandom(DATA_SEED)
const rows = []

for (const rep of REPS) {
  const email = emailFor(rep.name)
  const invitedTo = (t: (typeof trainings)[number]) =>
    (t.teams === 'all' || t.teams.includes(rep.team)) && (!rep.startDate || t.date >= rep.startDate)

  const past = trainings.filter((t) => t.date < DEMO_TODAY && invitedTo(t))
  check(rep.attended <= past.length, `${rep.name} can't attend ${rep.attended} of ${past.length}`)
  // Pick which past trainings they missed. Shuffle with the seed, take the
  // first few as misses. Same seed, same misses, every run.
  const misses = new Set(shuffled(past, random).slice(0, past.length - rep.attended).map((t) => t.id))

  for (const t of trainings) {
    const invited = invitedTo(t)
    rows.push({
      rep_email: email,
      rep_name: rep.name,
      team: rep.team,
      training_id: t.id,
      supplier: t.supplier,
      title: t.title,
      date: t.date,
      format: t.format,
      invited,
      // Today and later haven't happened yet, so nobody has attended them.
      attended: invited && t.date < DEMO_TODAY && !misses.has(t.id),
    })
  }
}

rows.sort((a, b) => a.date.localeCompare(b.date) || a.rep_name.localeCompare(b.rep_name))

// One row per line keeps the file readable and the diffs small.
const json = '[\n' + rows.map((row) => '  ' + JSON.stringify(row)).join(',\n') + '\n]\n'
const here = dirname(fileURLToPath(import.meta.url))
const out = join(here, '..', 'public', 'data', 'attendance.json')
writeFileSync(out, json)
console.log(`Wrote ${rows.length} rows (${REPS.length} reps, ${trainings.length} trainings) to public/data/attendance.json`)
