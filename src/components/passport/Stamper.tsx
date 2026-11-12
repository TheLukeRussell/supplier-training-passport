// The rubber stamp that comes down on today's slot when attendance gets
// recorded. It's only on screen for about a second: it drops, presses the
// ink onto the page, and lifts away. Flat shapes in the app's own colours,
// with the rubber pad in the same ink as the stamp it leaves behind. The
// block is as wide as the stamp, so lifting it off is the reveal.

import './Stamper.css'

interface Props {
  ink: 1 | 2 | 3
}

export function Stamper({ ink }: Props) {
  return (
    <div className={`stamper stamper--ink-${ink}`} aria-hidden="true">
      <svg className="stamper__tool" viewBox="0 0 120 132">
        {/* Knob, neck, block, rubber. The pad's bottom edge meets the page. */}
        <circle cx={60} cy={20} r={18} className="stamper__knob" />
        <rect x={50} y={34} width={20} height={38} rx={4} className="stamper__neck" />
        <rect x={4} y={70} width={112} height={44} rx={6} className="stamper__block" />
        <rect x={8} y={114} width={104} height={12} rx={2} className="stamper__pad" />
      </svg>
    </div>
  )
}
