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
// ones only invite the teams that sell that supplier: POSB sells Zebra,
// Honeywell, Datalogic, Brady, Pioneer and Panasonic, NetSec sells HPE Aruba,
// Juniper, Extreme, Cambium and ASSA ABLOY, Communications sells HP Poly, and
// Federal gets the Honeywell and ASSA ABLOY sessions too. That's why invite
// counts differ by team, which gives us a rep sitting exactly on the line.
const PLAN: PlannedTraining[] = [
  { date: '2027-01-12', supplier: 'Zebra', format: 'virtual', teams: 'all' },
  { date: '2027-01-28', supplier: 'Honeywell', format: 'in person', teams: ['POSB', 'Federal'] },
  { date: '2027-02-10', supplier: 'HPE Aruba', format: 'virtual', teams: 'all' },
  { date: '2027-02-23', supplier: 'Juniper', format: 'virtual', teams: 'all' },
  { date: '2027-03-11', supplier: 'Datalogic', format: 'in person', teams: ['POSB'] },
  { date: '2027-03-24', supplier: 'Extreme Networks', format: 'virtual', teams: 'all' },
  { date: '2027-04-13', supplier: 'HP Poly', format: 'virtual', teams: 'all' },
  { date: '2027-04-29', supplier: 'Cambium', format: 'in person', teams: ['NetSec'] },
  { date: '2027-05-12', supplier: 'ASSA ABLOY', format: 'virtual', teams: 'all' },
  { date: '2027-05-25', supplier: 'Panasonic', format: 'virtual', teams: 'all' },
  { date: '2027-06-03', supplier: 'Brady', format: 'in person', teams: ['POSB'] },
  { date: '2027-06-17', supplier: 'Pioneer', format: 'virtual', teams: 'all' }, // demo "today"
  { date: '2027-07-14', supplier: 'Zebra', format: 'virtual', teams: 'all' },
  { date: '2027-07-27', supplier: 'Honeywell', format: 'virtual', teams: 'all' },
  { date: '2027-08-12', supplier: 'HPE Aruba', format: 'in person', teams: ['NetSec'] },
  { date: '2027-08-25', supplier: 'Cisco', format: 'virtual', teams: 'all' },
  { date: '2027-09-14', supplier: 'Datalogic', format: 'virtual', teams: 'all' },
  { date: '2027-09-30', supplier: 'Extreme Networks', format: 'in person', teams: ['NetSec'] },
  { date: '2027-10-13', supplier: 'HP Poly', format: 'in person', teams: ['Communications'] },
  { date: '2027-10-26', supplier: 'Cisco', format: 'in person', teams: ['Cisco'] },
  { date: '2027-11-11', supplier: 'ASSA ABLOY', format: 'in person', teams: ['NetSec', 'Federal'] },
  { date: '2027-11-23', supplier: 'Panasonic', format: 'virtual', teams: 'all' },
  { date: '2027-12-08', supplier: 'Brady', format: 'virtual', teams: 'all' },
  { date: '2027-12-14', supplier: 'Pioneer', format: 'in person', teams: ['POSB'] },
]

interface PlannedRep {
  name: string
  team: Team
  // How many of their recorded (pre-today) trainings they attended. The seed
  // decides which ones they missed. Picked by hand so the board tells a story:
  // a perfect record, a two-way tie for second, one rep exactly on the line,
  // a bit under half above it, and a few who can't get there this year.
  attended: number
  startDate?: string
}

// Invites before today: POSB 10, NetSec 8, Federal 8, Communications 7, Cisco 7.
// Only Communications and Cisco reps can cross the line on one more stamp
// (5 of 7 to 6 of 8). The demo opens on the first of those by name, so keep
// any other 5 of 7 sorting after Hannah.
const REPS: PlannedRep[] = [
  { name: 'Owen Fitzgerald', team: 'Communications', attended: 6 },
  { name: 'Sofia Marchetti', team: 'Communications', attended: 6 },
  { name: 'Talia Ross', team: 'Communications', attended: 6 },
  { name: 'Victor Huang', team: 'Communications', attended: 6 },
  { name: 'Rosa Delgado', team: 'Communications', attended: 6 },
  { name: 'Devon Price', team: 'Communications', attended: 6 },
  { name: 'Hannah Kowalski', team: 'Communications', attended: 5 }, // 5 of 7, crosses the line today
  { name: 'Imani Carter', team: 'Communications', attended: 6 },
  { name: 'Wren Castillo', team: 'Communications', attended: 5 },
  { name: 'Caleb Turner', team: 'Communications', attended: 3 },
  { name: 'Mira Kapoor', team: 'Communications', attended: 3 },
  { name: 'Jonah Becker', team: 'Communications', attended: 2 },

  { name: 'Jordan Hale', team: 'POSB', attended: 10 }, // perfect record
  { name: 'Priya Natarajan', team: 'POSB', attended: 9 },
  { name: 'Marcus Bell', team: 'POSB', attended: 9 },
  { name: 'Elena Ruiz', team: 'POSB', attended: 8 },
  { name: 'Paige Holloway', team: 'POSB', attended: 8 },
  { name: 'Grace Nakamura', team: 'POSB', attended: 8 },
  { name: 'Felix Andersson', team: 'POSB', attended: 7 },
  { name: 'Kendra Wallace', team: 'POSB', attended: 7 },
  { name: 'Mateo Silva', team: 'POSB', attended: 6 },
  { name: 'Omar Haddad', team: 'POSB', attended: 6 },
  { name: 'Tessa Lund', team: 'POSB', attended: 5 },
  { name: 'Cole Ashby', team: 'POSB', attended: 4 },

  { name: 'Kai Morales', team: 'NetSec', attended: 7 },
  { name: 'Naomi Feld', team: 'NetSec', attended: 7 },
  { name: 'Rahul Mehta', team: 'NetSec', attended: 7 },
  { name: 'Sam Whitlock', team: 'NetSec', attended: 7 },
  { name: 'Harper Lindgren', team: 'NetSec', attended: 7 },
  { name: 'Ryan Lindqvist', team: 'NetSec', attended: 5 },
  { name: 'Isaac Patel', team: 'NetSec', attended: 5 },
  { name: 'Declan Shea', team: 'NetSec', attended: 5 },
  { name: 'Andre Thomas', team: 'NetSec', attended: 4 },
  { name: 'Lena Hoffmann', team: 'NetSec', attended: 4 },
  { name: 'Gabriel Okafor', team: 'NetSec', attended: 3 },
  { name: 'Yuki Tanaka', team: 'NetSec', attended: 3 },

  { name: 'Tyler Brooks', team: 'Cisco', attended: 6 },
  { name: 'Theo Vance', team: 'Cisco', attended: 6 },
  { name: 'Janelle Moss', team: 'Cisco', attended: 6 },
  { name: 'Arjun Rao', team: 'Cisco', attended: 6 },
  { name: 'Lucia Romero', team: 'Cisco', attended: 6 },
  { name: 'Brianna Cole', team: 'Cisco', attended: 6 },
  { name: 'Leah Abramson', team: 'Cisco', attended: 6 },
  { name: 'Malik Grant', team: 'Cisco', attended: 5 },
  { name: 'Bea Sorensen', team: 'Cisco', attended: 4 },
  { name: 'Megan Doyle', team: 'Cisco', attended: 3 },
  { name: 'Diego Serrano', team: 'Cisco', attended: 3 },
  { name: 'Chloe Whitaker', team: 'Cisco', attended: 2 },

  { name: 'Liam Tremblay', team: 'Federal', attended: 7 },
  { name: 'Ethan Park', team: 'Federal', attended: 6 }, // 6 of 8, exactly on the line
  { name: 'Aisha Bello', team: 'Federal', attended: 5 },
  { name: 'Amélie Gagnon', team: 'Federal', attended: 5 },
  { name: 'Desmond Reyes', team: 'Federal', attended: 5 },
  { name: 'Noah Singh', team: 'Federal', attended: 4 },
  { name: 'Ingrid Solberg', team: 'Federal', attended: 4 },
  { name: 'Zoe MacLeod', team: 'Federal', attended: 4 },
  { name: 'Fiona Brennan', team: 'Federal', attended: 3 },
  { name: 'Ben Okoro', team: 'Federal', attended: 3 },
  { name: 'Nadia Kerr', team: 'Federal', attended: 2 },
  { name: 'Clara Dubois', team: 'Federal', attended: 0, startDate: '2027-06-01' }, // new hire, no stamps yet
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
  check(PLAN.some((t) => t.supplier === supplier), `${supplier} should run at least once`)
}
check(PLAN.every((t) => t.teams === 'all' || t.teams.length > 0), 'every in-person training needs a team')
for (const team of TEAMS) {
  check(REPS.filter((r) => r.team === team).length >= 10, `${team} needs at least 10 reps`)
}
check(REPS.length === 60, 'expected 60 reps')
check(new Set(REPS.map((r) => emailFor(r.name))).size === REPS.length, 'two reps share an email')

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
