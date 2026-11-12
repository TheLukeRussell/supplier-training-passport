# Supplier Training Passport (demo)

A clickable demo of the 2027 Supplier Training Passport. Starting in 2027, attending a set share of supplier trainings is part of qualifying for President's Club. Reps need to see where they stand, and leadership needs one view of everybody. This is the experience I want to build, mocked up so we can click through it before building the real thing.

No sign-in, no backend. Everything runs on sample data, and every name and number in it is made up. It wears the ScanSource brand: the logo in the top bar and in gold foil on the back cover, and the brand palette and type on the pages and the standings. The passport covers are navy leather with gold foil, like a real passport, on purpose not brand colours.

Live demo: https://thelukerussell.github.io/supplier-training-passport/

## What's in it

- **Passport.** A literal passport book. Two-page spreads on a laptop, one page at a time on a phone. A navy leather front cover with gold foil that catches the light as it turns, an inside cover that explains the rules, a data page (rate, rank, next training, what it takes to reach the line, and a machine-readable strip along the bottom), four visa pages, one per quarter, and a leather back cover with the logo in gold foil. Every training you attended is a stamp, and every slot says whether the training is virtual or in person. Tap any slot for the details. Turn pages by swiping, with the arrow buttons, or with the left and right keys.
- **Standings.** The scoreboard. Three figures up top, the top three on a podium, and the full board with the President's Club line drawn across it. Filter by team, search by name, tap anyone to open their passport.
- **Demo panel.** The dashed "Demo" button in the top bar. Switch who you're viewing as, record today's attendance, reset (you can undo it), and preview the loading, empty and error states. Recording today is the fun part: a stamper swings in, hovers over today's slot and presses down, the page takes the hit, the ink shows as it lifts away, and a note gets written under the stamps with your new count. Standings rows slide to their new ranks too. None of this is meant to ship.

## Run it

You need Node 22.18 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:5173/supplier-training-passport/

Other scripts:

```bash
npm test            # unit tests for everything in src/lib
npm run typecheck   # TypeScript across the app, tests and scripts
npm run test:e2e    # Playwright smoke test, uses the Chrome you already have installed
npm run test:iphone # the same smoke test in WebKit as an iPhone 16 Pro Max (run npx playwright install webkit once)
npm run build       # production build into dist/
npm run data        # regenerate the sample data
```

The smoke test runs the whole demo at 390px and 1280px wide: open the passport, turn every page, record attendance, check the standings moved, filter, reset. On phone sizes it also checks every page of two passports fits: nothing runs past the bottom of its page, the page fits on the screen under the top bar, the turn buttons are on screen, and recording today doesn't make the book grow. It's local only for now, not in CI. The iPhone run exists because Safari lays some things out differently than Chrome, and that's where pages once ran off the bottom of the screen.

## The rules

They all live in `src/config.ts` and `src/lib/rules.ts`.

- **The line** is `LINE = 0.75`. That's a placeholder until leadership picks the real number, and the app says "placeholder" next to it everywhere it shows up.
- **Rate** is trainings attended divided by trainings invited to, only counting trainings that already happened. Upcoming ones don't hurt anybody.
- **Rank** sorts by rate. Ties share a rank (1, 2, 2, 4) and show as T2 on the board. Someone with nothing recorded yet isn't ranked.
- **Change** is how far someone moved since the most recent training.
- **Streak** is how many trainings in a row someone attended, counting back from the latest one. Trainings they weren't invited to don't break it.
- **Attend the next N** is the smallest N where (attended + N) / (recorded + N) reaches the line, capped by what's left this year. If N is more than what's left, it says the line is out of reach.
- **Today** is pinned to `DEMO_TODAY = 2027-06-17`, which is a training day, so the passports show a mix of stamped, missed and upcoming. Today's training only counts once the demo records it.

## How the data works

`src/data/source.ts` is the only file that knows where the data comes from. Right now it fetches `public/data/attendance.json`. Swap that for an API later and nothing else has to change.

The file is shaped like the export we'll get: one row per rep per training.

```json
{
  "rep_email": "hannah.kowalski@example.com",
  "rep_name": "Hannah Kowalski",
  "team": "East",
  "training_id": "t12",
  "supplier": "Pioneer",
  "title": "Pioneer partner training",
  "date": "2027-06-17",
  "format": "virtual",
  "invited": true,
  "attended": false
}
```

The sample comes from `scripts/generate-data.ts`. It's seeded, so `npm run data` writes the same file every time. It has 30 reps across East, Central, West and Canada, and 24 trainings on weekdays, about two a month. Virtual trainings invite everybody. In-person ones are regional, which is why invite counts differ by team. I picked the attendance counts by hand so the board has the cases worth showing:

- one perfect record
- one rep sitting exactly on the line
- a tie (two reps tied for second)
- a new hire who started June 1, isn't invited to anything before that, and has no stamps yet
- roughly half the reps above the line
- a rep who crosses the line once today's attendance is recorded (the demo opens as them)

`src/lib/sample-data.test.ts` checks all of that, so if someone edits the script and breaks the story, the tests go red.

## Swapping in the real attendance export

1. **Don't commit it here.** This repo and the Pages site are public, and the real export has real names and emails. Either serve it from somewhere that needs a login and point `source.ts` at that, or run the app privately.
2. **Match the columns.** If the export uses different column names, map them in `toRow()` in `src/data/source.ts`. It already accepts true/false, yes/no, 1/0 and x for the two yes-or-no columns, and anything mentioning "person" as in-person.
3. **Use the real date.** Change `DEMO_TODAY` in `src/config.ts` to today's date (or compute it), and decide when a day's training counts as recorded. In the demo that's the "Record today's attendance" button. In the real thing it's whenever the export says so.
4. **Set the line.** Replace the 0.75 placeholder and drop the word "placeholder" from the UI.
5. **Pull the demo panel.** Remove `DemoPanel` from `src/App.tsx` and the Demo button from the top bar.

## Deploying

Every push to `main` runs `.github/workflows/deploy.yml`: install, typecheck, unit tests, build, then publish `dist/` with the official GitHub Pages actions. Vite's base path is `/supplier-training-passport/` to match the repo name, and routes live after the `#` so Pages never needs a 404 workaround.

The site asks search engines to stay away (`robots.txt` and a noindex tag).

## Where things are

```
src/config.ts           every rule and knob in one place
src/data/source.ts      where the data comes from
src/lib/                the rules as plain functions, plus their tests
src/state/              app state, demo storage, media queries
src/components/         the two screens, one stylesheet per component
src/styles/             tokens, base rules and the main stylesheet
scripts/                the sample data generator
tests/                  the Playwright smoke test
```
