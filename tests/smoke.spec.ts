// The demo, start to finish: open the passport, turn every page, record
// today's attendance, check the standings moved, filter, then reset.

import { expect, test, type Page } from '@playwright/test'

const where = (page: Page) => page.locator('.passport__where')
const next = (page: Page) => page.getByRole('button', { name: 'Next page' })
const prev = (page: Page) => page.getByRole('button', { name: 'Previous page' })
// The pages actually showing. The book also keeps hidden copies of every page
// to size itself, so text checks look only here.
const shown = (page: Page) => page.locator('.book__slot')

test('the demo flow works end to end', async ({ page }, info) => {
  const phone = info.project.name.startsWith('phone')

  // Opens on the default rep's cover.
  await page.goto('./')
  await expect(page).toHaveURL(/#\/passport\/hannah-kowalski$/)
  await expect(where(page)).toHaveText('Cover')
  await page.getByRole('button', { name: 'Open passport' }).click()
  await expect(shown(page).getByText('Attend the next one to reach the line')).toBeVisible()
  await expect(shown(page).getByText('15th')).toBeVisible()

  // Turn every page forward to the back cover, then all the way back to the front.
  const seen = new Set<string>()
  // Click, wait for the label to change and the paper to stop moving, then read it.
  const turn = async (button: ReturnType<typeof next>) => {
    const before = (await where(page).textContent()) ?? ''
    await button.click()
    await expect(where(page)).not.toHaveText(before)
    await expect(page.locator('.book.is-turning')).toHaveCount(0)
    seen.add((await where(page).textContent()) ?? '')
  }
  while (await next(page).isEnabled()) await turn(next(page))
  await expect(where(page)).toHaveText('Back cover')
  await expect(page.getByRole('button', { name: 'Back to the front' })).toBeVisible()
  while (await prev(page).isEnabled()) await turn(prev(page))
  await expect(where(page)).toHaveText('Cover')
  if (phone) {
    for (const name of ['Inside cover', 'Data page', 'January to March', 'April to June', 'July to September', 'October to December', 'Back cover']) {
      expect([...seen].some((label) => label.includes(name)), `saw ${name}`).toBe(true)
    }
  } else {
    expect(seen).toEqual(new Set(['Cover', 'Pages 1 and 2 of 6', 'Pages 3 and 4 of 6', 'Pages 5 and 6 of 6', 'Back cover']))
  }

  // Keys turn pages too, and on a phone so does a swipe. From the cover,
  // the next page is the inside cover on a phone and the first spread on a laptop.
  await page.keyboard.press('ArrowRight')
  await expect(page).toHaveURL(phone ? /page=1/ : /page=2/)
  if (phone) {
    const stage = page.locator('.passport__stage')
    const box = (await stage.boundingBox())!
    const y = box.y + 200
    await stage.dispatchEvent('pointerdown', { pointerType: 'touch', pointerId: 7, clientX: box.x + 300, clientY: y, isPrimary: true })
    await stage.dispatchEvent('pointerup', { pointerType: 'touch', pointerId: 7, clientX: box.x + 60, clientY: y + 10, isPrimary: true })
    await expect(page).toHaveURL(/page=2/)
    await expect(shown(page).getByText('Attend the next one to reach the line')).toBeVisible()
  }

  // Tap a slot to see the training without leaving the page.
  await page.goto('./#/passport/hannah-kowalski?page=3')
  await page.getByRole('button', { name: /^Zebra, Tue, Jan 12, virtual\. Attended/ }).click()
  const slip = page.getByRole('dialog')
  await expect(slip.getByRole('heading', { name: 'Zebra' })).toBeVisible()
  await expect(slip.getByText('Hannah attended.')).toBeVisible()
  await slip.getByRole('button', { name: 'Close' }).click()
  await expect(slip).toBeHidden()

  // Every slot says whether the training is virtual or in person.
  await expect(page.getByRole('button', { name: /^Honeywell, Thu, Jan 28, in person\./ })).toBeVisible()

  // Record today's attendance from the passport. The book turns to today's
  // page, the stamper brings the stamp down, the endorsement gets written in,
  // and the data page shows Hannah on the line.
  await page.getByRole('button', { name: 'Demo', exact: true }).click()
  await page.getByRole('button', { name: "Record today’s attendance" }).click()
  await expect(page).toHaveURL(/page=4/)
  await expect(page.getByRole('button', { name: /^Pioneer, Thu, Jun 17, virtual\. Attended/ })).toBeVisible()
  await expect(page.getByRole('button', { name: "Record today’s attendance" })).toBeDisabled()
  await expect(shown(page).locator('.visa__endorse')).toHaveText('Stamped 17 JUN 2027. 9 of 12, 75%. Right on the line.')
  await expect(page.locator('.stamper')).toHaveCount(0, { timeout: 5000 })
  await page.goto('./#/passport/hannah-kowalski?page=2')
  await expect(shown(page).getByText('Right on the line', { exact: true })).toBeVisible()
  await expect(shown(page).locator('.data__stat').filter({ hasText: 'Rank' })).toContainText('13th of 29, tied')

  // Standings picked it up. One more rep is above the line, and the new
  // hire, who missed today, is still unranked rather than last.
  await page.getByRole('link', { name: 'Standings' }).click()
  const hannah = page.locator('[data-rep="hannah-kowalski"]')
  await expect(hannah.locator('.board__rank')).toHaveText('Tied T13')
  await expect(hannah.locator('.board__status')).toHaveText('Above')
  await expect(hannah).toContainText('You')
  await expect(page.locator('.figures__value').nth(0)).toHaveText('15')
  await expect(page.locator('.figures__unit').nth(0)).toHaveText('of 29 ranked reps')
  await expect(page.locator('.figures__value').nth(2)).toHaveText('12')
  const clara = page.locator('[data-rep="clara-dubois"]')
  await expect(clara.locator('.board__stamps')).toHaveText('0 of 1')
  await expect(clara.locator('.board__status')).toHaveText('Unranked')

  // Filter by team, then search for nobody.
  await page.locator('label[for="team-west"]').click()
  await expect(page).toHaveURL(/team=west/)
  // Wait for the board itself to narrow before reading it.
  await expect(page.locator('[data-rep]')).toHaveCount(8)
  const teams = await page.locator('[data-rep] .board__team').allTextContents()
  expect(teams.every((t) => t.includes('West'))).toBe(true)
  // Naomi is the only West rep at 4th, but she's tied with two Canada reps
  // on the full board, so she keeps her T here and on the podium.
  await expect(page.locator('[data-rep="naomi-feld"] .board__rank')).toHaveText('Tied T4')
  await expect(page.locator('.podium__step--first .podium__rank')).toHaveText('Rank T4')
  await page.getByLabel('Search by name').fill('zzz')
  await expect(page.getByText('Nobody named “zzz” on West')).toBeVisible()
  await page.getByRole('button', { name: 'Clear search' }).click()
  await expect(page.locator('[data-rep]')).toHaveCount(8)

  // Selecting a rep opens their passport.
  await page.getByRole('link', { name: 'Ethan Park' }).first().click()
  await expect(page).toHaveURL(/#\/passport\/ethan-park\?page=2/)

  // Reset, and it's undoable.
  await page.getByRole('link', { name: 'Standings' }).click()
  await page.getByRole('button', { name: 'Reset demo' }).click()
  await expect(page.getByRole('button', { name: 'Undo' })).toBeVisible()
  await expect(page.locator('.figures__value').nth(2)).toHaveText('11')
  await expect(page.locator('.figures__value').nth(0)).toHaveText('14')
  await expect(page.getByRole('button', { name: "Record today’s attendance" })).toBeEnabled()
  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(page.locator('.figures__value').nth(2)).toHaveText('12')
  await page.getByRole('button', { name: 'Reset demo' }).click()
  await expect(page.locator('.figures__value').nth(2)).toHaveText('11')

  // Recording from someone else's passport stamps that passport, not the
  // rep in the View as box, and Standings then highlights them. The new
  // hire's first stamp puts her at 1 of 1, which still isn't a rank.
  await page.goto('./#/passport/clara-dubois?page=4')
  await page.getByRole('button', { name: /^Record today.s attendance/ }).click()
  await expect(page.getByRole('button', { name: /^Pioneer, Thu, Jun 17, virtual\. Attended/ })).toBeVisible()
  await expect(shown(page).locator('.visa__endorse')).toContainText('Stamped')
  await page.goto('./#/passport/clara-dubois?page=2')
  await expect(shown(page).locator('.data__stat').filter({ hasText: 'Rank' })).toContainText('Not yet 2 more trainings to go')
  await page.getByRole('link', { name: 'Standings' }).click()
  await expect(clara).toContainText('You')
  await expect(clara.locator('.board__status')).toHaveText('Unranked')
  await expect(page.locator('.podium__step--first .podium__name')).toHaveText('Jordan Hale')
  await expect(page.locator('.podium__rank').first()).toHaveText('Rank 1')
})

test('the app still works when storage is blocked', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('blocked', 'SecurityError')
      },
    })
  })
  await page.goto('./#/standings')
  await expect(page.getByRole('heading', { name: 'Standings' })).toBeVisible()
  await page.getByRole('button', { name: 'Demo', exact: true }).click()
  await expect(page.getByText('This browser is blocking storage')).toBeVisible()
  await page.getByRole('button', { name: "Record today’s attendance" }).click()
  await expect(page.locator('.figures__value').nth(2)).toHaveText('12')
  await expect(page.locator('.figures__value').nth(0)).toHaveText('15')
})

// Keyboard and screen reader basics. The arrow keys turn pages even after
// the demo panel's buttons and select, focus never drops to the page body
// (Open passport, either end of the book, Record, Undo, Escape, a new
// screen), every screen has its own title, and the slip opens on its title.
test('keyboard focus stays put and the arrows always turn pages', async ({ page }) => {
  const lost = () => page.evaluate(() => !document.activeElement || document.activeElement === document.body)
  const still = () => expect(page.locator('.book.is-turning')).toHaveCount(0)
  const demo = page.getByRole('button', { name: 'Demo', exact: true })

  await page.goto('./#/passport/hannah-kowalski')
  await expect(page).toHaveTitle('Hannah Kowalski’s passport · Training Passport 2027')
  await page.getByRole('button', { name: 'Open passport' }).focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/page=2/)
  // The cover leaves the moment the turn starts. Then wait for it to land.
  await expect(shown(page).locator('.cover')).toHaveCount(0)
  await still()
  expect(await lost(), 'focus dropped after Open passport').toBe(false)

  // The machine-readable strip reads as its label, not 88 chevrons.
  await expect(shown(page).getByRole('img', { name: 'Machine-readable zone for Hannah Kowalski' })).toBeVisible()

  // Preview a data state, go back to live data, then turn with the arrows.
  await demo.click()
  await page.getByRole('button', { name: 'Loading', exact: true }).click()
  const live = page.getByRole('button', { name: 'Live data' })
  await live.click()
  await expect(live).toHaveAttribute('aria-pressed', 'true')
  await live.focus()
  await page.keyboard.press('ArrowRight')
  await expect(page).toHaveURL(/page=3/)
  await expect(live).toHaveAttribute('aria-pressed', 'true')
  await expect(shown(page).locator('.page').first()).toBeVisible()
  await still()

  // Same from the View as select: the page turns and the rep stays.
  const viewAs = page.locator('#view-as')
  await viewAs.focus()
  await page.keyboard.press('ArrowLeft')
  await expect(page).toHaveURL(/page=2/)
  await expect(viewAs).toHaveValue('hannah-kowalski')
  await still()

  // Escape from inside the panel hands focus back to the Demo button.
  await page.keyboard.press('Escape')
  await expect(page.locator('#demo-panel')).toBeHidden()
  await expect(demo).toBeFocused()

  // Back to the front from the back cover, then Previous page at the front:
  // focus lands on the book, then stays on the button that can't go further.
  await page.goto('./#/passport/hannah-kowalski?page=7')
  await page.getByRole('button', { name: 'Back to the front' }).focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/hannah-kowalski$/)
  await expect(shown(page).locator('.cover--back')).toHaveCount(0)
  await still()
  expect(await lost(), 'focus dropped after Back to the front').toBe(false)
  await prev(page).focus()
  await page.keyboard.press('Enter')
  await expect(prev(page)).toBeFocused()
  await expect(prev(page)).toBeDisabled()

  // A new screen gets its own title and focus moves to the top of it.
  await page.getByRole('link', { name: 'Standings' }).click()
  await expect(page).toHaveTitle('Standings · Training Passport 2027')
  await expect(page.locator('#main')).toBeFocused()
  const search = page.getByLabel('Search by name')
  await search.fill('zzz')
  await page.getByRole('button', { name: 'Clear search' }).click()
  await expect(search).toBeFocused()
  await page.getByRole('link', { name: 'Ethan Park' }).first().click()
  await expect(page).toHaveTitle('Ethan Park’s passport · Training Passport 2027')
  await expect(page.locator('#main')).toBeFocused()

  // The slip opens on its heading, so it starts at the top.
  await page.goto('./#/passport/hannah-kowalski?page=3')
  await shown(page).getByRole('button', { name: /^Zebra, Tue, Jan 12/ }).click()
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Zebra' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()

  // Record and Undo keep focus in the panel.
  await demo.click()
  const record = page.getByRole('button', { name: 'Record today’s attendance' })
  await record.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('button', { name: /^Pioneer, Thu, Jun 17, virtual\. Attended/ })).toBeVisible()
  await expect(record).toBeDisabled()
  await expect(record).toBeFocused()
  await page.getByRole('button', { name: 'Reset demo' }).click()
  await page.getByRole('button', { name: 'Undo' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('button', { name: 'Reset demo' })).toBeFocused()
  await expect(record).toBeDisabled()
})

// Grab-to-tilt. With a mouse, drag the cover: it tilts, the foil lights up,
// and when you let go it settles flat with nothing left behind. The drag
// isn't a click, but a click after it still opens the passport, and the data
// page's laminate lights up the same way without moving anything. On a phone
// (Chrome only, since it needs real touch input), hold, wobble a pixel the
// way a resting finger does, then drag up: it stays held and the page
// doesn't scroll. A still tap that's a little slow still opens a slot.
test('the passport can be picked up and tilted', async ({ page, browserName }, info) => {
  const phone = info.project.name.startsWith('phone')
  test.skip(phone && browserName !== 'chromium', 'real touch input needs Chrome')
  const stage = page.locator('.passport__stage')
  const settled = async () => {
    await expect(stage).not.toHaveClass(/is-lit/, { timeout: 4000 })
    expect(await stage.evaluate((el) => el.style.transform)).toBe('')
    expect(await page.locator('.book__slot .foil, .book__slot .cover__mark, .book__slot .data__light').evaluateAll((els) => els.map((el) => (el as HTMLElement).style.length))).not.toContain(3)
  }

  if (!phone) {
    await page.goto('./')
    const cover = shown(page).locator('.cover')
    await expect(cover).toBeVisible()
    const box = (await cover.boundingBox())!
    const x = box.x + box.width / 2
    const y = box.y + box.height / 2
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x + 80, y + 20, { steps: 8 })
    await expect(stage).toHaveClass(/is-held/)
    await expect.poll(() => stage.evaluate((el) => el.style.transform)).toContain('rotateY')
    await expect.poll(() => shown(page).locator('.cover__year').evaluate((el) => Number(el.style.getPropertyValue('--shine')))).toBeGreaterThan(0.5)
    await page.mouse.up()
    await settled()
    await expect(page).toHaveURL(/#\/passport\/hannah-kowalski$/)
    await page.mouse.click(x, y)
    await expect(page).toHaveURL(/page=2/)

    // The data page's laminate lights up the same way. It's paint only: the
    // page keeps its size, the film never takes a click, and a drag across
    // the page doesn't turn it.
    const data = shown(page).locator('.page--data')
    await expect(data).toBeVisible()
    const size = () => data.evaluate((el) => [(el as HTMLElement).offsetWidth, (el as HTMLElement).offsetHeight])
    const flat = await size()
    expect(await shown(page).locator('.data__laminate').evaluate((el) => getComputedStyle(el).pointerEvents)).toBe('none')
    const d = (await data.boundingBox())!
    await page.mouse.move(d.x + d.width / 2, d.y + d.height / 2)
    await page.mouse.down()
    await page.mouse.move(d.x + d.width / 2 - 80, d.y + d.height / 2 + 20, { steps: 8 })
    await expect(stage).toHaveClass(/is-held/)
    await expect.poll(() => shown(page).locator('.data__light').evaluate((el) => Number((el as HTMLElement).style.getPropertyValue('--shine')))).toBeGreaterThan(0.5)
    expect(await size()).toEqual(flat)
    await page.mouse.up()
    await settled()
    await expect(page).toHaveURL(/page=2/)
    return
  }

  const cdp = await page.context().newCDPSession(page)
  const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', x = 0, y = 0) =>
    cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] })
  await page.goto('./#/passport/hannah-kowalski?page=3')
  const slot = shown(page).getByRole('button', { name: /^Zebra, Tue, Jan 12/ })
  await expect(slot).toBeVisible()
  const box = (await slot.boundingBox())!
  const x = box.x + box.width / 2
  const y = box.y + box.height / 2
  await touch('touchStart', x, y)
  await page.waitForTimeout(100)
  await touch('touchMove', x + 1, y)
  await page.waitForTimeout(400)
  for (let i = 1; i <= 10; i++) await touch('touchMove', x + 1, y - i * 12)
  await expect(stage).toHaveClass(/is-held/)
  expect(await page.evaluate(() => window.scrollY)).toBe(0)
  await touch('touchEnd')
  await settled()
  await expect(page.getByRole('dialog')).toBeHidden()

  // Lift the finger right after the book is picked up, still without moving.
  await touch('touchStart', x, y)
  await page.waitForFunction(() => document.querySelector('.passport__stage')!.classList.contains('is-held'), null, { polling: 'raf' })
  await touch('touchEnd')
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Zebra' })).toBeVisible()
})

// Phones only. Every page of two passports (the default rep and the new hire)
// fits on its paper, the paper fits on the screen under the top bar, and the
// turn buttons are on screen. Recording today mustn't make the book grow.
test('every passport page fits on a phone screen', async ({ page }, info) => {
  test.skip(!info.project.name.startsWith('phone'), 'phones only')

  const check = async (rep: string, p: number) => {
    await page.goto(`./#/passport/${rep}${p ? `?page=${p}` : ''}`)
    await expect(shown(page).locator('.page').first()).toBeVisible()
    await page.evaluate(() => document.fonts.ready)
    const r = await page.evaluate(() => {
      const sheet = document.querySelector('.book__slot .page')!
      const box = sheet.getBoundingClientRect()
      const spill = [...sheet.querySelectorAll('*')]
        .map((el) => ({ el, b: el.getBoundingClientRect() }))
        .filter(({ b }) => b.height > 0 && b.bottom > box.bottom + 1)
        .map(({ el }) => el.className.toString())
      const controls = document.querySelector('.passport__controls')!.getBoundingClientRect()
      return { spill, bottom: box.bottom, vh: window.innerHeight, controls: controls.bottom, book: document.querySelector('.book')!.getBoundingClientRect().height }
    })
    expect(r.spill, `${rep} page ${p}: content runs past the bottom of the page`).toEqual([])
    expect(r.bottom, `${rep} page ${p}: the page runs past the bottom of the screen`).toBeLessThanOrEqual(r.vh)
    expect(r.controls, `${rep} page ${p}: the turn buttons are off screen`).toBeLessThanOrEqual(r.vh + 1)
    return r.book
  }

  for (const rep of ['hannah-kowalski', 'clara-dubois']) {
    for (const p of [0, 1, 2, 3, 4, 5, 6, 7]) await check(rep, p)
  }

  const before = await check('hannah-kowalski', 4)
  await page.getByRole('button', { name: 'Demo' }).click()
  await page.getByRole('button', { name: 'Record today’s attendance' }).click()
  await page.getByRole('button', { name: 'Hide demo' }).click()
  await expect(shown(page).locator('.visa__endorse')).toBeVisible()
  expect(await check('hannah-kowalski', 4), 'recording made the book grow').toBeLessThanOrEqual(before + 0.5)
})
