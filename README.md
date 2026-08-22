# Job Dashboard

A personal job-search dashboard: an interview pipeline tracker (with a STAR
story bank, behavioral skills tracker, and technical prep tracker to follow
in later milestones). Built against [`interview-pipeline-spec.md`](./interview-pipeline-spec.md).

**Status:** Milestones 1 (Interview Pipeline Tracker), 2 (Story Bank), and 3
(Behavioral Skills Self-Assessment) are complete. AI Coach, Technical Prep,
and the unified Dashboard are scaffolded as "coming soon" tabs and will be
built out in later milestones (see [Milestones](#milestones--roadmap)
below).

## Concept

The UI leans into a vintage travel-journal / analog departures-board idea:
companies are "gates," interviews are "flights," and cities/remote status
are "destinations." Interviews group by company, sub-grouped by location,
with monospace data rows and status badges in a warm parchment palette.

## Tech stack & why

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + Vite, plain JavaScript (no TypeScript) | Matches the spec's default recommendation. Plain JS keeps the toolchain minimal and easy to explain in a bootcamp write-up — there's no shared types across the client/server boundary yet, so TypeScript's main benefit (catching cross-boundary mismatches) wouldn't pay for its setup cost at this scale. Worth revisiting if the project grows. |
| Backend | Node + Express | A tiny REST API is the simplest way to give the browser a *real* local file to persist to — the browser itself can't durably write files outside of user-triggered downloads. Express keeps routing/middleware boilerplate low. |
| Persistence | Single JSON file (`server/data/db.json`), written atomically | Trivial data volume (spec section 6) means a real database is overkill. Writes go through an in-process queue and a write-temp-file-then-rename step so a crash mid-write can't corrupt the file, and two overlapping requests can't clobber each other (see [Persistence details](#persistence-details)). |
| Tests | Node's built-in test runner (`node --test`) | No extra test framework dependency needed — Node 18+ ships one. |

No database, ORM, or auth library was introduced — the spec explicitly
rules those out for this project.

## Project layout

```
server/           Express API + JSON-file store
  src/
    app.js          Express app assembly (no app.listen — used by tests too)
    index.js         Boots the app on PORT (default 4000)
    store.js         Generic JSON-file persistence (atomic writes, write queue)
    routes/
      interviews.js   Interview CRUD routes + validation
      stories.js       Story CRUD routes + validation
      competencies.js  Competency CRUD routes + append-only rating history
  data/
    db.seed.json      Sample data, copied to db.json on first run
    db.json           The real local database (gitignored — personal data)
  tests/              node:test suites for store.js, interviews, stories,
                      and competencies

client/           React (Vite) frontend
  src/
    api/                     fetch wrappers: interviews.js, stories.js,
                              competencies.js
    lib/                     constants, formatting, grouping/next-up logic
                              (interviewLogic.js), coverage/tag logic
                              (storyLogic.js), competencies.js
    components/              StatusBadge, NextUpBanner, FilterBar,
                              CompanyGroup, InterviewRow, InterviewFormModal,
                              StoryCard, StoryFormModal, CompetencyTagPicker,
                              InterviewLinker, CompetencyCoverage,
                              CompetencyRow, CompetencyFormModal,
                              CompetencySparkline, ErrorBanner
    pages/
      Pipeline.jsx            Milestone 1 — fully implemented
      Stories.jsx              Milestone 2 — fully implemented
      Skills.jsx                Milestone 3 — fully implemented
      ComingSoon.jsx           placeholder for the remaining two tabs
    styles/                   parchment theme + component styles
```

## Setup

Requires **Node 18+** (developed on Node 22).

```bash
npm install
```

This installs both workspaces (`client` and `server`) from the root via npm
workspaces.

## Running it

```bash
npm run dev
```

Starts the API (port 4000) and the Vite dev server (port 5173) together.
Open **http://localhost:5173**. The Vite dev server proxies `/api/*`
requests to the Express server, so the client never hardcodes a host/port.

Run them separately if you prefer:

```bash
npm run dev:server   # API only, http://localhost:4000
npm run dev:client   # frontend only, http://localhost:5173
```

On first run, `server/data/db.json` doesn't exist yet — it's created
automatically, seeded from `server/data/db.seed.json` (a handful of sample
interviews across a few companies, plus the default competency rubric with
a bit of rating history, so the grouping/filtering/next-up logic and the
growth-over-time view both have something to show immediately). Delete
`server/data/db.json` at any time to reset to that seed state; edit or
delete the seed file if you'd rather start from a truly empty board.

## Testing

```bash
npm test
```

Runs the server test suite (60 tests): CRUD behavior of the JSON store
(including a concurrency test — see below), interview/story/competency
validation rules, and full HTTP-level request/response checks for every
route.

## Persistence details

Section 6 of the spec calls out that a failed save must never fail silently
or discard unsaved input. Two things make that true here:

- **Atomic writes.** Every write goes to a temp file first, then
  `rename()`s over `db.json`. A crash mid-write leaves the old file intact.
- **Serialized writes.** Concurrent requests are queued so that a
  read-modify-write cycle (e.g. two rapid edits) can never interleave and
  silently drop one of them. This was actually caught by
  `server/tests/store.test.js`'s concurrency test during development — an
  earlier version of the queue only serialized the final write step, not
  the read that preceded it, and lost 9 of 10 concurrent creates.
- **No silent failures.** Every store/route failure throws/rejects with a
  message; the Express error handler turns that into a JSON `{ error }`
  response instead of a generic crash, and the frontend's `InterviewFormModal`
  keeps the form open with the user's entered data and shows the error
  rather than closing and discarding it.

## Milestones / roadmap

1. ✅ **Interview Pipeline Tracker** — CRUD, company/location grouping,
   status filters, "next up" summary, reliable persistence.
2. ✅ **Story Bank** — STAR story CRUD, competency tagging (default list +
   free-form custom tags), interview-linking, coverage view (flags tags
   with fewer than 2 stories as "thin").
3. ✅ **Behavioral Skills Self-Assessment** — editable rubric, 1–5
   self-ratings with an append-only timestamped history (a sparkline plus
   a plain-text history table per competency), cross-referenced against
   Story Bank tag counts so you can see rating vs. story coverage side by
   side.
4. ⬜ AI Coach — practice-answer feedback via the Claude API.
5. ⬜ Technical Prep Tracker — topics, confidence ratings, review dates.
6. ⬜ Unified Dashboard Home — aggregates all four areas.

See `interview-pipeline-spec.md` for full functional requirements.

## Data model (current)

```
Interview {
  id, company, role, city, remote (bool),
  stage: "Phone Screen" | "Technical Screen" | "Behavioral Round" |
         "Onsite/Panel" | "Final Round" | "Offer Discussion" | "Other",
  format: "Phone" | "Video" | "Onsite",
  date, time,
  status: "upcoming" | "rescheduled" | "completed" | "advanced" |
          "offer" | "rejected" | "withdrawn",
  interviewers: [{ name, title }],
  prepNotes, debriefNotes,
  createdAt, updatedAt
}

Story {
  id, title, situation, task, action, result,
  competencyTags: [string],   // default set + free-form custom tags
  usedFor: [interviewId],
  createdAt, updatedAt
}

Competency {
  id, name, selfRating (1-5), lastAssessed, notes,
  history: [{ date, rating, note }],   // append-only — every save is a
                                        // new dated entry, never a rewrite
  createdAt, updatedAt
}
```

`technicalTopics` already exists in the store (see `server/src/store.js`)
with an empty array, ready for Milestone 5 to add routes and UI without a
data migration. The default competency name list lives in
`client/src/lib/competencies.js`, shared between the Story Bank's tag
picker (Milestone 2) and the self-assessment rubric (Milestone 3) so the
two stay cross-referenceable, per the spec — the Skills page counts, for
each competency, how many stories are tagged with a matching name
(case-insensitive) and shows that count right next to the rating.
