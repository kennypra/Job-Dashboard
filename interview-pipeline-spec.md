# Project Spec: Interview Pipeline

## 1. Summary
A personal job-search dashboard that tracks upcoming and past interviews, stores reusable behavioral (STAR) stories, tracks growth in behavioral interviewing skills, and tracks technical study progress.

## 2. Goal & Success Criteria
- **Primary goal:** A working local dashboard I can use during my job search to manage interview logistics, prep behavioral stories, track data science skill growth, and study technical topics.
- **Success criteria:**
  - [ ] I can log an interview (company, role, location, interviewers, date/time, stage, status) and it persists reliably between sessions
  - [ ] Interviews are grouped by company and clearly distinguish between different city/remote locations for the same company
  - [ ] I can build and tag reusable STAR stories and see which competencies are well-covered vs. thin
  - [ ] I can self-rate behavioral competencies and see how ratings change over time
  - [ ] I can track confidence/review status on technical topics
  - [ ] I can paste a practice behavioral answer and get structured AI feedback against a rubric
  - [ ] A home dashboard view surfaces what needs attention (upcoming prep, weak competencies, stale topics)

## 3. Users & Context
- **Who uses this:** Just me (single user, no accounts/auth needed)
- **Where it runs:** Local machine, browser-based UI
- **Existing systems:** None to integrate with or replace — this is a new, standalone tool. A rough Phase 1 prototype exists as a self-contained HTML artifact (see Section 8) but was built in a chat environment with unreliable persistence, so it should be treated as a UI/UX reference only, not a foundation to build on top of.

## 4. Scope

### In scope
- Interview pipeline tracker (add/edit/delete, grouped by company + location, status tracking, prep/debrief notes)
- STAR story bank with competency tagging and interview-linking
- Behavioral skills self-assessment with rating history
- Technical concept/topic tracker with confidence ratings
- AI-assisted feedback ("coach") on practice behavioral answers via the Claude API
- A unified dashboard home view

### Out of scope (explicitly not doing)
- Multi-user support, accounts, or authentication
- Cloud sync / hosted backend (this is a local-first tool)
- Mobile app (browser-based, responsive is nice-to-have but not required)
- Integration with external job boards or ATS systems
- Real-time mock-interview simulation (mentioned only as a possible future stretch goal)

## 5. Functional Requirements

1. **Interview CRUD** — Add, edit, and delete interview records with fields: company, role, city, remote flag, stage (Phone Screen / Technical Screen / Behavioral Round / Onsite-Panel / Final Round / Offer Discussion / Other), format (Phone/Video/Onsite), date, time, status (upcoming / rescheduled / completed / advanced / offer / rejected / withdrawn), interviewer(s) (repeatable name + optional title), prep notes, debrief notes.
2. **Company/location grouping** — Interviews display grouped by company, with each group summarizing round count and the distinct cities/remote status involved. Interviews within a group sorted by date.
3. **Status filtering** — Filter the interview list by status (All, Upcoming, Awaiting Result, Advanced, Offers, Closed Out).
4. **"Next up" summary** — Dashboard/pipeline view surfaces the single closest upcoming interview at all times.
5. **STAR story builder** — Create/edit/delete stories with Situation, Task, Action, Result fields, a title, and multiple competency tags (e.g. Leadership, Conflict, Failure, Ownership).
6. **Story-to-interview linking** — Mark which interview(s)/interviewer(s) a given story has been used with.
7. **Competency coverage view** — Show which behavioral competencies have strong story coverage and which are thin, based on story tags.
8. **Behavioral self-assessment** — Editable competency rubric with self-ratings (e.g. 1–5) and a timestamped history so growth is visible over time, not just a current snapshot.
9. **Technical topic tracker** — List of technical topics/concepts by category, each with a confidence rating, last-reviewed date, and optional links to specific interviews/companies known to test that area.
10. **AI coach feedback** — Text input where I paste a practice behavioral answer; sends it to the Claude API along with the competency rubric and returns structured feedback (STAR structure quality, clarity, specificity, suggested improvements).
11. **Unified dashboard home** — Single view summarizing: upcoming interviews needing prep, weakest-rated competencies, technical topics overdue for review, and basic trend stats (stories written, interviews completed, average self-rating over time).
12. **Reliable local persistence** — All data (interviews, stories, ratings, topics) must save automatically and survive app restarts without relying on chat-session-scoped storage.

## 6. Non-Functional Requirements
- **Performance:** Trivial data volume (single user, likely dozens to low hundreds of records per entity) — no performance concerns expected; standard local read/write is fine.
- **Security/privacy:** All data is personal and local only. No data should be sent anywhere except the explicit AI coach feature (Section 5, item 10), which calls the Claude API directly with only the pasted answer + rubric — no other stored data should be sent unless I explicitly request it (e.g., "give feedback using context from Interview X").
- **Reliability:** Data must not be lost on save failure — if a save fails, the app should clearly surface an error rather than fail silently or discard unsaved input (this was a real problem in the earlier prototype and should be avoided here).
- **Accessibility:** Reasonable contrast and keyboard-navigable forms; not required to meet a formal accessibility standard, but shouldn't actively work against it.

## 7. Tech Stack & Constraints
- **Language/framework:** Your choice, but should default to a React (Vite) frontend given the interactive dashboard requirements — explain the reasoning if you choose differently.
- **Existing codebase:** None — this is a fresh build. Treat the HTML prototype (attached separately) as a design/UX reference only.
- **Persistence:** Local, real, and durable — e.g. a local JSON-file-backed store. Do not depend on any chat-platform-specific storage API.
- **Libraries to use/avoid:** No strong preferences beyond keeping dependencies reasonable for a bootcamp project that needs to run easily on my machine and be explainable in a write-up.
- **Deployment target:** Local development machine (`npm run dev` or equivalent). Packaging as a desktop app is a nice-to-have, not required.
- **Must be compatible with:** Standard modern browser (no legacy browser support needed).

## 8. Data & Interfaces

### Data models

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
  competencyTags: [string],
  usedFor: [interviewId],
  createdAt, updatedAt
}

Competency {
  id, name, selfRating (1-5), lastAssessed, notes,
  history: [{ date, rating, note }]
}

TechnicalTopic {
  id, category, name, confidenceRating (1-5), lastReviewed,
  linkedInterviews: [interviewId],
  practiceLog: [{ date, note }]
}
```

### External APIs
- Claude API (or equivalent LLM API) for the AI coach feature (Section 5, item 10) — sends a practice answer + rubric, returns structured feedback.

### File formats
- No specific import/export format required yet, but a "export all data as JSON" / "import from JSON" capability would be a good resilience feature given past persistence issues.

## 9. UX / Design Notes
**Concept:** A vintage travel-journal / analog departures board. Companies are "gates," interviews are "flights," cities/remote status are "destinations." This should drive both the grouping logic (by company, sub-grouped by location) and the visual language (status badges, monospace data rows).

**Visual tokens (light parchment palette):**
- Background: warm tan/parchment `#ece0c8`
- Panels: cream `#f6efe0` / deeper tan `#e9dcc0`
- Text: espresso brown `#3a2e22` (primary), `#6b5d4a` (dim), `#9c8f78` (faint)
- Accents: brass/mustard `#b8752c` (primary/upcoming), deep teal `#2f6f66` (completed/advanced), brick red `#a3453f` (rescheduled/rejected), olive green `#4f7a4a` (offer), warm grey `#7d7260` (closed out)
- Type: monospace (IBM Plex Mono) for data/labels, sans-serif (Inter) for body/notes and longer entries (story text, notes)
- Tone: calm, organized, personal — not a generic SaaS template

**Reference assets:** A working HTML prototype demonstrating the Phase 1 interview pipeline view (grouping, filters, add/edit modal, status badges) is available and should be used as the layout/style reference for the interview pipeline screen specifically.

## 10. Constraints & Guardrails
- Do not rely on any storage mechanism scoped to a chat/artifact session — persistence must survive independent of any particular chat tool.
- Don't add authentication, multi-user support, or cloud infrastructure — this is intentionally a local single-user tool.
- Don't silently swallow save/write errors — surface them clearly.
- No secrets/credentials/PII beyond what I enter myself (interviewer names, company names) — nothing here is regulated data, but treat it as personal and keep it local.
- Ask before adding new major dependencies or frameworks not already agreed on here.
- Keep the four feature areas (pipeline, stories, skills, technical) reasonably decoupled so they can be built and reviewed incrementally per the milestones below.

## 11. Open Questions / Assumptions
- Exact competency rubric list (default set of behavioral competencies) is not finalized — suggest a sensible default set (e.g. Leadership, Ownership, Conflict Resolution, Ambiguity, Failure/Learning, Collaboration, Prioritization) and let me edit it in-app.
- Desktop packaging (Tauri/Electron) vs. plain local web app — defaulting to plain local web app unless told otherwise.
- Exact prompt/rubric structure for the AI coach feature (Section 5, item 10) is not yet written — propose one as part of Milestone 4 rather than blocking on it now.

## 12. Milestones / Delivery Plan
1. **Milestone 1 — Interview Pipeline Tracker:** Core CRUD, company/location grouping, status filters, "next up" summary, reliable local persistence. (Design reference: attached HTML prototype.)
2. **Milestone 2 — Story Bank:** STAR story builder, competency tagging, interview-linking, coverage view.
3. **Milestone 3 — Behavioral Skills Self-Assessment:** Editable rubric, self-ratings with history, coverage map cross-referenced with Story Bank tags.
4. **Milestone 4 — AI Coach:** Practice-answer input, Claude API integration, structured feedback against the rubric from Milestone 3.
5. **Milestone 5 — Technical Prep Tracker:** Topic list by category, confidence ratings, last-reviewed tracking, interview-linking, practice log.
6. **Milestone 6 — Unified Dashboard Home:** Single view aggregating upcoming prep needs, weak competencies, stale topics, and trend stats across all four areas.

## 13. Definition of Done
- [ ] All functional requirements in Section 5 implemented
- [ ] Data persists reliably across app restarts with visible error handling on failure
- [ ] Basic tests covering core CRUD operations for each data model
- [ ] README explaining setup, run instructions, and architecture (useful for the bootcamp write-up)
- [ ] Manually verified against success criteria in Section 2
