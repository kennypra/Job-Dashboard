import { useCallback, useEffect, useMemo, useState } from 'react';
import { competenciesApi } from '../api/competencies.js';
import { storiesApi } from '../api/stories.js';
import CompetencyRow from '../components/CompetencyRow.jsx';
import CompetencyFormModal from '../components/CompetencyFormModal.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import '../styles/skills.css';

export default function SkillsPage() {
  const [competencies, setCompetencies] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [modal, setModal] = useState(null); // { mode: 'create' } | { mode: 'edit', competency }

  const loadAll = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      // Stories load alongside competencies so each row can cross-reference
      // its Story Bank coverage (spec Milestone 3 — "coverage map
      // cross-referenced with Story Bank tags").
      const [competencyData, storyData] = await Promise.all([competenciesApi.list(), storiesApi.list()]);
      setCompetencies(competencyData);
      setStories(storyData);
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const sortedCompetencies = useMemo(
    () => [...competencies].sort((a, b) => a.name.localeCompare(b.name)),
    [competencies]
  );

  async function handleCreate(formData) {
    const created = await competenciesApi.create(formData); // errors bubble to the modal
    setCompetencies((prev) => [...prev, created]);
    setModal(null);
  }

  async function handleUpdate(id, formData) {
    const updated = await competenciesApi.update(id, formData);
    setCompetencies((prev) => prev.map((c) => (c.id === id ? updated : c)));
    setModal(null);
  }

  async function handleDelete(competency) {
    const confirmed = window.confirm(
      `Delete "${competency.name}" from your rubric? Its rating history will be lost.`
    );
    if (!confirmed) return;
    try {
      await competenciesApi.remove(competency.id);
      setCompetencies((prev) => prev.filter((c) => c.id !== competency.id));
    } catch (err) {
      window.alert(`Could not delete this competency: ${err.message}`);
    }
  }

  return (
    <div className="skills">
      {loadError && <ErrorBanner message={`Couldn't load the rubric: ${loadError}`} onRetry={loadAll} />}

      {loading && !loadError && <p className="pipeline__status mono">Loading rubric…</p>}

      {!loading && !loadError && (
        <>
          <div className="skills__toolbar">
            <h2 className="stories__count mono">
              {competencies.length} {competencies.length === 1 ? 'competency' : 'competencies'}
            </h2>
            <button type="button" className="btn btn--primary" onClick={() => setModal({ mode: 'create' })}>
              + Add Competency
            </button>
          </div>

          {sortedCompetencies.length === 0 && (
            <div className="panel pipeline__empty">
              <p>No competencies yet — add one to start tracking self-ratings over time.</p>
            </div>
          )}

          <div className="skills__list">
            {sortedCompetencies.map((competency) => (
              <CompetencyRow
                key={competency.id}
                competency={competency}
                stories={stories}
                onRate={() => setModal({ mode: 'edit', competency })}
                onDelete={() => handleDelete(competency)}
              />
            ))}
          </div>
        </>
      )}

      {modal && (
        <CompetencyFormModal
          mode={modal.mode}
          initialCompetency={modal.competency}
          onCancel={() => setModal(null)}
          onSubmit={(data) =>
            modal.mode === 'create' ? handleCreate(data) : handleUpdate(modal.competency.id, data)
          }
        />
      )}
    </div>
  );
}
