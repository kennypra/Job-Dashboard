import { interviewLabel } from '../lib/storyLogic.js';

const STAR_PARTS = [
  ['Situation', 'situation'],
  ['Task', 'task'],
  ['Action', 'action'],
  ['Result', 'result'],
];

export default function StoryCard({ story, interviews, onEdit, onDelete }) {
  const linkedInterviews = (story.usedFor || [])
    .map((id) => interviews.find((i) => i.id === id))
    .filter(Boolean);

  return (
    <article className="panel story-card">
      <header className="story-card__header">
        <h3 className="story-card__title">{story.title}</h3>
        <div className="story-card__actions">
          <button type="button" className="btn btn--ghost" onClick={onEdit}>
            Edit
          </button>
          <button type="button" className="btn btn--ghost btn--danger" onClick={onDelete}>
            Delete
          </button>
        </div>
      </header>

      {story.competencyTags?.length > 0 && (
        <div className="story-card__tags">
          {story.competencyTags.map((tag) => (
            <span key={tag} className="tag-chip tag-chip--static">
              {tag}
            </span>
          ))}
        </div>
      )}

      <dl className="story-card__star">
        {STAR_PARTS.map(([label, field]) => (
          <div key={field} className="story-card__star-row">
            <dt className="mono">{label}</dt>
            <dd>{story[field]}</dd>
          </div>
        ))}
      </dl>

      {linkedInterviews.length > 0 && (
        <div className="story-card__used-for mono">
          Used for: {linkedInterviews.map((i) => interviewLabel(i)).join('; ')}
        </div>
      )}
    </article>
  );
}
