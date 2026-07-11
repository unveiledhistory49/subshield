import { useState, useEffect, useCallback } from 'react';
import type { Subscription } from './types';
import { listSubscriptions, saveSubscriptions, uid } from './storage';
import { DashboardView } from './components/DashboardView';
import { SubEditor } from './components/SubEditor';
import { AnalyticsView } from './components/AnalyticsView';
import './App.css';

type View = 'dashboard' | 'add' | 'analytics';

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    try {
      const records = listSubscriptions();
      setSubs(records);
    } catch (e) {
      console.error('Failed to load subscriptions', e);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleAddOrUpdate = (data: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt' | 'isPaused' | 'isCanceled'>) => {
    let updated: Subscription[];
    const nowStr = new Date().toISOString();

    if (editingSub) {
      updated = subs.map((s) =>
        s.id === editingSub.id
          ? { ...s, ...data, updatedAt: nowStr }
          : s
      );
      setEditingSub(null);
    } else {
      const newSub: Subscription = {
        ...data,
        id: uid('sub_'),
        isPaused: false,
        isCanceled: false,
        createdAt: nowStr,
        updatedAt: nowStr,
      };
      updated = [...subs, newSub];
    }

    saveSubscriptions(updated);
    setSubs(updated);
    setView('dashboard');
  };

  const handleTogglePause = (id: string) => {
    const updated = subs.map((s) =>
      s.id === id ? { ...s, isPaused: !s.isPaused, updatedAt: new Date().toISOString() } : s
    );
    saveSubscriptions(updated);
    setSubs(updated);
  };

  const handleCancelSub = (id: string) => {
    const updated = subs.map((s) =>
      s.id === id ? { ...s, isCanceled: true, isPaused: false, updatedAt: new Date().toISOString() } : s
    );
    saveSubscriptions(updated);
    setSubs(updated);
  };

  const handleDeleteSub = (id: string) => {
    const updated = subs.filter((s) => s.id !== id);
    saveSubscriptions(updated);
    setSubs(updated);
  };

  if (!ready) {
    return (
      <div className="app" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <p className="muted">Loading Vault…</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand" onClick={() => { setEditingSub(null); setView('dashboard'); }} style={{ cursor: 'pointer' }}>
          <span className="brand-mark">SS</span>
          <div>
            <strong>SubShield</strong>
            <span className="brand-sub">recurring spend tracker</span>
          </div>
        </div>
      </header>

      <main className="main">
        {view === 'dashboard' && (
          <DashboardView
            subs={subs}
            onAddSub={() => {
              setEditingSub(null);
              setView('add');
            }}
            onEditSub={(s) => {
              setEditingSub(s);
              setView('add');
            }}
            onTogglePause={handleTogglePause}
            onCancelSub={handleCancelSub}
            onDeleteSub={handleDeleteSub}
          />
        )}

        {view === 'add' && (
          <SubEditor
            sub={editingSub}
            onSave={handleAddOrUpdate}
            onCancel={() => {
              setEditingSub(null);
              setView('dashboard');
            }}
          />
        )}

        {view === 'analytics' && (
          <AnalyticsView subs={subs} />
        )}
      </main>

      <nav className="bottom-nav" aria-label="Main" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <button
          type="button"
          className={`nav-btn ${view === 'dashboard' ? 'active' : ''}`}
          onClick={() => { setEditingSub(null); setView('dashboard'); }}
        >
          <span className="nav-short">Home</span>
        </button>
        <button
          type="button"
          className={`nav-btn ${view === 'add' ? 'active' : ''}`}
          onClick={() => { setEditingSub(null); setView('add'); }}
        >
          <span className="nav-short">Add</span>
        </button>
        <button
          type="button"
          className={`nav-btn ${view === 'analytics' ? 'active' : ''}`}
          onClick={() => { setEditingSub(null); setView('analytics'); }}
        >
          <span className="nav-short">Stats</span>
        </button>
      </nav>
    </div>
  );
}
