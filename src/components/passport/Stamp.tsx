// One attendance stamp: supplier and date inside a shape, in the supplier's
// ink, tilted a little. Text only, no logos. Drawn as SVG so the shape, the
// text and the tilt all scale together.

import { useEffect, useRef, type CSSProperties } from 'react'
import { stampDate } from '../../lib/format'
import { stampLook, type StampShape } from '../../lib/stamps'
import './Stamp.css'

interface Props {
  supplier: string
  date: string
  repEmail: string
  trainingId: string
  landing?: boolean
  onLanded?: () => void
}

const W = 140
const H = 110

// The widest the text can run inside each shape, in SVG units.
const ROOM: Record<StampShape, number> = { circle: 84, rect: 118, oval: 100, hexagon: 96, ticket: 108, octagon: 96 }

// Big Shoulders is condensed: capitals average about half an em wide. Good
// enough to pick a size and decide whether a name needs two lines.
const CHAR = 0.5
const MAX_SIZE = 26
const MIN_SIZE = 18

function fitLines(name: string, room: number): { lines: string[]; size: number } {
  const upper = name.toUpperCase()
  const oneLine = room / (upper.length * CHAR)
  if (oneLine >= MIN_SIZE || !upper.includes(' ')) {
    return { lines: [upper], size: Math.min(MAX_SIZE, Math.max(MIN_SIZE, oneLine)) }
  }
  // Too long for one line: break at the space nearest the middle.
  const words = upper.split(' ')
  let best = 1
  let bestDiff = Infinity
  for (let i = 1; i < words.length; i++) {
    const diff = Math.abs(words.slice(0, i).join(' ').length - words.slice(i).join(' ').length)
    if (diff < bestDiff) [best, bestDiff] = [i, diff]
  }
  const lines = [words.slice(0, best).join(' '), words.slice(best).join(' ')]
  const longest = Math.max(...lines.map((l) => l.length))
  return { lines, size: Math.min(MAX_SIZE - 2, Math.max(MIN_SIZE, room / (longest * CHAR))) }
}

function Shape({ shape }: { shape: StampShape }) {
  switch (shape) {
    case 'circle':
      return (
        <>
          <circle cx={70} cy={55} r={52} className="stamp__line--heavy" />
          <circle cx={70} cy={55} r={46} className="stamp__line--light" />
        </>
      )
    case 'rect':
      return (
        <>
          <rect x={3} y={6} width={134} height={98} rx={3} className="stamp__line--heavy" />
          <rect x={9} y={12} width={122} height={86} rx={1} className="stamp__line--light" />
        </>
      )
    case 'oval':
      return (
        <>
          <ellipse cx={70} cy={55} rx={66} ry={51} className="stamp__line--heavy" />
          <ellipse cx={70} cy={55} rx={60} ry={45} className="stamp__line--light" />
        </>
      )
    case 'hexagon':
      return (
        <>
          <polygon points="36,4 104,4 137,55 104,106 36,106 3,55" className="stamp__line--heavy" />
          <polygon points="39,10 101,10 130,55 101,100 39,100 10,55" className="stamp__line--light" />
        </>
      )
    case 'ticket':
      // A rectangle with the corners bitten out, like an admission ticket.
      return (
        <>
          <path d="M14 5 H126 A9 9 0 0 0 135 14 V96 A9 9 0 0 0 126 105 H14 A9 9 0 0 0 5 96 V14 A9 9 0 0 0 14 5 Z" className="stamp__line--heavy" />
          <path d="M16 11 H124 A6 6 0 0 0 129 16 V94 A6 6 0 0 0 124 99 H16 A6 6 0 0 0 11 94 V16 A6 6 0 0 0 16 11 Z" className="stamp__line--light" />
        </>
      )
    case 'octagon':
      return (
        <>
          <polygon points="40,3 100,3 137,32 137,78 100,107 40,107 3,78 3,32" className="stamp__line--heavy" />
          <polygon points="42,9 98,9 131,35 131,75 98,101 42,101 9,75 9,35" className="stamp__line--light" />
        </>
      )
  }
}

export function Stamp({ supplier, date, repEmail, trainingId, landing = false, onLanded }: Props) {
  const look = stampLook(supplier, repEmail, trainingId)
  const { lines, size } = fitLines(supplier, ROOM[look.shape])
  const ref = useRef<SVGSVGElement>(null)

  // Make sure the stamp is on screen when it lands. With the demo panel open
  // the slot can sit below the fold. No smooth scroll, just a jump.
  useEffect(() => {
    if (landing) ref.current?.scrollIntoView({ block: 'nearest' })
  }, [landing])

  // If reduced motion turns the animation off entirely, animationend may
  // never come. Settle it anyway so the stamp doesn't wait forever.
  useEffect(() => {
    if (!landing || !onLanded) return
    const timer = window.setTimeout(onLanded, 1200)
    return () => window.clearTimeout(timer)
  }, [landing, onLanded])

  const top = lines.length === 1 ? 52 : 42
  const dateY = lines.length === 1 ? 78 : 88
  const ruleY = lines.length === 1 ? 62 : 72

  return (
    <svg
      ref={ref}
      className={`stamp stamp--ink-${look.ink}${landing ? ' is-landing' : ''}`}
      viewBox={`0 0 ${W} ${H}`}
      style={{ '--tilt': `${look.rotate}deg` } as CSSProperties}
      aria-hidden="true"
      onAnimationEnd={landing ? onLanded : undefined}
    >
      <g className="stamp__shape">
        <Shape shape={look.shape} />
      </g>
      {lines.map((line, i) => (
        <text key={i} x={W / 2} y={top + i * (size + 1)} className="stamp__supplier" style={{ fontSize: size }} textAnchor="middle">
          {line}
        </text>
      ))}
      <line x1={W / 2 - 24} x2={W / 2 + 24} y1={ruleY} y2={ruleY} className="stamp__line--light" />
      <text x={W / 2} y={dateY} className="stamp__date" textAnchor="middle">
        {stampDate(date)}
      </text>
    </svg>
  )
}
