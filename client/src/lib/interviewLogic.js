// Grouping/sorting rules for the pipeline view (spec section 5, items 2 & 4).

function dateTimeKey(interview) {
  return `${interview.date || ''}T${interview.time || '00:00'}`;
}

function locationLabel(interview) {
  if (interview.remote) return 'Remote';
  return interview.city?.trim() || 'Location TBD';
}

// Groups interviews by company; within each group, sub-groups by
// city/remote status and sorts rounds by date.
export function groupByCompany(interviews) {
  const byCompany = new Map();
  for (const interview of interviews) {
    const key = interview.company || 'Unknown Company';
    if (!byCompany.has(key)) byCompany.set(key, []);
    byCompany.get(key).push(interview);
  }

  return Array.from(byCompany.entries())
    .map(([company, items]) => {
      const sorted = [...items].sort((a, b) => dateTimeKey(a).localeCompare(dateTimeKey(b)));
      const locations = Array.from(new Set(sorted.map(locationLabel)));
      return { company, interviews: sorted, locations };
    })
    .sort((a, b) => a.company.localeCompare(b.company));
}

// Section 5, item 4 — the single closest upcoming interview, at all times.
export function findNextUp(interviews, now = new Date()) {
  const upcomingStatuses = new Set(['upcoming', 'rescheduled']);
  const withDateTime = interviews
    .filter((i) => upcomingStatuses.has(i.status) && i.date)
    .map((i) => ({ interview: i, dt: new Date(`${i.date}T${i.time || '00:00'}`) }))
    .filter((x) => !Number.isNaN(x.dt.getTime()));

  const future = withDateTime.filter((x) => x.dt >= now).sort((a, b) => a.dt - b.dt);
  if (future.length) return future[0].interview;

  // Nothing strictly in the future (e.g. an "upcoming" interview whose date
  // slipped by without a status update) — still surface the most recent
  // one rather than showing nothing.
  const past = [...withDateTime].sort((a, b) => b.dt - a.dt);
  return past[0]?.interview ?? null;
}
