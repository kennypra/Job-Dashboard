// A compact rating-over-time trend line (spec 5.8 — "history so growth is
// visible over time, not just a current snapshot"). Single series, so no
// categorical palette/legend is needed (dataviz skill: "a single series
// needs no legend box"); the fixed rating scale (1–5) means no axis
// labels are needed either — this is a sparkline, not a full chart.
const WIDTH = 160;
const HEIGHT = 36;
const PADDING = 6;
const MIN_RATING = 1;
const MAX_RATING = 5;

function toPoints(history) {
  return history.map((entry, i) => {
    const x =
      history.length === 1 ? WIDTH / 2 : PADDING + (i / (history.length - 1)) * (WIDTH - PADDING * 2);
    const t = (entry.rating - MIN_RATING) / (MAX_RATING - MIN_RATING);
    const y = HEIGHT - PADDING - t * (HEIGHT - PADDING * 2);
    return { x, y, entry };
  });
}

export default function CompetencySparkline({ history }) {
  if (!history || history.length === 0) return null;

  const points = toPoints(history);
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

  return (
    <svg
      className="sparkline"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width={WIDTH}
      height={HEIGHT}
      role="img"
      aria-label={`Rating history: ${history.map((h) => h.rating).join(' then ')}`}
    >
      <path d={pathD} className="sparkline__line" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} className="sparkline__dot">
          <title>
            {`${p.entry.rating}/5 on ${p.entry.date.slice(0, 10)}${p.entry.note ? ` — ${p.entry.note}` : ''}`}
          </title>
        </circle>
      ))}
    </svg>
  );
}
