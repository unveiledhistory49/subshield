import { useMemo } from 'react';
import type { Subscription } from '../types';

export function AnalyticsView({ subs }: { subs: Subscription[] }) {
  const analytics = useMemo(() => {
    const active = subs.filter((s) => !s.isCanceled && !s.isPaused);
    const canceled = subs.filter((s) => s.isCanceled);

    // Normalize costs to monthly cost
    const getMonthlyCost = (s: Subscription) => {
      switch (s.billingCycle) {
        case 'weekly': return s.cost * 4.33;
        case 'monthly': return s.cost;
        case 'quarterly': return s.cost / 3;
        case 'annual': return s.cost / 12;
        default: return 0;
      }
    };

    let totalMonthly = 0;
    const catMap: Record<string, number> = {};

    active.forEach((s) => {
      const cost = getMonthlyCost(s);
      totalMonthly += cost;
      catMap[s.category] = (catMap[s.category] || 0) + cost;
    });

    let savedMonthly = 0;
    canceled.forEach((s) => {
      savedMonthly += getMonthlyCost(s);
    });

    // Find top leaking category
    let topCat = 'None';
    let topCatValue = 0;
    Object.entries(catMap).forEach(([cat, val]) => {
      if (val > topCatValue) {
        topCat = cat;
        topCatValue = val;
      }
    });

    const categoryBreakdown = Object.entries(catMap).map(([name, value]) => ({
      name,
      value,
      percentage: totalMonthly > 0 ? (value / totalMonthly) * 100 : 0
    })).sort((a, b) => b.value - a.value);

    return {
      totalMonthly,
      totalAnnual: totalMonthly * 12,
      savedMonthly,
      savedAnnual: savedMonthly * 12,
      canceledCount: canceled.length,
      categoryBreakdown,
      topCat,
      topCatValue
    };
  }, [subs]);

  return (
    <section className="view">
      <header className="view-header">
        <div>
          <h1>Insights & Defense</h1>
          <p className="muted">Audit Results & Cash Deflected</p>
        </div>
      </header>

      {subs.length === 0 ? (
        <div className="empty">
          <p>No records to analyze.</p>
          <p className="muted">Track subscriptions to monitor recurring leaks.</p>
        </div>
      ) : (
        <>
          {/* Deflection Scoreboard */}
          <div className="card stack-gap" style={{textAlign: 'center', padding: '1.25rem', borderColor: 'var(--primary)'}}>
            <h2>Deflected Annual Burn</h2>
            <div style={{fontSize: '2.5rem', fontWeight: '800', color: 'var(--primary)', letterSpacing: '-0.03em'}}>
              ${Math.round(analytics.savedAnnual).toLocaleString()}
            </div>
            <p className="muted small">
              You stopped {analytics.canceledCount} recurrent leaks, reclaiming ${Math.round(analytics.savedMonthly)}/mo in cash.
            </p>
          </div>

          {/* Allocation */}
          <div className="stat-block" style={{marginTop: '1.25rem'}}>
            <h2>Monthly Expense Allocation</h2>
            <ul className="stat-list">
              {analytics.categoryBreakdown.map((c) => (
                <li key={c.name}>
                  <div className="stat-list-meta">
                    <strong>{c.name}</strong>
                    <span className="muted">{c.percentage.toFixed(0)}% of total monthly spend</span>
                  </div>
                  <span className="stat-badge">${Math.round(c.value).toLocaleString()}/mo</span>
                </li>
              ))}
              {analytics.categoryBreakdown.length === 0 && (
                <p className="muted small">No active expenses logged.</p>
              )}
            </ul>
          </div>

          {/* Top Category Callout */}
          {analytics.topCatValue > 0 && (
            <div className="card stack-gap" style={{marginTop: '1.25rem', borderColor: 'var(--warn)'}}>
              <h2>⚠️ Top Recurring Expense</h2>
              <p className="small">
                Your highest recurring spend is in <strong style={{color: 'var(--warn)'}}>{analytics.topCat}</strong>, costing you <strong>${Math.round(analytics.topCatValue).toLocaleString()}/mo</strong> (${Math.round(analytics.topCatValue * 12).toLocaleString()}/yr). Double-check if you're fully utilizing these services!
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
