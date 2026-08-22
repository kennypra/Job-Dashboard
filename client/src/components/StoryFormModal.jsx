import { useState } from 'react';
import CompetencyTagPicker from './CompetencyTagPicker.jsx';
import InterviewLinker from './InterviewLinker.jsx';

function toFormState(story) {
  return {
    title: story?.title ?? '',
    situation: story?.situation ?? '',
    task: story?.task ?? '',
    action: story?.action ?? '',
    result: story?.result ?? '',
    competencyTags: story?.competencyTags?.length ? [...story.competencyTags] : [],
    usedFor: story?.usedFor?.length ? [...story.usedFor] : [],
  };
}

export default function StoryFormModal({ mode, initialStory, interviews, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => toFormState(initialStory));
  const [clientErrors, setClientErrors] = useState([]);
  const [serverError, setServerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function validate() {
    const errors = [];
    if (!form.title.trim()) errors.push('Title is required');
    if (!form.situation.trim()) errors.push('Situation is required');
    if (!form.task.trim()) errors.push('Task is required');
    if (!form.action.trim()) errors.push('Action is required');
    if (!form.result.trim()) errors.push('Result is required');
    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errors = validate();
    setClientErrors(errors);
    if (errors.length) return;

    setServerError(null);
    setSubmitting(true);
    try {
      await onSubmit(form);
      // Parent closes the modal on success — the form's state (and
      // whatever the user typed) is only ever discarded once the save
      // actually landed, same reliability rule as the interview form.
    } catch (err) {
      setServerError(err.fieldErrors?.length ? err.fieldErrors.join('; ') : err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <form className="modal panel" onSubmit={handleSubmit}>
        <h2>{mode === 'create' ? 'New Story' : 'Edit Story'}</h2>

        {(clientErrors.length > 0 || serverError) && (
          <div className="form-errors" role="alert">
            {serverError && <p>{serverError}</p>}
            {clientErrors.map((err) => (
              <p key={err}>{err}</p>
            ))}
          </div>
        )}

        <label>
          Title
          <input value={form.title} onChange={(e) => update('title', e.target.value)} required />
        </label>

        <label className="textarea-label">
          Situation
          <textarea rows={2} value={form.situation} onChange={(e) => update('situation', e.target.value)} />
        </label>
        <label className="textarea-label">
          Task
          <textarea rows={2} value={form.task} onChange={(e) => update('task', e.target.value)} />
        </label>
        <label className="textarea-label">
          Action
          <textarea rows={3} value={form.action} onChange={(e) => update('action', e.target.value)} />
        </label>
        <label className="textarea-label">
          Result
          <textarea rows={2} value={form.result} onChange={(e) => update('result', e.target.value)} />
        </label>

        <fieldset className="interviewers-field">
          <legend>Competencies</legend>
          <CompetencyTagPicker
            selected={form.competencyTags}
            onChange={(tags) => update('competencyTags', tags)}
          />
        </fieldset>

        <fieldset className="interviewers-field">
          <legend>Used for</legend>
          <InterviewLinker
            linkedIds={form.usedFor}
            interviews={interviews}
            onChange={(ids) => update('usedFor', ids)}
          />
        </fieldset>

        <div className="modal__actions">
          <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {submitting ? 'Saving…' : mode === 'create' ? 'Save Story' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
