import { useState } from 'react';
import CompetencySparkline from './CompetencySparkline.jsx';
import { countStoriesForTag } from '../lib/storyLogic.js';

const RATINGS = [1, 2, 3, 4, 5];

function formatDate(iso) {
  if (!iso) return 'never';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function CompetencyRow({ competency, stories, onRate, onDelete }) {
  const [showHistory, setShowHistory] = useState(false);
  const storyCount = countStoriesForTag(stories, competency.name);

  return (
    <div className="panel competency-row">
      <div className="competency-row__main">
        <div className="competency-row__identity">
          <h3 className="competency-row__name">{competency.name}</h3>
          <div className="competency-row__meta mono">
            Last assessed {formatDate(competency.lastAssessed)} ·{' '}
            {storyCount === 0 ? (
              <span className="competency-row__coverage competency-row__coverage--thin">
                no linked stories yet
              </span>
            ) : (
              <span className="competency-row__coverage">
                {storyCount} linked {storyCount === 1 ? 'story' : 'stories'}
              </span>
            )}
          </div>
          {competency.notes && <p className="competency-row__notes">{competency.notes}</p>}
        </div>

        <div className="competency-row__rating">
          {RATINGS.map((r) => (
            <span
              key={r}
              className={`rating-pip rating-pip--display${r <= competency.selfRating ? ' is-selected' : ''}`}
              aria-hidden="true"
            >
              {r}
            </span>
          ))}
        </div>

        <CompetencySparkline history={competency.history} />

        <div className="competency-row__actions">
          <button type="button" className="btn btn--primary" onClick={onRate}>
            Re-rate
          </button>
          <button type="button" className="btn btn--ghost btn--danger" onClick={onDelete}>
            Delete
          </button>
        </div>
      </div>

      {competency.history.length > 1 && (
        <>
          <button
            type="button"
            className="btn btn--ghost competency-row__history-toggle"
            onClick={() => setShowHistory((s) => !s)}
            aria-expanded={showHistory}
          >
            {showHistory ? 'Hide' : 'Show'} rating history ({competency.history.length})
          </button>
          {showHistory && (
            <table className="competency-row__history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Rating</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {[...competency.history].reverse().map((entry, i) => (
                  <tr key={i}>
                    <td className="mono">{formatDate(entry.date)}</td>
                    <td className="mono">{entry.rating}/5</td>
                    <td>{entry.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}
