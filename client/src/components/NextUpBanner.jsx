import StatusBadge from './StatusBadge.jsx';
import { formatDate, formatTime } from '../lib/format.js';

export default function NextUpBanner({ interview }) {
  if (!interview) {
    return (
      <div className="panel next-up next-up--empty">
        <p className="mono">NEXT UP — nothing on the board. Log an interview to get started.</p>
      </div>
    );
  }

  return (
    <div className="panel next-up">
      <div className="next-up__label mono">NEXT UP</div>
      <div className="next-up__body">
        <div className="next-up__who">
          <div className="next-up__company">{interview.company}</div>
          <div className="next-up__meta mono">
            {interview.role} · {interview.stage} ·{' '}
            {interview.remote ? 'Remote' : interview.city || 'Location TBD'}
          </div>
        </div>
        <div className="next-up__when mono">
          {formatDate(interview.date)}
          {interview.time && ` · ${formatTime(interview.time)}`}
        </div>
        <StatusBadge status={interview.status} />
      </div>
    </div>
  );
}
