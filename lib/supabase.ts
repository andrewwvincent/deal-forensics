import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://shluyjyhbrttwqfriemc.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_iCSRbK5xL7uHCaa1JtG6Eg_hcxGn1r0';

const reblUrl = 'https://mnxgkozrutvylzeogphh.supabase.co';
const reblAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ueGdrb3pydXR2eWx6ZW9ncGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNTM3MjUsImV4cCI6MjA2NDcyOTcyNX0.SAxTY42F5W_XdA6p7g5fnlunu0yGzNacoBXWTmNj4is';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const supabaseRebl = createClient(reblUrl, reblAnonKey);

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
