import { useCallback, useEffect, useMemo, useState } from 'react';
import { interviewsApi } from '../api/interviews.js';
import { STATUS_FILTERS } from '../lib/constants.js';
import { groupByCompany, findNextUp } from '../lib/interviewLogic.js';
import NextUpBanner from '../components/NextUpBanner.jsx';
import FilterBar from '../components/FilterBar.jsx';
import CompanyGroup from '../components/CompanyGroup.jsx';
import InterviewFormModal from '../components/InterviewFormModal.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import '../styles/pipeline.css';

export default function PipelinePage() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [modal, setModal] = useState(null); // { mode: 'create' } | { mode: 'edit', interview }

  const loadInterviews = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await interviewsApi.list();
      setInterviews(data);
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInterviews();
  }, [loadInterviews]);

  const nextUp = useMemo(() => findNextUp(interviews), [interviews]);

  const activeFilter = STATUS_FILTERS.find((f) => f.id === statusFilter) ?? STATUS_FILTERS[0];
  const filtered = useMemo(() => {
    if (!activeFilter.statuses) return interviews;
    return interviews.filter((i) => activeFilter.statuses.includes(i.status));
  }, [interviews, activeFilter]);

  const groups = useMemo(() => groupByCompany(filtered), [filtered]);

  async function handleCreate(formData) {
    const created = await interviewsApi.create(formData); // errors bubble to the modal
    setInterviews((prev) => [...prev, created]);
    setModal(null);
  }

  async function handleUpdate(id, formData) {
    const updated = await interviewsApi.update(id, formData);
    setInterviews((prev) => prev.map((i) => (i.id === id ? updated : i)));
    setModal(null);
  }

  async function handleDelete(interview) {
    const confirmed = window.confirm(
      `Delete the ${interview.stage} interview with ${interview.company}? This cannot be undone.`
    );
    if (!confirmed) return;
    try {
      await interviewsApi.remove(interview.id);
      setInterviews((prev) => prev.filter((i) => i.id !== interview.id));
    } catch (err) {
      window.alert(`Could not delete this interview: ${err.message}`);
    }
  }

  return (
    <div className="pipeline">
      <NextUpBanner interview={nextUp} />

      <div className="pipeline__toolbar">
        <FilterBar activeId={statusFilter} onChange={setStatusFilter} />
        <button type="button" className="btn btn--primary" onClick={() => setModal({ mode: 'create' })}>
          + Log Interview
        </button>
      </div>

      {loadError && (
        <ErrorBanner message={`Couldn't load interviews: ${loadError}`} onRetry={loadInterviews} />
      )}

      {loading && !loadError && <p className="pipeline__status mono">Loading pipeline…</p>}

      {!loading && !loadError && groups.length === 0 && (
        <div className="panel pipeline__empty">
          <p>No interviews match this filter yet.</p>
        </div>
      )}

      {!loading &&
        !loadError &&
        groups.map((group) => (
          <CompanyGroup
            key={group.company}
            group={group}
            onEdit={(interview) => setModal({ mode: 'edit', interview })}
            onDelete={handleDelete}
          />
        ))}

      {modal && (
        <InterviewFormModal
          mode={modal.mode}
          initialInterview={modal.interview}
          onCancel={() => setModal(null)}
          onSubmit={(data) =>
            modal.mode === 'create' ? handleCreate(data) : handleUpdate(modal.interview.id, data)
          }
        />
      )}
    </div>
  );
}
