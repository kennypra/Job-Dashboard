import { computeCoverage } from '../lib/storyLogic.js';

export default function CompetencyCoverage({ stories }) {
  const coverage = computeCoverage(stories);
  const maxCount = Math.max(1, ...coverage.map((c) => c.count));

  return (
    <section className="panel coverage">
      <h2 className="coverage__title">Competency Coverage</h2>
      <p className="coverage__subtitle mono">Based on tags across {stories.length} stories</p>
      <ul className="coverage__list">
        {coverage.map(({ tag, count, isThin }) => (
          <li key={tag} className="coverage__row">
            <span className="coverage__tag">{tag}</span>
            <div className="coverage__bar-track">
              <div
                className={`coverage__bar${isThin ? ' coverage__bar--thin' : ''}`}
                style={{ width: `${(count / maxCount) * 100}%` }}
              />
            </div>
            <span className="coverage__count mono">
              {count} {count === 1 ? 'story' : 'stories'}
              {isThin && <span className="coverage__flag"> · thin</span>}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
