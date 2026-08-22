import { useState } from 'react';
import { DEFAULT_COMPETENCIES } from '../lib/competencies.js';

export default function CompetencyTagPicker({ selected, onChange }) {
  const [customTag, setCustomTag] = useState('');

  // Show the default list plus any already-selected tags that aren't in
  // it (so a story tagged with a custom competency still shows it as a
  // toggleable chip, not just invisible extra state).
  const options = Array.from(new Set([...DEFAULT_COMPETENCIES, ...selected]));

  function toggle(tag) {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
  }

  function addCustomTag(e) {
    e.preventDefault();
    const tag = customTag.trim();
    if (!tag) return;
    if (!selected.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      onChange([...selected, tag]);
    }
    setCustomTag('');
  }

  return (
    <div className="tag-picker">
      <div className="tag-picker__chips">
        {options.map((tag) => (
          <button
            key={tag}
            type="button"
            className={`tag-chip${selected.includes(tag) ? ' is-selected' : ''}`}
            onClick={() => toggle(tag)}
            aria-pressed={selected.includes(tag)}
          >
            {tag}
          </button>
        ))}
      </div>
      <div className="tag-picker__custom">
        <input
          placeholder="Add a custom competency…"
          value={customTag}
          onChange={(e) => setCustomTag(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') addCustomTag(e);
          }}
        />
        <button type="button" className="btn btn--ghost" onClick={addCustomTag}>
          Add
        </button>
      </div>
    </div>
  );
}
