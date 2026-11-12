// Little formatters for dates, ranks and names. Dates are plain YYYY-MM-DD
// strings, read as UTC so nobody's time zone shifts a training by a day.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function parts(date: string) {
  const [y, m, d] = date.split('-').map(Number)
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  return { y, m, d, weekday }
}

// Thu, Jun 17
export function shortDate(date: string): string {
  const { m, d, weekday } = parts(date)
  return `${DAYS[weekday]}, ${MONTHS[m - 1]} ${d}`
}

// June 17, 2027
export function longDate(date: string): string {
  const { y, m, d } = parts(date)
  return `${MONTHS_LONG[m - 1]} ${d}, ${y}`
}

// 17 JUN 2027, the way a stamp or a passport prints it
export function stampDate(date: string): string {
  const { y, m, d } = parts(date)
  return `${String(d).padStart(2, '0')} ${MONTHS[m - 1].toUpperCase()} ${y}`
}

export function monthName(month: number): string {
  return MONTHS_LONG[month - 1]
}

export function daysBetween(from: string, to: string): number {
  const a = parts(from)
  const b = parts(to)
  return Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86400000)
}

// 1st, 2nd, 3rd, 4th, 11th, 12th, 13th, 21st
export function ordinal(n: number): string {
  const tens = n % 100
  if (tens >= 11 && tens <= 13) return `${n}th`
  const suffix = { 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] ?? 'th'
  return `${n}${suffix}`
}

export function initials(name: string): string {
  const words = name.trim().split(/\s+/)
  const first = words[0]?.[0] ?? ''
  const last = words.length > 1 ? words.at(-1)![0] : ''
  return (first + last).toUpperCase()
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name
}

export function surname(name: string): string {
  return name.trim().split(/\s+/).at(-1) ?? name
}

export function givenNames(name: string): string {
  return name.trim().split(/\s+/).slice(0, -1).join(' ')
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`
}
