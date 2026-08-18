// Mirrors server/src/routes/interviews.js — kept in sync by hand since the
// client and server are separate packages with no shared build step yet.
export const STAGES = [
  'Phone Screen',
  'Technical Screen',
  'Behavioral Round',
  'Onsite/Panel',
  'Final Round',
  'Offer Discussion',
  'Other',
];

export const FORMATS = ['Phone', 'Video', 'Onsite'];

export const STATUSES = [
  'upcoming',
  'rescheduled',
  'completed',
  'advanced',
  'offer',
  'rejected',
  'withdrawn',
];

export const STATUS_META = {
  upcoming: { label: 'Upcoming', colorVar: '--color-brass' },
  rescheduled: { label: 'Rescheduled', colorVar: '--color-brick' },
  completed: { label: 'Completed', colorVar: '--color-teal' },
  advanced: { label: 'Advanced', colorVar: '--color-teal' },
  offer: { label: 'Offer', colorVar: '--color-olive' },
  rejected: { label: 'Rejected', colorVar: '--color-brick' },
  withdrawn: { label: 'Withdrawn', colorVar: '--color-grey' },
};

// Section 5, item 3 — "Filter the interview list by status (All, Upcoming,
// Awaiting Result, Advanced, Offers, Closed Out)".
export const STATUS_FILTERS = [
  { id: 'all', label: 'All', statuses: null },
  { id: 'upcoming', label: 'Upcoming', statuses: ['upcoming', 'rescheduled'] },
  { id: 'awaiting', label: 'Awaiting Result', statuses: ['completed'] },
  { id: 'advanced', label: 'Advanced', statuses: ['advanced'] },
  { id: 'offers', label: 'Offers', statuses: ['offer'] },
  { id: 'closed', label: 'Closed Out', statuses: ['rejected', 'withdrawn'] },
];
