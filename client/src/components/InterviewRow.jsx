import StatusBadge from './StatusBadge.jsx';
import { formatDate, formatTime } from '../lib/format.js';

export default function InterviewRow({ interview, onEdit, onDelete }) {
  return (
    <div className="interview-row">
      <div className="interview-row__when mono">
        <div>{formatDate(interview.date)}</div>
        {interview.time && <div className="interview-row__time">{formatTime(interview.time)}</div>}
      </div>
      <div className="interview-row__main">
        <div className="interview-row__stage">{interview.stage}</div>
        <div className="interview-row__sub mono">
          {interview.role} · {interview.format} ·{' '}
          {interview.remote ? 'Remote' : interview.city || 'Location TBD'}
        </div>
        {interview.interviewers?.length > 0 && (
          <div className="interview-row__interviewers">
            {interview.interviewers
              .map((p) => p.name + (p.title ? ` (${p.title})` : ''))
              .join(', ')}
          </div>
        )}
      </div>
      <StatusBadge status={interview.status} />
      <div className="interview-row__actions">
        <button type="button" className="btn btn--ghost" onClick={onEdit}>
          Edit
        </button>
        <button type="button" className="btn btn--ghost btn--danger" onClick={onDelete}>
          Delete
        </button>
      </div>
    </div>
  );
}
