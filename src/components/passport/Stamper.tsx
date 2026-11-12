// The rubber stamp that comes down on today's slot when attendance gets
// recorded. It's only on screen for about a second and a half: it swings in,
// hovers, presses the ink onto the page at the same tilt as the impression it
// leaves, and lifts away. Its shadow on the page tightens as it comes down,
// which is most of what makes the drop read as depth. Flat shapes in the
// app's own colours, with the rubber pad in the stamp's ink.

import type { CSSProperties } from 'react'
import './Stamper.css'

interface Props {
  ink: 1 | 2 | 3
  // The impression's tilt in degrees, so the stamp lands at the same angle.
  tilt: number
}

export function Stamper({ ink, tilt }: Props) {
  return (
    <div className={`stamper stamper--ink-${ink}`} style={{ '--tilt': `${tilt}deg` } as CSSProperties} aria-hidden="true">
      <span className="stamper__shadow" />
      <svg className="stamper__tool" viewBox="0 0 120 132">
        {/* Knob with a highlight, neck, block with a lit top edge, rubber.
            The pad’s bottom edge meets the page. */}
        <circle cx={60} cy={20} r={18} className="stamper__knob" />
        <circle cx={54} cy={14} r={6} className="stamper__knob-shine" />
        <rect x={50} y={34} width={20} height={38} rx={4} className="stamper__neck" />
        <rect x={4} y={70} width={112} height={44} rx={6} className="stamper__block" />
        <rect x={10} y={73} width={100} height={4} rx={2} className="stamper__block-shine" />
        <rect x={8} y={114} width={104} height={12} rx={2} className="stamper__pad" />
      </svg>
    </div>
  )
}
