import { useMemo, useState } from 'react';
import type { Subscription, BillingCycle } from '../types';

export function DashboardView({
  subs,
  onAddSub,
  onEditSub,
  onTogglePause,
  onCancelSub,
  onDeleteSub,
}: {
  subs: Subscription[];
  onAddSub: () => void;
  onEditSub: (sub: Subscription) => void;
  onTogglePause: (id: string) => void;
  onCancelSub: (id: string) => void;
  onDeleteSub: (id: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'active' | 'paused' | 'canceled' | 'all'>('active');
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const parsedSubs = useMemo(() => {
    return subs.map((s) => {
      let isSoon = false;
      if (s.nextBillingDate && !s.isCanceled && !s.isPaused) {
        const diffTime = new Date(s.nextBillingDate).getTime() - new Date(todayStr).getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        isSoon = diffDays >= 0 && diffDays <= 7; // Renews in next 7 days
      }
      return { ...s, isSoon };
    });
  }, [subs, todayStr]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(subs.map((s) => s.category));
    return Array.from(set);
  }, [subs]);

  // Normalize costs to monthly cost
  const getMonthlyCost = (s: Subscription) => {
    if (s.isPaused || s.isCanceled) return 0;
    switch (s.billingCycle) {
      case 'weekly': return s.cost * 4.33;
      case 'monthly': return s.cost;
      case 'quarterly': return s.cost / 3;
      case 'annual': return s.cost / 12;
      default: return 0;
    }
  };

  // Stats calculations
  const stats = useMemo(() => {
    let monthlySpend = 0;
    let activeCount = 0;
    let renewsSoonCount = 0;
    let savedMonthly = 0;

    parsedSubs.forEach((s) => {
      if (s.isCanceled) {
        // Saved monthly costs based on what they would be if active
        let cost = s.cost;
        if (s.billingCycle === 'weekly') cost *= 4.33;
        else if (s.billingCycle === 'quarterly') cost /= 3;
        else if (s.billingCycle === 'annual') cost /= 12;
        savedMonthly += cost;
      } else {
        if (!s.isPaused) {
          monthlySpend += getMonthlyCost(s);
          activeCount++;
          if (s.isSoon) renewsSoonCount++;
        }
      }
    });

    return {
      monthlySpend,
      activeCount,
      renewsSoonCount,
      annualSpend: monthlySpend * 12,
      savedAnnual: savedMonthly * 12,
    };
  }, [parsedSubs]);

  const filteredSubs = useMemo(() => {
    return parsedSubs.filter((s) => {
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
                          s.category.toLowerCase().includes(search.toLowerCase());
      const matchCat = catFilter === 'all' ? true : s.category === catFilter;
      
      let matchStatus = true;
      if (statusFilter === 'active') {
        matchStatus = !s.isCanceled && !s.isPaused;
      } else if (statusFilter === 'paused') {
        matchStatus = !s.isCanceled && s.isPaused;
      } else if (statusFilter === 'canceled') {
        matchStatus = s.isCanceled;
      }

      return matchSearch && matchCat && matchStatus;
    });
  }, [parsedSubs, search, catFilter, statusFilter]);

  const formatCycle = (c: BillingCycle) => {
    switch (c) {
      case 'weekly': return 'wk';
      case 'monthly': return 'mo';
      case 'quarterly': return 'qt';
      case 'annual': return 'yr';
    }
  };

  return (
    <section className="view">
      <header className="view-header">
        <div>
          <h1>SubShield</h1>
          <p className="muted">Subscription Audit & Control</p>
        </div>
        <button type="button" className="btn primary" onClick={onAddSub}>
          + Add Subscription
        </button>
      </header>

      {/* Stats Board */}
      <div className="stat-cards">
        <div className="stat-card">
          <span className="stat-num">${Math.round(stats.monthlySpend).toLocaleString()}</span>
          <span className="stat-label">monthly burn</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">${Math.round(stats.annualSpend).toLocaleString()}</span>
          <span className="stat-label">annual burn</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">{stats.activeCount}</span>
          <span className="stat-label">active plans</span>
        </div>
        {stats.renewsSoonCount > 0 && (
          <div className="stat-card" style={{borderColor: 'var(--warn)'}}>
            <span className="stat-num" style={{color: 'var(--warn)'}}>{stats.renewsSoonCount}</span>
            <span className="stat-label">renewing within 7d</span>
          </div>
        )}
        {stats.savedAnnual > 0 && (
          <div className="stat-card" style={{borderColor: 'var(--primary)'}}>
            <span className="stat-num" style={{color: 'var(--primary)'}}>${Math.round(stats.savedAnnual).toLocaleString()}</span>
            <span className="stat-label">annual cash saved</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="filters">
        <input
          className="input"
          placeholder="Filter by subscription name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="input"
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          className="input"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
        >
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="canceled">Canceled / Stopped</option>
          <option value="all">All Records</option>
        </select>
      </div>

      {/* Subscriptions List */}
      {filteredSubs.length === 0 ? (
        <div className="empty">
          <p>No subscription records.</p>
          <p className="muted">Audit your streaming, software, and tools to halt recurring leaks.</p>
          <button type="button" className="btn primary" onClick={onAddSub}>
            Add First Plan
          </button>
        </div>
      ) : (
        <ul className="item-list">
          {filteredSubs.map((s) => {
            const isSelected = selectedSubId === s.id;
            return (
              <li
                key={s.id}
                className="item-row"
                style={{
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  borderColor: isSelected ? 'var(--primary)' : s.isSoon ? 'var(--warn)' : 'var(--border)'
                }}
              >
                {/* Accordion Trigger */}
                <div
                  style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer'}}
                  onClick={() => setSelectedSubId(isSelected ? null : s.id)}
                >
                  <div className="item-meta">
                    <strong>{s.name}</strong>
                    <span className="tags">
                      <span className="tag">{s.category}</span>
                      {!s.isCanceled && !s.isPaused && (
                        <span className={`tag ${s.isSoon ? 'warn' : ''}`}>
                          Renews: {s.nextBillingDate}
                        </span>
                      )}
                      {s.isPaused && <span className="tag subtle">Paused</span>}
                      {s.isCanceled && <span className="tag subtle" style={{color: 'var(--danger)'}}>Canceled</span>}
                    </span>
                  </div>
                  <div style={{textAlign: 'right', marginRight: '0.5rem'}}>
                    <span className="stat-badge" style={{fontSize: '1.25rem', color: s.isCanceled || s.isPaused ? 'var(--muted)' : 'var(--primary)'}}>
                      ${s.cost.toLocaleString()}<span style={{fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--muted)'}}>/ {formatCycle(s.billingCycle)}</span>
                    </span>
                  </div>
                </div>

                {/* Details Section */}
                {isSelected && (
                  <div style={{marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border)', display: 'grid', gap: '0.65rem'}}>
                    {s.notes && (
                      <div>
                        <span className="muted small">Notes:</span>
                        <p className="small" style={{marginTop: '0.2rem'}}>{s.notes}</p>
                      </div>
                    )}

                    {s.cancelUrl && (
                      <div>
                        <span className="muted small">Cancellation Action:</span>
                        <div style={{marginTop: '0.25rem'}}>
                          <a
                            href={s.cancelUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn primary ghost"
                            style={{display: 'inline-block', fontSize: '0.8rem', textDecoration: 'none', padding: '0.35rem 0.65rem'}}
                          >
                            🔗 Direct Cancellation Portal
                          </a>
                        </div>
                      </div>
                    )}

                    <div className="form-actions" style={{marginTop: '0.5rem'}}>
                      <button type="button" className="btn ghost" onClick={() => onEditSub(s)}>
                        Edit Details
                      </button>
                      
                      {!s.isCanceled && (
                        <>
                          <button
                            type="button"
                            className="btn ghost"
                            onClick={() => onTogglePause(s.id)}
                          >
                            {s.isPaused ? 'Resume Plan' : 'Pause Plan'}
                          </button>
                          
                          <button
                            type="button"
                            className="btn ghost danger"
                            onClick={() => {
                              if (confirm(`Mark "${s.name}" as canceled? This will add it to your "saved money" stats.`)) {
                                onCancelSub(s.id);
                              }
                            }}
                          >
                            Mark Canceled
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        className="btn ghost danger"
                        onClick={() => {
                          if (confirm(`Permanently delete "${s.name}" from your vault?`)) {
                            onDeleteSub(s.id);
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
