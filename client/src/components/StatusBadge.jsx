import { STATUS_META } from '../lib/constants.js';

export default function StatusBadge({ status }) {
  const meta = STATUS_META[status] ?? { label: status, colorVar: '--color-grey' };
  return (
    <span className="status-badge mono" style={{ '--badge-color': `var(${meta.colorVar})` }}>
      {meta.label}
    </span>
  );
}
