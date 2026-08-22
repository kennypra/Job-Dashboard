import { useState } from 'react';

const RATINGS = [1, 2, 3, 4, 5];

function toFormState(competency) {
  return {
    name: competency?.name ?? '',
    selfRating: competency?.selfRating ?? 3,
    notes: '',
  };
}

export default function CompetencyFormModal({ mode, initialCompetency, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => toFormState(initialCompetency));
  const [clientErrors, setClientErrors] = useState([]);
  const [serverError, setServerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function validate() {
    const errors = [];
    if (!form.name.trim()) errors.push('Name is required');
    if (!RATINGS.includes(form.selfRating)) errors.push('Pick a rating from 1 to 5');
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
      // Parent closes the modal on success — same reliability rule as the
      // interview/story forms: a failed save never discards this input.
    } catch (err) {
      setServerError(err.fieldErrors?.length ? err.fieldErrors.join('; ') : err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <form className="modal panel" onSubmit={handleSubmit}>
        <h2>{mode === 'create' ? 'New Competency' : 'Update Rating'}</h2>

        {(clientErrors.length > 0 || serverError) && (
          <div className="form-errors" role="alert">
            {serverError && <p>{serverError}</p>}
            {clientErrors.map((err) => (
              <p key={err}>{err}</p>
            ))}
          </div>
        )}

        <label>
          Name
          <input value={form.name} onChange={(e) => update('name', e.target.value)} required />
        </label>

        <div className="rating-field">
          <span className="rating-field__label">Self-rating</span>
          <div className="rating-field__options" role="radiogroup" aria-label="Self-rating, 1 to 5">
            {RATINGS.map((r) => (
              <button
                key={r}
                type="button"
                className={`rating-pip${form.selfRating === r ? ' is-selected' : ''}`}
                aria-pressed={form.selfRating === r}
                onClick={() => update('selfRating', r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <label className="textarea-label">
          Note {mode === 'edit' && <span className="mono">(logged with this rating)</span>}
          <textarea
            rows={2}
            value={form.notes}
            onChange={(e) => update('notes', e.target.value)}
            placeholder="What made you land on this rating this time?"
          />
        </label>

        <div className="modal__actions">
          <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {submitting ? 'Saving…' : mode === 'create' ? 'Add to Rubric' : 'Save Rating'}
          </button>
        </div>
      </form>
    </div>
  );
}
