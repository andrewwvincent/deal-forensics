# Component Implementation Guide

## Overview

This guide describes each component, its props, rendering logic, and integration points.

---

## MetricsCard.tsx

**Purpose**: Display KPI metrics in a card layout

**Props**:
```typescript
interface MetricsCardProps {
  title: string;           // Label (e.g., "Total Decisions")
  value: string | number;  // The metric value (e.g., 1193)
  subtitle?: string;       // Optional secondary text
  icon?: React.ReactNode;  // Optional icon element
}
```

**Usage**:
```tsx
<MetricsCard
  title="Total Decisions"
  value={1193}
  subtitle="Across 10 decision types"
/>
```

**Renders**:
- White card with shadow
- Bold title in small gray text
- Large bold value
- Optional subtitle in smaller text
- Optional icon in top right

**File Location**: `components/MetricsCard.tsx` (23 LOC)

---

## MonthlyVolumeChart.tsx

**Purpose**: Bar chart of total decisions per month

**Props**:
```typescript
interface MonthlyVolumeChartProps {
  data: MonthlyVolume[];  // Array with { month, date, count }
  loading?: boolean;       // Show spinner while loading
}
```

**Data Format**:
```typescript
type MonthlyVolume = {
  month: string;  // "Sep 2025"
  date: Date;     // JavaScript Date object
  count: number;  // 45 decisions
};
```

**Features**:
- X-axis: Month label (rotated -45°)
- Y-axis: Count (auto-scaled)
- Grid lines for readability
- Tooltip shows exact count on hover
- Rounded bar tops
- Loading spinner if `loading={true}`

**Dependencies**:
- Recharts: BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip

**File Location**: `components/MonthlyVolumeChart.tsx` (48 LOC)

---

## DecisionCategoryTrends.tsx

**Purpose**: Stacked area chart showing decision type composition over time

**Props**:
```typescript
interface DecisionCategoryTrendsProps {
  data: CategoryTrendData[];  // Array of monthly data with type counts
  loading?: boolean;
}
```

**Data Format**:
```typescript
type CategoryTrendData = {
  month: string;           // "Sep 2025"
  'Site Evaluation': 45;   // Count for each type as separate key
  'Operational': 32;
  // ... 10 types total
};
```

**Features**:
- Stacked areas (no overlap, shows 100% composition)
- Color-coded by decision type
- Each area represents one type
- Tooltip shows all types at that point
- Legend auto-generated from data keys
- Fully responsive

**Rendering Logic**:
1. Extract all keys except 'month' as decision types
2. For each type, create an `<Area>` component
3. Use `DECISION_COLORS` map for consistent colors
4. Set `stackId="1"` to create stacking

**Dependencies**:
- Recharts: AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend
- `DECISION_COLORS` from lib/data.ts

**File Location**: `components/DecisionCategoryTrends.tsx` (69 LOC)

---

## DecisionTimelineScatter.tsx

**Purpose**: Scatter plot showing individual decisions plotted by date and type

**Props**:
```typescript
interface DecisionTimelineScatterProps {
  data: DecisionRecord[];  // Full decision records
  loading?: boolean;
}
```

**Data Format**:
```typescript
type DecisionRecord = {
  date_first_asked: string;  // "2025-09-04"
  type: string;              // "Site Evaluation"
  location: string;          // "Greenwich, CT"
  title: string;             // Decision summary
  // ... plus 13 other fields
};
```

**Features**:
- X-axis: Date (auto-scaled, rotated labels)
- Y-axis: Decision type (categorical)
- Points sized and colored by type
- Each point = one decision
- Hover tooltip shows: type, date, location, title
- Helps identify decision clustering/patterns

**Rendering Logic**:
1. Filter records with valid date and type
2. Convert date to milliseconds (for X positioning)
3. Map type string to Y index (0-9)
4. For each point, apply color from `DECISION_COLORS[type]`
5. Custom tooltip component shows decision details

**Dependencies**:
- Recharts: ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Cell
- date-fns: parseISO
- `DECISION_COLORS` from lib/data.ts

**File Location**: `components/DecisionTimelineScatter.tsx` (91 LOC)

---

## DecisionChainGantt.tsx

**Purpose**: Horizontal Gantt-like visualization of decision chain timelines

**Props**:
```typescript
interface DecisionChainGanttProps {
  data: DecisionChain[];  // Array of chain metadata
  loading?: boolean;
}
```

**Data Format**:
```typescript
type DecisionChain = {
  meta_decision_id: string;           // UUID
  meta_decision_description: string;  // "National Portfolio Decision"
  type: string;                       // Primary type
  count: number;                      // 176 decisions in chain
  earliest_date: string;              // "2025-09-02"
  latest_date: string;                // "2026-05-07"
  statuses: string[];                 // Array of unique statuses
  locations: string[];                // Array of unique locations
};
```

**Features**:
- Top 15 chains by volume
- Horizontal bars show timeline from earliest to latest date
- Color-coded by primary decision type
- Bar length = chain duration
- Tooltip on hover shows date range
- Left sidebar shows chain name and decision count
- Right sidebar shows date range and duration

**Rendering Logic**:
1. Sort by count descending, take top 15
2. Find overall min/max dates across all chains
3. For each chain:
   - Calculate startOffset = days from min to chain earliest
   - Calculate duration = days from chain earliest to latest
   - Render bar at percentage position: `(startOffset / totalDays) * 100%`
   - Set width: `(duration / totalDays) * 100%`
4. Apply color from `DECISION_COLORS[chain.type]`

**Dependencies**:
- date-fns: parseISO, differenceInDays
- `DECISION_COLORS` from lib/data.ts

**File Location**: `components/DecisionChainGantt.tsx` (92 LOC)

---

## LoadingSpinner.tsx

**Purpose**: Simple loading indicator

**Props**: None

**Features**:
- Animated spinning circle
- Blue color (#3b82f6)
- Centered in container
- Used during async data loads

**Usage**:
```tsx
{loading ? (
  <LoadingSpinner />
) : (
  <YourContent />
)}
```

**File Location**: `components/LoadingSpinner.tsx` (7 LOC)

---

# Data Functions (lib/data.ts)

Each function queries Supabase and transforms results into chart-ready format.

## getDecisionsSummary()

**Returns**: `Promise<DecisionSummary[]>`

**Query**:
```sql
SELECT type, COUNT(*), MIN(date_first_asked), MAX(date_first_asked)
FROM deal_forensics
WHERE type IS NOT NULL AND date_first_asked IS NOT NULL
GROUP BY type
ORDER BY type
```

**Output**:
```typescript
[
  {
    type: "Site Evaluation",
    count: 297,
    earliest: "2025-04-24",
    latest: "2026-05-07"
  },
  // ... 9 more types
]
```

**Used By**:
- MetricsCard (total count, date range)
- Summary table at bottom
- Filter dropdown

---

## getMonthlyVolume()

**Returns**: `Promise<MonthlyVolume[]>`

**Logic**:
1. Fetch all records with `date_first_asked`
2. Group by month (YYYY-MM)
3. Count records per month
4. Convert to array with Date objects
5. Sort chronologically

**Output**:
```typescript
[
  {
    month: "2025-09",
    date: new Date("2025-09-01"),
    count: 92
  },
  // ... monthly entries
]
```

**Used By**: MonthlyVolumeChart

---

## getDecisionsTimeline()

**Returns**: `Promise<DecisionRecord[]>`

**Query**:
```sql
SELECT * FROM deal_forensics
WHERE date_first_asked IS NOT NULL
ORDER BY date_first_asked ASC
LIMIT 1000
```

**Output**: Full `DecisionRecord` array, sorted by date

**Used By**:
- DecisionTimelineScatter (main chart)
- Applied filters (dateRange, selectedType)

---

## getDecisionChains()

**Returns**: `Promise<DecisionChain[]>`

**Logic**:
1. Fetch all records with `meta_decision_id`
2. Group by `meta_decision_id`
3. For each group:
   - Extract unique types, statuses, locations
   - Find earliest and latest dates
   - Count records
4. Return as array of `DecisionChain` objects

**Output**:
```typescript
[
  {
    meta_decision_id: "12345...",
    meta_decision_description: "National Portfolio...",
    type: "Operational",
    count: 176,
    earliest_date: "2025-09-02",
    latest_date: "2026-05-07",
    statuses: ["active", "pending"],
    locations: ["Greenwich", "Tulsa", ...]
  },
  // ... 9 more chains
]
```

**Used By**:
- DecisionChainGantt (main visualization)
- Applied filter (chainStatus)
- MetricsCard (chain count)

---

## getDecisionTypeComposition()

**Returns**: `Promise<Array<{ month: string; [type: string]: number }>>`

**Logic**:
1. Fetch all records with `date_first_asked` and `type`
2. Group by month and type
3. Create object for each month with counts per type
4. Return as array suitable for Recharts stacked area

**Output**:
```typescript
[
  {
    month: "Sep 2025",
    "Site Evaluation": 45,
    "Operational": 32,
    "Process/Systems": 15,
    // ... 7 more types
  },
  // ... monthly entries
]
```

**Used By**: DecisionCategoryTrends

---

# Integration Points

## app/page.tsx Flow

```
1. Component mounts
2. useEffect triggers
3. Promise.all() calls all 5 data functions
4. Results set in state
5. Components render with data
6. User interacts with filters
7. Filtered data computed
8. Components re-render with filtered subset
```

## Filter Logic

```typescript
const [dateRange, setDateRange] = useState({ from, to });
const [selectedType, setSelectedType] = useState('All');
const [chainStatus, setChainStatus] = useState('All');

// Applied to timelineData
const filteredTimeline = timelineData.filter(record => {
  const recordDate = new Date(record.date_first_asked);
  const inRange = recordDate >= fromDate && recordDate <= toDate;
  const typeMatch = selectedType === 'All' || record.type === selectedType;
  return inRange && typeMatch;
});

// Applied to chainData
const filteredChains = chainData.filter(chain => {
  return chainStatus === 'All' || chain.statuses.includes(chainStatus);
});
```

---

# Adding New Components

## Template

```tsx
'use client';  // Mark as client component

import React from 'react';
import { SomeChart, SomeAxis } from 'recharts';
import type { YourDataType } from '@/lib/data';

interface YourComponentProps {
  data: YourDataType[];
  loading?: boolean;
}

export function YourComponent({ data, loading }: YourComponentProps) {
  if (loading) {
    return <LoadingPlaceholder />;
  }

  if (!data || data.length === 0) {
    return <NoDataMessage />;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Chart Title
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <SomeChart data={data}>
          {/* Recharts elements */}
        </SomeChart>
      </ResponsiveContainer>
    </div>
  );
}
```

## Steps

1. Create file in `components/YourComponent.tsx`
2. Add `'use client'` directive at top
3. Define Props interface
4. Handle loading state
5. Handle empty data state
6. Render Recharts component (or custom HTML)
7. Export component
8. Import and integrate in `app/page.tsx`
9. Add data fetch function in `lib/data.ts` if needed
10. Update filter logic if applicable

---

# Component Dependencies Diagram

```
app/page.tsx (Main orchestrator)
│
├─→ MetricsCard ×4
│   ├─ Dependencies: DecisionSummary[]
│   └─ No child components
│
├─→ Filter Panel (inline HTML)
│   ├─ Dependencies: DecisionSummary[]
│   └─ Updates state only
│
├─→ MonthlyVolumeChart
│   ├─ Dependencies: MonthlyVolume[]
│   └─ Recharts: BarChart
│
├─→ DecisionCategoryTrends
│   ├─ Dependencies: CompositionData[]
│   └─ Recharts: AreaChart
│
├─→ DecisionTimelineScatter
│   ├─ Dependencies: DecisionRecord[] (filtered)
│   └─ Recharts: ScatterChart
│
├─→ DecisionChainGantt
│   ├─ Dependencies: DecisionChain[] (filtered)
│   └─ Custom HTML bars
│
└─→ Summary Table (inline HTML)
    ├─ Dependencies: DecisionSummary[]
    └─ No Recharts
```

---

# Testing Components

## Example: Testing MetricsCard

```typescript
import { render, screen } from '@testing-library/react';
import { MetricsCard } from '@/components/MetricsCard';

describe('MetricsCard', () => {
  it('renders title and value', () => {
    render(
      <MetricsCard title="Test Metric" value={123} />
    );
    
    expect(screen.getByText('Test Metric')).toBeInTheDocument();
    expect(screen.getByText('123')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(
      <MetricsCard 
        title="Test" 
        value={123} 
        subtitle="per month"
      />
    );
    
    expect(screen.getByText('per month')).toBeInTheDocument();
  });
});
```

Setup needed:
- Jest
- @testing-library/react
- Mock Supabase

---

This guide should provide everything needed to understand, modify, and extend the dashboard components.
