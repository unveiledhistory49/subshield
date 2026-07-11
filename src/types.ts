export type BillingCycle = 'weekly' | 'monthly' | 'quarterly' | 'annual';

export interface Subscription {
  id: string;
  name: string;
  cost: number;
  billingCycle: BillingCycle;
  category: string; // e.g. Entertainment, Software, Utilities, Health, Work, Other
  nextBillingDate: string; // YYYY-MM-DD
  cancelUrl?: string; // Direct link to cancel if available
  notes?: string;
  isPaused: boolean;
  isCanceled: boolean; // We track canceled ones to display "saved money" stats!
  createdAt: string;
  updatedAt: string;
}
