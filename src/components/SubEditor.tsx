import { useState } from 'react';
import type { Subscription, BillingCycle } from '../types';

const CATEGORIES = ['Entertainment', 'Software/SaaS', 'Utilities', 'Health/Wellness', 'Work/Business', 'Financial', 'Other'];

export function SubEditor({
  sub,
  onSave,
  onCancel,
}: {
  sub: Subscription | null;
  onSave: (data: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt' | 'isPaused' | 'isCanceled'>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(sub?.name ?? '');
  const [cost, setCost] = useState(sub?.cost ?? 0);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(sub?.billingCycle ?? 'monthly');
  const [category, setCategory] = useState(sub?.category ?? CATEGORIES[0]);
  const [nextBillingDate, setNextBillingDate] = useState(sub?.nextBillingDate ?? new Date().toISOString().slice(0, 10));
  const [cancelUrl, setCancelUrl] = useState(sub?.cancelUrl ?? '');
  const [notes, setNotes] = useState(sub?.notes ?? '');
  const [error, setError] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Subscription name is required');
      return;
    }
    if (cost <= 0) {
      setError('Cost must be greater than 0');
      return;
    }
    if (!nextBillingDate) {
      setError('Next billing date is required');
      return;
    }

    onSave({
      name: name.trim(),
      cost: Number(cost),
      billingCycle,
      category,
      nextBillingDate,
      cancelUrl: cancelUrl.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <section className="view">
      <header className="view-header">
        <div>
          <h1>{sub ? 'Edit Subscription' : 'Track Subscription'}</h1>
          <p className="muted">{sub ? `Update details for ${sub.name}` : 'Seal a recurring financial leak'}</p>
        </div>
      </header>

      <form className="form" onSubmit={submit}>
        <label>
          Subscription Name *
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Netflix, GitHub, Spotify"
            autoFocus
          />
        </label>

        <div className="form-row">
          <label>
            Cost ($) *
            <input
              type="number"
              step="0.01"
              className="input"
              value={cost}
              onChange={(e) => setCost(Number(e.target.value))}
            />
          </label>
          <label>
            Billing Cycle
            <select
              className="input"
              value={billingCycle}
              onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annual">Annual</option>
            </select>
          </label>
        </div>

        <div className="form-row">
          <label>
            Category
            <select
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </label>
          <label>
            Next Renewal Date *
            <input
              type="date"
              className="input"
              value={nextBillingDate}
              onChange={(e) => setNextBillingDate(e.target.value)}
            />
          </label>
        </div>

        <label>
          Cancellation Page URL (optional)
          <input
            className="input"
            value={cancelUrl}
            onChange={(e) => setCancelUrl(e.target.value)}
            placeholder="e.g. https://netflix.com/youraccount"
          />
        </label>

        <label>
          Notes / Reminder rules
          <input
            className="input"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Shared with roommates, cancels before trial ends"
          />
        </label>

        {error && <p className="error">{error}</p>}

        <div className="form-actions">
          <button type="button" className="btn ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn primary">
            {sub ? 'Update Subscription' : 'Add Subscription'}
          </button>
        </div>
      </form>
    </section>
  );
}
