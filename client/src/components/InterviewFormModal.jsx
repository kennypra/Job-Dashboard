import { useState } from 'react';
import { STAGES, FORMATS, STATUSES } from '../lib/constants.js';

const emptyInterviewer = () => ({ name: '', title: '' });

function toFormState(interview) {
  return {
    company: interview?.company ?? '',
    role: interview?.role ?? '',
    city: interview?.city ?? '',
    remote: interview?.remote ?? false,
    stage: interview?.stage ?? STAGES[0],
    format: interview?.format ?? FORMATS[0],
    date: interview?.date ?? '',
    time: interview?.time ?? '',
    status: interview?.status ?? STATUSES[0],
    interviewers: interview?.interviewers?.length
      ? interview.interviewers.map((i) => ({ ...i }))
      : [],
    prepNotes: interview?.prepNotes ?? '',
    debriefNotes: interview?.debriefNotes ?? '',
  };
}

export default function InterviewFormModal({ mode, initialInterview, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => toFormState(initialInterview));
  const [clientErrors, setClientErrors] = useState([]);
  const [serverError, setServerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleRemoteChange(checked) {
    setForm((f) => ({ ...f, remote: checked, city: checked ? '' : f.city }));
  }

  function updateInterviewer(idx, field, value) {
    setForm((f) => {
      const interviewers = [...f.interviewers];
      interviewers[idx] = { ...interviewers[idx], [field]: value };
      return { ...f, interviewers };
    });
  }

  function addInterviewer() {
    setForm((f) => ({ ...f, interviewers: [...f.interviewers, emptyInterviewer()] }));
  }

  function removeInterviewer(idx) {
    setForm((f) => ({ ...f, interviewers: f.interviewers.filter((_, i) => i !== idx) }));
  }

  function validate() {
    const errors = [];
    if (!form.company.trim()) errors.push('Company is required');
    if (!form.role.trim()) errors.push('Role is required');
    if (!form.date) errors.push('Date is required');
    if (form.interviewers.some((i) => !i.name.trim())) {
      errors.push('Every interviewer row needs a name (or remove the row)');
    }
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
      // Parent closes the modal on success — form state only ever gets
      // discarded once the save has actually landed.
    } catch (err) {
      // Reliability requirement (spec section 6): never discard unsaved
      // input on a failed save — keep the modal open with the user's data
      // and show exactly what went wrong.
      setServerError(err.fieldErrors?.length ? err.fieldErrors.join('; ') : err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <form className="modal panel" onSubmit={handleSubmit}>
        <h2>{mode === 'create' ? 'Log Interview' : 'Edit Interview'}</h2>

        {(clientErrors.length > 0 || serverError) && (
          <div className="form-errors" role="alert">
            {serverError && <p>{serverError}</p>}
            {clientErrors.map((err) => (
              <p key={err}>{err}</p>
            ))}
          </div>
        )}

        <div className="form-grid">
          <label>
            Company
            <input
              value={form.company}
              onChange={(e) => update('company', e.target.value)}
              required
            />
          </label>
          <label>
            Role
            <input value={form.role} onChange={(e) => update('role', e.target.value)} required />
          </label>
          <label>
            City
            <input
              value={form.city}
              onChange={(e) => update('city', e.target.value)}
              disabled={form.remote}
              placeholder={form.remote ? 'Remote' : 'e.g. Austin, TX'}
            />
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={form.remote}
              onChange={(e) => handleRemoteChange(e.target.checked)}
            />
            Remote
          </label>
          <label>
            Stage
            <select value={form.stage} onChange={(e) => update('stage', e.target.value)}>
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label>
            Format
            <select value={form.format} onChange={(e) => update('format', e.target.value)}>
              {FORMATS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </label>
          <label>
            Date
            <input
              type="date"
              value={form.date}
              onChange={(e) => update('date', e.target.value)}
              required
            />
          </label>
          <label>
            Time
            <input type="time" value={form.time} onChange={(e) => update('time', e.target.value)} />
          </label>
          <label>
            Status
            <select value={form.status} onChange={(e) => update('status', e.target.value)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>

        <fieldset className="interviewers-field">
          <legend>Interviewers</legend>
          {form.interviewers.map((interviewer, idx) => (
            <div className="interviewer-row" key={idx}>
              <input
                placeholder="Name"
                value={interviewer.name}
                onChange={(e) => updateInterviewer(idx, 'name', e.target.value)}
              />
              <input
                placeholder="Title (optional)"
                value={interviewer.title}
                onChange={(e) => updateInterviewer(idx, 'title', e.target.value)}
              />
              <button
                type="button"
                className="btn btn--ghost btn--danger"
                onClick={() => removeInterviewer(idx)}
              >
                Remove
              </button>
            </div>
          ))}
          <button type="button" className="btn btn--ghost" onClick={addInterviewer}>
            + Add interviewer
          </button>
        </fieldset>

        <label className="textarea-label">
          Prep notes
          <textarea rows={3} value={form.prepNotes} onChange={(e) => update('prepNotes', e.target.value)} />
        </label>
        <label className="textarea-label">
          Debrief notes
          <textarea
            rows={3}
            value={form.debriefNotes}
            onChange={(e) => update('debriefNotes', e.target.value)}
          />
        </label>

        <div className="modal__actions">
          <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {submitting ? 'Saving…' : mode === 'create' ? 'Log Interview' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
