# Supplier Training Passport (demo)

Starting in 2027, part of qualifying for President's Club is showing up to supplier trainings. Reps need to know where they stand, and leadership needs one place to see everybody. This is a clickable mockup of how I want that to work, so we can click through it before anyone builds the real thing.

It all runs on sample data. There's no login and no backend, and every name and number is made up. It's branded ScanSource (the logo up top and in gold on the back cover, brand colors and type on the pages and the standings). The covers are navy leather with gold foil instead of brand colors, because that's what a passport looks like.

Live demo: https://thelukerussell.github.io/supplier-training-passport/

## What's in it

**Passport.** It's an actual passport book: two-page spreads on a laptop, one page at a time on a phone. There's a front cover, an inside cover with the rules, and a data page with your rate, rank, next training, what it takes to hit the line and a machine-readable strip at the bottom like a real one. After that come four visa pages (one per quarter) and a back cover. Every training you made it to is a stamp, and every slot says whether it was virtual or in person. Tap a slot for the details. Swipe, use the arrow buttons, or use the left and right keys to turn pages.

You can also grab the passport and tilt it to watch the gold foil catch the light. Drag it with the mouse, or on a phone press and hold, then drag. Let go and it drops back flat. The inside cover and the data page have a clear film printed with fine gold lines, like the laminate on a real passport. You barely see it until you tilt the book, then the lines light up. On a laptop it's one band of light running across both pages.

**Standings.** The scoreboard. Three numbers at the top, a podium for the top three, then everybody, with the President's Club line drawn across the board. Filter by team, search by name, and tap anyone to open their passport.

**Demo panel.** The dashed Demo button in the top bar. You can view as a different rep, record today's attendance, reset (with undo), and preview the loading, empty and error states. Recording today's attendance is the one to show people. A stamper comes in and stamps today's slot, then a note gets written under the stamps with the new count, and over on Standings the rows slide to their new spots. The panel is only there for demos and won't ship.

## Run it

You need Node 22.18 or newer.

```bash
npm install
npm run dev
```

Then go to http://localhost:5173/supplier-training-passport/

Other scripts:

```bash
npm test            # unit tests for everything in src/lib
npm run typecheck   # TypeScript across the app, tests and scripts
npm run test:e2e    # Playwright smoke test in the Chrome you already have
npm run test:iphone # same smoke test in WebKit as an iPhone 16 Pro Max (run npx playwright install webkit once first)
npm run build       # production build into dist/
npm run data        # regenerate the sample data
```

The smoke test clicks through the whole demo at 390px and 1280px wide. It opens the passport, turns every page, records attendance, checks that the standings moved, filters and resets. On phone sizes it also checks that every page of two passports actually fits: nothing spills past the bottom of a page, the page fits under the top bar, the turn buttons stay on screen, and recording today doesn't make the book taller. It only runs locally for now, not in CI. The iPhone run is there because Safari lays things out differently than Chrome, and that's where pages used to run off the bottom of the screen.

## The rules

Everything's in `src/config.ts` and `src/lib/rules.ts`.

- **The line** is `LINE = 0.75`. It's a placeholder until leadership picks the real number, and the app says "placeholder" everywhere it shows up.
- **Rate** is trainings attended divided by trainings you were invited to. It only counts trainings that already happened, so upcoming ones don't hurt anyone.
- **Rank** goes by rate. Ties share a rank (1, 2, 2, 4) and show as T2 on the board. If you don't have anything recorded yet, you're not ranked.
- **Change** is how many spots someone moved since the last training.
- **Streak** is how many trainings in a row you've attended, counting back from the latest one. A training you weren't invited to doesn't break it.
- **Attend the next N** is the smallest N where (attended + N) / (recorded + N) gets you to the line, capped at what's left this year. If you'd need more than what's left, it tells you the line is out of reach.
- **Today** is pinned to `DEMO_TODAY = 2027-06-17`. That's a training day, so the passports show a mix of stamped, missed and upcoming. Today's training doesn't count until you record it in the demo.

## How the data works

`src/data/source.ts` is the only file that knows where the data comes from. Right now it reads `public/data/attendance.json`. When there's an API, swap it in there and nothing else has to change.

The file is shaped like the export we'll get, one row per rep per training:

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

The sample data comes from `scripts/generate-data.ts`. It's seeded, so `npm run data` writes the same file every time. There are 30 reps across East, Central, West and Canada, and 24 trainings on weekdays, about two a month. Virtual trainings invite everyone. In-person ones are regional, which is why invite counts are different by team. I set the attendance by hand so the board shows the cases I wanted to show:

- one perfect record
- one rep sitting exactly on the line
- two reps tied for second
- a new hire who started June 1, wasn't invited to anything before that, and has no stamps yet
- about half the reps above the line
- a rep who crosses the line when today's attendance gets recorded (the demo opens as them)

`src/lib/sample-data.test.ts` checks every one of those. If someone changes the script and breaks the story, the tests fail.

## Swapping in the real attendance export

1. **Don't commit it to this repo.** The repo and the site are public, and the real export has real names and emails. Host it somewhere behind a login and point `source.ts` at it, or run the app privately.
2. **Match the columns.** If the export's column names are different, map them in `toRow()` in `src/data/source.ts`. The two yes or no columns already take true/false, yes/no, 1/0 and x, and anything with "person" in it counts as in person.
3. **Use the real date.** Change `DEMO_TODAY` in `src/config.ts` to today (or calculate it), and decide when a day's training counts as recorded. In the demo that's the Record button. For real, it's whenever the export says so.
4. **Set the line.** Replace the 0.75 and take "placeholder" out of the UI.
5. **Pull the demo panel.** Remove `DemoPanel` from `src/App.tsx` and the Demo button from the top bar.

## Deploying

Every push to `main` runs `.github/workflows/deploy.yml`. It installs, typechecks, runs the unit tests, builds, and publishes `dist/` to GitHub Pages with the official Pages actions. Vite's base path is `/supplier-training-passport/` to match the repo name, and the routes live after the `#`, so Pages doesn't need a 404 workaround.

Search engines are told to stay out (`robots.txt` and a noindex tag).

## Where things are

```
src/config.ts           every rule and setting in one place
src/data/source.ts      where the data comes from
src/lib/                the rules as plain functions, with their tests
src/state/              app state, demo storage, media queries
src/components/         the two screens, one stylesheet per component
src/styles/             tokens, base styles and the main stylesheet
scripts/                the sample data generator
tests/                  the Playwright smoke test
```
