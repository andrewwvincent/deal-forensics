'use client';

import { useEffect, useState } from 'react';
import { MetricsCard } from '@/components/MetricsCard';
import { MonthlyVolumeChart } from '@/components/MonthlyVolumeChart';
import { DecisionCategoryTrends } from '@/components/DecisionCategoryTrends';
import { DecisionTimelineScatter } from '@/components/DecisionTimelineScatter';
import { DecisionChainGantt } from '@/components/DecisionChainGantt';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import {
  getDecisionsSummary,
  getMonthlyVolume,
  getDecisionsTimeline,
  getDecisionChains,
  getDecisionTypeComposition,
} from '@/lib/data';
import type { DecisionSummary, MonthlyVolume, DecisionRecord, DecisionChain } from '@/lib/data';
import type { DecisionRecord as DecisionRecordType } from '@/lib/supabase';

export default function Dashboard() {
  const [summary, setSummary] = useState<DecisionSummary[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyVolume[]>([]);
  const [timelineData, setTimelineData] = useState<DecisionRecordType[]>([]);
  const [chainData, setChainData] = useState<DecisionChain[]>([]);
  const [compositionData, setCompositionData] = useState<Array<{ month: string; [key: string]: number | string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: '2025-04-24',
    to: '2026-05-07',
  });
  const [selectedType, setSelectedType] = useState<string>('All');
  const [chainStatus, setChainStatus] = useState<string>('All');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [summ, monthly, timeline, chains, composition] = await Promise.all([
          getDecisionsSummary(),
          getMonthlyVolume(),
          getDecisionsTimeline(),
          getDecisionChains(),
          getDecisionTypeComposition(),
        ]);

        setSummary(summ);
        setMonthlyData(monthly);
        setTimelineData(timeline);
        setChainData(chains);
        setCompositionData(composition);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load data';
        setError(message);
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Apply filters
  const filteredTimeline = timelineData.filter((record) => {
    if (!record.date_first_asked) return false;
    const recordDate = new Date(record.date_first_asked);
    const fromDate = new Date(dateRange.from);
    const toDate = new Date(dateRange.to);

    if (recordDate < fromDate || recordDate > toDate) return false;
    if (selectedType !== 'All' && record.type !== selectedType) return false;

    return true;
  });

  const filteredChains = chainData.filter((chain) => {
    if (chainStatus !== 'All' && !chain.statuses.includes(chainStatus)) return false;
    return true;
  });

  const totalDecisions = summary.reduce((acc, s) => acc + s.count, 0);
  const dateMin = summary.length > 0 ? summary.reduce((min, s) => (s.earliest < min ? s.earliest : min), summary[0].earliest) : '';
  const dateMax = summary.length > 0 ? summary.reduce((max, s) => (s.latest > max ? s.latest : max), summary[0].latest) : '';

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <h3 className="font-semibold">Error Loading Data</h3>
          <p className="text-sm mt-1">{error}</p>
          <p className="text-xs mt-2 text-red-700">
            Make sure your NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables are set.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Navigation */}
      <div className="mb-8 flex gap-4">
        <a
          href="/organizer"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          → Organize Meta-Decisions
        </a>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricsCard
          title="Total Decisions"
          value={totalDecisions}
          subtitle={`${summary.length} decision types`}
        />
        <MetricsCard
          title="Date Range"
          value={`${dateMin} to ${dateMax}`}
          subtitle={`${Math.round((new Date(dateMax).getTime() - new Date(dateMin).getTime()) / (1000 * 60 * 60 * 24))} days`}
        />
        <MetricsCard
          title="Decision Chains"
          value={chainData.length}
          subtitle="Meta-decision groups"
        />
        <MetricsCard
          title="Monthly Avg"
          value={summary.length > 0 ? Math.round(totalDecisions / 13) : 0}
          subtitle="Per month"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Decision Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Types</option>
              {summary.map((s) => (
                <option key={s.type} value={s.type}>
                  {s.type} ({s.count})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Charts */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          {/* Row 1: Monthly Volume + Category Composition */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <MonthlyVolumeChart data={monthlyData} loading={loading} />
            <DecisionCategoryTrends data={compositionData} loading={loading} />
          </div>

          {/* Row 2: Timeline Scatter */}
          <div className="mb-8">
            <DecisionTimelineScatter data={filteredTimeline} loading={loading} />
          </div>

          {/* Row 3: Decision Chains Gantt */}
          <div className="mb-8">
            <DecisionChainGantt data={filteredChains} loading={loading} />
          </div>

          {/* Row 4: Summary Table */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Decision Type Summary</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Type</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-900">Count</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Earliest</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Latest</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-900">Duration (days)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {summary.map((row) => {
                    const duration = Math.round(
                      (new Date(row.latest).getTime() - new Date(row.earliest).getTime()) / (1000 * 60 * 60 * 24)
                    );
                    return (
                      <tr key={row.type} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{row.type}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{row.count}</td>
                        <td className="px-4 py-3 text-gray-600">{row.earliest}</td>
                        <td className="px-4 py-3 text-gray-600">{row.latest}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{duration}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
