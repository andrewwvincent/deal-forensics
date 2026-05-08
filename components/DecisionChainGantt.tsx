'use client';

import React from 'react';
import { parseISO, differenceInDays } from 'date-fns';
import { DECISION_COLORS } from '@/lib/data';
import type { DecisionChain } from '@/lib/data';

interface DecisionChainGanttProps {
  data: DecisionChain[];
  loading?: boolean;
}

export function DecisionChainGantt({ data, loading }: DecisionChainGanttProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 h-96 flex items-center justify-center">
        <p className="text-gray-500">Loading data...</p>
      </div>
    );
  }

  // Sort by count (descending) and take top 15
  const sortedChains = [...data]
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  // Find date range for scaling
  const allDates = sortedChains
    .flatMap((chain) => [parseISO(chain.earliest_date), parseISO(chain.latest_date)])
    .filter((d) => !isNaN(d.getTime()));

  if (allDates.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 h-96 flex items-center justify-center">
        <p className="text-gray-500">No valid date data</p>
      </div>
    );
  }

  const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));
  const totalDays = differenceInDays(maxDate, minDate) || 1;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Major Decision Chains Timeline (Top 15 by Volume)</h3>
      <div className="overflow-x-auto">
        <div className="min-w-max">
          {sortedChains.map((chain) => {
            const startDate = parseISO(chain.earliest_date);
            const endDate = parseISO(chain.latest_date);
            const startOffset = Math.max(0, differenceInDays(startDate, minDate));
            const duration = Math.max(1, differenceInDays(endDate, startDate));
            const percentStart = (startOffset / totalDays) * 100;
            const percentDuration = (duration / totalDays) * 100;

            return (
              <div key={chain.meta_decision_id} className="mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-48 truncate">
                    <p className="text-sm font-medium text-gray-900 truncate" title={chain.meta_decision_description}>
                      {chain.meta_decision_description.substring(0, 40)}...
                    </p>
                    <p className="text-xs text-gray-500">{chain.count} decisions</p>
                  </div>
                  <div className="flex-1 h-8 bg-gray-100 rounded relative overflow-hidden">
                    <div
                      className="h-full rounded flex items-center px-2 text-white text-xs font-semibold"
                      style={{
                        left: `${percentStart}%`,
                        width: `${percentDuration}%`,
                        backgroundColor: DECISION_COLORS[chain.type] || '#999',
                      }}
                      title={`${chain.earliest_date} to ${chain.latest_date}`}
                    >
                      {percentDuration > 10 && chain.meta_decision_id.substring(0, 4)}
                    </div>
                  </div>
                  <div className="w-32 text-right">
                    <p className="text-xs text-gray-500">
                      {chain.earliest_date} to {chain.latest_date}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
