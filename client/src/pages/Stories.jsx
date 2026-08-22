import { useCallback, useEffect, useMemo, useState } from 'react';
import { storiesApi } from '../api/stories.js';
import { interviewsApi } from '../api/interviews.js';
import StoryCard from '../components/StoryCard.jsx';
import StoryFormModal from '../components/StoryFormModal.jsx';
import CompetencyCoverage from '../components/CompetencyCoverage.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import '../styles/stories.css';

export default function StoriesPage() {
  const [stories, setStories] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [modal, setModal] = useState(null); // { mode: 'create' } | { mode: 'edit', story }

  const loadAll = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      // Stories and interviews load together — the linker and the "used
      // for" display both need the interview list to render labels.
      const [storyData, interviewData] = await Promise.all([storiesApi.list(), interviewsApi.list()]);
      setStories(storyData);
      setInterviews(interviewData);
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const sortedStories = useMemo(
    () => [...stories].sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')),
    [stories]
  );

  async function handleCreate(formData) {
    const created = await storiesApi.create(formData); // errors bubble to the modal
    setStories((prev) => [...prev, created]);
    setModal(null);
  }

  async function handleUpdate(id, formData) {
    const updated = await storiesApi.update(id, formData);
    setStories((prev) => prev.map((s) => (s.id === id ? updated : s)));
    setModal(null);
  }

  async function handleDelete(story) {
    const confirmed = window.confirm(`Delete the story "${story.title}"? This cannot be undone.`);
    if (!confirmed) return;
    try {
      await storiesApi.remove(story.id);
      setStories((prev) => prev.filter((s) => s.id !== story.id));
    } catch (err) {
      window.alert(`Could not delete this story: ${err.message}`);
    }
  }

  return (
    <div className="stories">
      {loadError && <ErrorBanner message={`Couldn't load the story bank: ${loadError}`} onRetry={loadAll} />}

      {loading && !loadError && <p className="pipeline__status mono">Loading story bank…</p>}

      {!loading && !loadError && (
        <>
          <CompetencyCoverage stories={stories} />

          <div className="stories__toolbar">
            <h2 className="stories__count mono">
              {stories.length} {stories.length === 1 ? 'story' : 'stories'}
            </h2>
            <button type="button" className="btn btn--primary" onClick={() => setModal({ mode: 'create' })}>
              + New Story
            </button>
          </div>

          {sortedStories.length === 0 && (
            <div className="panel pipeline__empty">
              <p>No stories yet — add your first STAR story to start building coverage.</p>
            </div>
          )}

          <div className="stories__list">
            {sortedStories.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                interviews={interviews}
                onEdit={() => setModal({ mode: 'edit', story })}
                onDelete={() => handleDelete(story)}
              />
            ))}
          </div>
        </>
      )}

      {modal && (
        <StoryFormModal
          mode={modal.mode}
          initialStory={modal.story}
          interviews={interviews}
          onCancel={() => setModal(null)}
          onSubmit={(data) =>
            modal.mode === 'create' ? handleCreate(data) : handleUpdate(modal.story.id, data)
          }
        />
      )}
    </div>
  );
}
