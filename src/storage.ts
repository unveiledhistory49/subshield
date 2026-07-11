import type { Subscription } from './types';

const STORAGE_KEY = 'subshield_subscriptions';

export function uid(prefix = 'sub_') {
  return prefix + Math.random().toString(36).slice(2, 9);
}

export function listSubscriptions(): Subscription[] {
  const json = localStorage.getItem(STORAGE_KEY);
  if (!json) return [];
  return JSON.parse(json);
}

export function saveSubscriptions(subs: Subscription[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subs));
}
