import { supabase, type DecisionRecord, type DecisionSummary, type MonthlyVolume, type DecisionChain } from './supabase';
import { startOfMonth, endOfMonth, eachMonthOfInterval, format } from 'date-fns';

// Re-export types for use in components
export type { DecisionRecord, DecisionSummary, MonthlyVolume, DecisionChain };

export async function getDecisionsSummary(): Promise<DecisionSummary[]> {
  const { data, error } = await supabase
    .from('deal_forensics')
    .select('type, date_first_asked')
    .not('type', 'is', null)
    .not('date_first_asked', 'is', null);

  if (error) {
    console.error('Error fetching decisions summary:', error);
    return [];
  }

  const summary = new Map<string, { count: number; dates: string[] }>();

  data.forEach((record) => {
    if (!summary.has(record.type)) {
      summary.set(record.type, { count: 0, dates: [] });
    }
    const typeData = summary.get(record.type)!;
    typeData.count++;
    typeData.dates.push(record.date_first_asked);
  });

  return Array.from(summary.entries()).map(([type, data]) => ({
    type,
    count: data.count,
    earliest: data.dates.sort()[0],
    latest: data.dates.sort().reverse()[0],
  }));
}

export async function getMonthlyVolume(): Promise<MonthlyVolume[]> {
  const { data, error } = await supabase
    .from('deal_forensics')
    .select('date_first_asked')
    .not('date_first_asked', 'is', null);

  if (error) {
    console.error('Error fetching monthly volume:', error);
    return [];
  }

  // Group by month
  const monthlyMap = new Map<string, number>();

  data.forEach((record) => {
    const date = new Date(record.date_first_asked);
    const monthKey = format(date, 'yyyy-MM');
    monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + 1);
  });

  // Convert to sorted array with date objects
  return Array.from(monthlyMap.entries())
    .map(([month, count]) => ({
      month,
      date: new Date(month + '-01'),
      count,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

export async function getDecisionsTimeline(): Promise<DecisionRecord[]> {
  const { data, error } = await supabase
    .from('deal_forensics')
    .select('*')
    .not('date_first_asked', 'is', null)
    .gte('date_first_asked', '2025-04-24')
    .lte('date_first_asked', '2026-05-31')
    .order('date_first_asked', { ascending: true })
    .limit(1000);

  if (error) {
    console.error('Error fetching timeline:', error);
    return [];
  }

  // Additional client-side validation
  const validRecords = (data as DecisionRecord[]).filter((record) => {
    if (!record.date_first_asked) return false;
    const date = new Date(record.date_first_asked);
    const year = date.getFullYear();
    return year >= 2025 && year <= 2026 && !isNaN(date.getTime());
  });

  return validRecords || [];
}

export async function getDecisionChains(): Promise<DecisionChain[]> {
  const { data, error } = await supabase
    .from('deal_forensics')
    .select('meta_decision_id, meta_decision_description, type, status, date_first_asked, location')
    .not('meta_decision_id', 'is', null);

  if (error) {
    console.error('Error fetching decision chains:', error);
    return [];
  }

  const chains = new Map<string, { description: string; records: (typeof data)[0][] }>();

  data.forEach((record) => {
    const chainId = record.meta_decision_id;
    if (!chains.has(chainId)) {
      chains.set(chainId, { description: record.meta_decision_description || '', records: [] });
    }
    chains.get(chainId)!.records.push(record);
  });

  return Array.from(chains.entries()).map(([id, chain]) => {
    const types = new Set(chain.records.map((r) => r.type));
    const statuses = new Set(
      chain.records
        .map((r) => r.status)
        .filter((s): s is string => s !== null)
    );
    const locations = new Set(
      chain.records
        .map((r) => r.location)
        .filter((l): l is string => l !== null)
    );
    const dates = chain.records
      .map((r) => r.date_first_asked)
      .filter((d): d is string => d !== null)
      .sort();

    return {
      meta_decision_id: id,
      meta_decision_description: chain.description,
      type: Array.from(types)[0] || 'Unknown',
      count: chain.records.length,
      earliest_date: dates[0] || '',
      latest_date: dates[dates.length - 1] || '',
      statuses: Array.from(statuses),
      locations: Array.from(locations),
    };
  });
}

export async function getDecisionTypeComposition(): Promise<Array<{ month: string; [key: string]: number | string }>> {
  const { data, error } = await supabase
    .from('deal_forensics')
    .select('date_first_asked, type')
    .not('date_first_asked', 'is', null)
    .not('type', 'is', null)
    .gte('date_first_asked', '2025-04-24')
    .lte('date_first_asked', '2026-05-31');

  if (error) {
    console.error('Error fetching composition data:', error);
    return [];
  }

  const monthlyComposition = new Map<
    string,
    { date: Date; types: Map<string, number> }
  >();

  data.forEach((record) => {
    const date = new Date(record.date_first_asked);
    const year = date.getFullYear();

    if (year < 2025 || year > 2026 || isNaN(date.getTime())) {
      return;
    }

    const monthKey = format(date, 'MMM yyyy');

    if (!monthlyComposition.has(monthKey)) {
      monthlyComposition.set(monthKey, { date, types: new Map() });
    }

    const typeMap = monthlyComposition.get(monthKey)!.types;
    typeMap.set(record.type, (typeMap.get(record.type) || 0) + 1);
  });

  // Get all unique types for consistent ordering across all months
  const allTypes = new Set<string>();
  Array.from(monthlyComposition.values()).forEach(({ types }) => {
    types.forEach((_, type) => allTypes.add(type));
  });
  const typeOrder = Array.from(allTypes).sort();

  // Convert to array format, sort chronologically, and ensure all types present in each month
  return Array.from(monthlyComposition.entries())
    .sort((a, b) => a[1].date.getTime() - b[1].date.getTime())
    .map(([month, { types }]) => {
      const obj: { month: string; [key: string]: number | string } = { month };
      typeOrder.forEach((type) => {
        obj[type] = types.get(type) || 0;
      });
      return obj;
    });
}

export const DECISION_COLORS: Record<string, string> = {
  'Site Evaluation': '#8b5cf6',
  'Operational': '#f59e0b',
  'Process/Systems': '#10b981',
  'Planning/Strategy': '#3b82f6',
  'Admin/Other': '#6b7280',
  'Regulatory/Legal': '#ef4444',
  'Lease/Real Estate': '#ec4899',
  'Financial': '#f97316',
  'Facility/Infrastructure': '#14b8a6',
  'Governance': '#6366f1',
};
