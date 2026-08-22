import { useState } from 'react';
import { interviewLabel } from '../lib/storyLogic.js';

// Lets a story be linked to one or more existing interviews (spec 5.6 —
// "mark which interview(s) a story has been used with"). `interviews` is
// the full list so we can render human-readable labels for linked ids
// even after they're selected.
export default function InterviewLinker({ linkedIds, interviews, onChange }) {
  const [pendingId, setPendingId] = useState('');

  const linkable = interviews.filter((i) => !linkedIds.includes(i.id));
  // A linked id might no longer resolve to a real interview (e.g. it was
  // since deleted) — still show it as an unlinkable placeholder rather
  // than silently dropping it from the list.
  const linked = linkedIds.map((id) => interviews.find((i) => i.id === id) ?? { id, missing: true });

  function addLink() {
    if (!pendingId) return;
    onChange([...linkedIds, pendingId]);
    setPendingId('');
  }

  function removeLink(id) {
    onChange(linkedIds.filter((linkedId) => linkedId !== id));
  }

  return (
    <div className="interview-linker">
      {linked.length > 0 && (
        <ul className="interview-linker__list">
          {linked.map((entry) => (
            <li key={entry.id} className="interview-linker__item">
              <span>{entry.missing ? 'Interview no longer exists' : interviewLabel(entry)}</span>
              <button type="button" className="btn btn--ghost btn--danger" onClick={() => removeLink(entry.id)}>
                Unlink
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="interview-linker__add">
        <select value={pendingId} onChange={(e) => setPendingId(e.target.value)}>
          <option value="">
            {linkable.length ? 'Select an interview…' : 'No more interviews to link'}
          </option>
          {linkable.map((i) => (
            <option key={i.id} value={i.id}>
              {interviewLabel(i)}
            </option>
          ))}
        </select>
        <button type="button" className="btn btn--ghost" onClick={addLink} disabled={!pendingId}>
          + Link
        </button>
      </div>
    </div>
  );
}
