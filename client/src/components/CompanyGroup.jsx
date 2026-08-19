import InterviewRow from './InterviewRow.jsx';

export default function CompanyGroup({ group, onEdit, onDelete }) {
  return (
    <section className="panel company-group">
      <header className="company-group__header">
        <h2 className="company-group__name">{group.company}</h2>
        <div className="company-group__meta mono">
          {group.interviews.length} round{group.interviews.length === 1 ? '' : 's'} ·{' '}
          {group.locations.join(', ')}
        </div>
      </header>
      <div className="company-group__rows">
        {group.interviews.map((interview) => (
          <InterviewRow
            key={interview.id}
            interview={interview}
            onEdit={() => onEdit(interview)}
            onDelete={() => onDelete(interview)}
          />
        ))}
      </div>
    </section>
  );
}
