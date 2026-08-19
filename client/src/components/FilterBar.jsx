import { STATUS_FILTERS } from '../lib/constants.js';

export default function FilterBar({ activeId, onChange }) {
  return (
    <div className="filter-bar mono" role="tablist" aria-label="Filter interviews by status">
      {STATUS_FILTERS.map((f) => (
        <button
          key={f.id}
          type="button"
          role="tab"
          aria-selected={activeId === f.id}
          className={`filter-bar__item${activeId === f.id ? ' is-active' : ''}`}
          onClick={() => onChange(f.id)}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
