'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DECISION_COLORS } from '@/lib/data';

interface CategoryTrendData {
  month: string;
  [key: string]: number | string;
}

interface DecisionCategoryTrendsProps {
  data: CategoryTrendData[];
  loading?: boolean;
}

export function DecisionCategoryTrends({ data, loading }: DecisionCategoryTrendsProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 h-96 flex items-center justify-center">
        <p className="text-gray-500">Loading data...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 h-96 flex items-center justify-center">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  // Get all decision types (excluding 'month' key)
  const types = Object.keys(data[0]).filter((key) => key !== 'month');

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Decision Category Composition Over Time</h3>
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
            formatter={(value) => `${value} decisions`}
          />
          <Legend />
          {types.map((type, index) => (
            <Area
              key={type}
              type="monotone"
              dataKey={type}
              stackId="1"
              stroke={DECISION_COLORS[type] || `#${Math.floor(Math.random() * 16777215).toString(16)}`}
              fill={DECISION_COLORS[type] || `#${Math.floor(Math.random() * 16777215).toString(16)}`}
              isAnimationActive={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
