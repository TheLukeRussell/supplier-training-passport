// One slot on a visa page, one per training. Attended gets a stamp, missed
// is an empty slot marked missed, upcoming is an empty slot with its date.
// Tapping any slot opens that training's details.

import type { Training } from '../../lib/model'
import type { SlotState } from '../../lib/rules'
import { shortDate } from '../../lib/format'
import { Stamp } from './Stamp'
import './VisaSlot.css'

interface Props {
  training: Training
  state: SlotState
  repEmail: string
  landing: boolean
  onLanded: () => void
  onOpen: (training: Training) => void
  focusable: boolean
}

const STATUS: Record<SlotState, string> = {
  stamped: 'Attended',
  missed: 'Missed',
  today: 'Today, not recorded yet',
  upcoming: 'Coming up',
  'not-invited': 'Not on your list',
}

export function VisaSlot({ training, state, repEmail, landing, onLanded, onOpen, focusable }: Props) {
  const label = `${training.supplier}, ${shortDate(training.date)}. ${STATUS[state]}. Show details`
  return (
    <button
      type="button"
      className={`slot slot--${state}`}
      onClick={() => onOpen(training)}
      aria-label={label}
      tabIndex={focusable ? 0 : -1}
      data-training={training.id}
    >
      {state === 'stamped' ? (
        <Stamp
          supplier={training.supplier}
          date={training.date}
          repEmail={repEmail}
          trainingId={training.id}
          landing={landing}
          onLanded={onLanded}
        />
      ) : (
        <span className="slot__blank">
          {state === 'today' && <span className="tag tag--today">Today</span>}
          <span className="slot__date">{shortDate(training.date)}</span>
          <span className="slot__supplier">{training.supplier}</span>
          {state === 'missed' && <span className="slot__missed">Missed</span>}
          {state === 'not-invited' && <span className="slot__note">Not on your list</span>}
        </span>
      )}
    </button>
  )
}
