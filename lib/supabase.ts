import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://shluyjyhbrttwqfriemc.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_iCSRbK5xL7uHCaa1JtG6Eg_hcxGn1r0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type DecisionRecord = {
  id: string;
  date_first_asked: string;
  type: string;
  type_original: string;
  location: string;
  title: string;
  status: string;
  decision_owner: string;
  notes: string;
  related_sites: string;
  rebl_reference: string;
  email_thread_ids: string;
  email_dates: string;
  contradictions: Record<string, unknown> | null;
  meta_decision_id: string;
  decision_sequence_num: number;
  meta_decision_description: string;
  departments?: string[];
  outcome?: string;
  user_notes?: string;
  related_rebl_sites?: string[];
  reviewed_at?: string | null;
};

export type DecisionSummary = {
  type: string;
  count: number;
  earliest: string;
  latest: string;
};

export type MonthlyVolume = {
  month: string;
  date: Date;
  count: number;
};

export type DecisionChain = {
  meta_decision_id: string;
  meta_decision_description: string;
  type: string;
  count: number;
  earliest_date: string;
  latest_date: string;
  statuses: string[];
  locations: string[];
};
