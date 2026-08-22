import { DEFAULT_COMPETENCIES, THIN_COVERAGE_THRESHOLD } from './competencies.js';

// Section 5, item 7 — "which behavioral competencies have strong story
// coverage and which are thin, based on story tags." Includes every
// default competency (even at zero stories) plus any custom tags stories
// have actually used beyond the default list.
export function computeCoverage(stories) {
  const counts = new Map(DEFAULT_COMPETENCIES.map((c) => [c, 0]));
  for (const story of stories) {
    for (const tag of story.competencyTags || []) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([tag, count]) => ({
      tag,
      count,
      isThin: count < THIN_COVERAGE_THRESHOLD,
    }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export function interviewLabel(interview) {
  if (!interview) return 'Unknown interview';
  const where = interview.remote ? 'Remote' : interview.city || 'Location TBD';
  return `${interview.company} — ${interview.role} (${interview.date || 'no date'}, ${where})`;
}
