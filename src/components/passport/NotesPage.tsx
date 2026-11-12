// The inside cover: how the passport works and how to read a visa page,
// using the same slot styles as the key.

import { LINE } from '../../config'
import { Page } from './Page'
import './NotesPage.css'

export function NotesPage() {
  return (
    <Page kind="notes" label="Inside cover" folio={1}>
      <h2 className="notes__title">How your passport works</h2>
      <ol className="notes__rules">
        <li>Every supplier training you attend earns a stamp on your visa pages.</li>
        <li>Your rate is stamps divided by trainings you were invited to. Only trainings that already happened count.</li>
        <li>
          Reach the line, {Math.round(LINE * 100)}% (placeholder), and you've met the training part of President's Club.
        </li>
      </ol>

      <div className="notes__key">
        <p className="notes__key-title">Reading a visa page</p>
        <ul className="notes__key-list">
          <li>
            <span className="notes__swatch notes__swatch--stamp" aria-hidden="true">
              Stamped
            </span>
            <span>A stamp means you were there.</span>
          </li>
          <li>
            <span className="notes__swatch notes__swatch--missed" aria-hidden="true">
              Missed
            </span>
            <span>Invited, didn't make it. It counts against your rate.</span>
          </li>
          <li>
            <span className="notes__swatch notes__swatch--upcoming" aria-hidden="true">
              Jul 14
            </span>
            <span>Still to come. It won't count until it happens.</span>
          </li>
        </ul>
      </div>

      <p className="notes__sample">Sample data. Every name and number in this demo is made up.</p>
    </Page>
  )
}
