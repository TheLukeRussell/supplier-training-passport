// The machine-readable strip at the bottom of the data page. It follows the
// real passport layout (two lines of 44 characters, ICAO 9303 style) but packs
// in the rep's training stats instead of a birth date and nationality.

export interface MrzInput {
  name: string
  team: string
  attended: number
  recorded: number
  percent: number | null
  rank: number | null
  issue: string // YYYY-MM-DD
  expiry: string // YYYY-MM-DD
}

const LINE_LENGTH = 44

const TEAM_CODES: Record<string, string> = {
  East: 'EST',
  Central: 'CTL',
  West: 'WST',
  Canada: 'CAN',
}

// Uppercase A to Z only. Accents come off (Amelie, not Am<lie), and anything
// else becomes the < filler, same as a real passport.
function clean(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '<')
}

function pad(text: string, length: number): string {
  return (text + '<'.repeat(length)).slice(0, length)
}

function digits(value: number | null, length: number): string {
  if (value === null) return '<'.repeat(length)
  return String(Math.min(value, 10 ** length - 1)).padStart(length, '0')
}

// Real passports use this check digit: weights 7, 3, 1 repeating, digits are
// themselves, letters A to Z are 10 to 35, filler is 0, then mod 10.
export function checkDigit(text: string): string {
  const weights = [7, 3, 1]
  let sum = 0
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    let value = 0
    if (char >= '0' && char <= '9') value = Number(char)
    else if (char >= 'A' && char <= 'Z') value = char.charCodeAt(0) - 55
    sum += value * weights[i % 3]
  }
  return String(sum % 10)
}

const yymmdd = (date: string) => date.slice(2, 4) + date.slice(5, 7) + date.slice(8, 10)

export function mrzLines(input: MrzInput): [string, string] {
  const parts = input.name.trim().split(/\s+/)
  const surname = clean(parts.at(-1) ?? '')
  const given = clean(parts.slice(0, -1).join(' '))
  const line1 = pad(`P<STP${surname}<<${given}`, LINE_LENGTH)

  // Document number: first initial plus surname, like HKOWALSKI.
  const docNumber = pad(clean((parts[0]?.[0] ?? '') + surname).replace(/</g, ''), 9)
  const team = pad(TEAM_CODES[input.team] ?? clean(input.team), 3)
  const issue = yymmdd(input.issue)
  const expiry = yymmdd(input.expiry)
  // The "personal number" slot holds the stats: A attended, I invited,
  // R rate as a percent, K rank. Unranked reps get filler for R and K.
  const stats = pad(
    `A${digits(input.attended, 2)}I${digits(input.recorded, 2)}R${digits(input.percent, 3)}K${digits(input.rank, 2)}`,
    14,
  )

  const docPart = docNumber + checkDigit(docNumber)
  const issuePart = issue + checkDigit(issue)
  const expiryPart = expiry + checkDigit(expiry)
  const statsPart = stats + checkDigit(stats)
  const composite = checkDigit(docPart + issuePart + expiryPart + statsPart)
  const line2 = docPart + team + issuePart + '<' + expiryPart + statsPart + composite

  return [line1, line2]
}
