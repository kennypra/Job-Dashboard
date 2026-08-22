// Default behavioral competency list (spec section 11 — "not finalized,
// suggest a sensible default set and let me edit it in-app"). Story tagging
// (Milestone 2) and the self-assessment rubric (Milestone 3) both draw
// from this same list so the two can be cross-referenced later, per the
// Milestone 3 note in the spec ("coverage map cross-referenced with Story
// Bank tags"). Milestone 3 is expected to make this properly editable
// in-app (backed by the `competencies` collection); until then this is
// just the suggested starting set, and story tagging also accepts
// free-form custom tags beyond this list.
export const DEFAULT_COMPETENCIES = [
  'Leadership',
  'Ownership',
  'Conflict Resolution',
  'Ambiguity',
  'Failure/Learning',
  'Collaboration',
  'Prioritization',
];

// Below this many stories, a competency is flagged as "thin" coverage in
// the Story Bank's coverage view.
export const THIN_COVERAGE_THRESHOLD = 2;
