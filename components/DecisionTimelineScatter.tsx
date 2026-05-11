'use client';

import React, { useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { format, parseISO } from 'date-fns';
import { DECISION_COLORS } from '@/lib/data';
import type { DecisionRecord } from '@/lib/supabase';

interface DecisionTimelineScatterProps {
  data: DecisionRecord[];
  loading?: boolean;
}

export function DecisionTimelineScatter({ data, loading }: DecisionTimelineScatterProps) {
  const scatterData = useMemo(() => {
    const filtered = data.filter((d) => d.date_first_asked && d.type);
    console.log('DecisionTimelineScatter received data count:', filtered.length);

    const mapped = filtered.map((d) => ({
      x: parseISO(d.date_first_asked).getTime(),
      y: Object.keys(DECISION_COLORS).indexOf(d.type),
      type: d.type,
      date: d.date_first_asked,
      location: d.location || 'Unknown',
      title: d.title || 'Untitled',
    }));

    if (mapped.length > 0) {
      const xValues = mapped.map(m => m.x);
      const minX = Math.min(...xValues);
      const maxX = Math.max(...xValues);
      console.log('X-axis range (ms):', minX, '-', maxX);
      console.log('X-axis range (dates):', new Date(minX), '-', new Date(maxX));
      console.log('First 3 records:', mapped.slice(0, 3));
    }

    return mapped;
  }, [data]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 h-96 flex items-center justify-center">
        <p className="text-gray-500">Loading data...</p>
      </div>
    );
  }

  const typeLabels = Object.keys(DECISION_COLORS);

  // Calculate domain to avoid auto-scaling issues
  const domain = scatterData.length > 0
    ? [Math.min(...scatterData.map(d => d.x)), Math.max(...scatterData.map(d => d.x))]
    : [0, 1];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Decision Timeline by Type</h3>
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart margin={{ top: 5, right: 30, left: 0, bottom: 100 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="x"
            type="number"
            domain={domain}
            tickFormatter={(value) => format(new Date(value), 'MMM yyyy')}
            angle={-45}
            textAnchor="end"
            height={100}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            dataKey="y"
            type="number"
            tickFormatter={(value) => typeLabels[value] || 'Unknown'}
            width={120}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
            cursor={{ strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (active && payload && payload[0]) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white p-3 border border-gray-300 rounded shadow">
                    <p className="font-semibold text-sm">{data.type}</p>
                    <p className="text-xs text-gray-600">{data.date}</p>
                    <p className="text-xs text-gray-600">{data.location}</p>
                    {data.title && <p className="text-xs text-gray-500 truncate">{data.title}</p>}
                  </div>
                );
              }
              return null;
            }}
          />
          <Scatter name="Decisions" data={scatterData} fill="#8884d8">
            {scatterData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={DECISION_COLORS[entry.type] || '#8884d8'} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
