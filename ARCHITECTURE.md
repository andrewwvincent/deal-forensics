# Dashboard Architecture

## Component Hierarchy

```
app/layout.tsx (Root Layout)
├── Navigation (title, description)
├── main
│   └── app/page.tsx (Main Dashboard)
│       ├── MetricsCard (4x)
│       │   ├── Total Decisions
│       │   ├── Date Range
│       │   ├── Decision Chains
│       │   └── Monthly Average
│       │
│       ├── Filter Panel
│       │   ├── Date Range Input (from/to)
│       │   ├── Decision Type Dropdown
│       │   └── Chain Status Dropdown
│       │
│       ├── MonthlyVolumeChart (Bar Chart)
│       │   └── Recharts BarChart
│       │
│       ├── DecisionCategoryTrends (Stacked Area)
│       │   └── Recharts AreaChart
│       │
│       ├── DecisionTimelineScatter (Scatter)
│       │   └── Recharts ScatterChart
│       │
│       ├── DecisionChainGantt (Gantt Bars)
│       │   └── Custom HTML bars
│       │
│       └── Summary Table (HTML table)
│
└── footer
    └── Data source attribution
```

## Data Flow

```
┌─────────────────────────────────┐
│   app/page.tsx                  │
│   (Main Dashboard Component)    │
└──────────────┬──────────────────┘
               │
               │ useEffect + Promise.all
               ▼
┌─────────────────────────────────┐
│   lib/data.ts                   │
│   (Aggregation Functions)       │
├─────────────────────────────────┤
│ • getDecisionsSummary()         │
│ • getMonthlyVolume()            │
│ • getDecisionsTimeline()        │
│ • getDecisionChains()           │
│ • getDecisionTypeComposition()  │
└──────────────┬──────────────────┘
               │
               │ Supabase queries
               ▼
┌─────────────────────────────────┐
│   lib/supabase.ts               │
│   (Client + Type Definitions)   │
└──────────────┬──────────────────┘
               │
               │ NEXT_PUBLIC_* env vars
               ▼
┌─────────────────────────────────┐
│   Supabase Project              │
│   (shluyjyhbrttwqfriemc)        │
│   deal_forensics table          │
└─────────────────────────────────┘
```

## Component Responsibilities

### MetricsCard
- Displays single metric with title, value, optional subtitle
- Used for KPIs: total decisions, date range, chains, monthly average
- Stateless presentation component
- Props: `title`, `value`, `subtitle`, `icon`

### MonthlyVolumeChart
- Bar chart of decision count per month
- X-axis: month (MMM yyyy format)
- Y-axis: decision count
- Tooltips show exact counts
- Props: `data: MonthlyVolume[]`, `loading?: boolean`

### DecisionCategoryTrends
- Stacked area chart of decision types over time
- Shows composition evolution
- Each area = one decision type
- Color-coded per DECISION_COLORS mapping
- Props: `data: CategoryTrendData[]`, `loading?: boolean`

### DecisionTimelineScatter
- Scatter plot with decision positions by date and type
- X-axis: time (date)
- Y-axis: categorical (decision type)
- Point size proportional to relevance
- Hover tooltip shows: type, date, location, title
- Props: `data: DecisionRecord[]`, `loading?: boolean`

### DecisionChainGantt
- Horizontal bars showing decision chain timelines
- Top 15 chains by volume
- Each bar spans from earliest to latest decision date
- Color-coded by primary type
- Hover shows full date range
- Props: `data: DecisionChain[]`, `loading?: boolean`

### LoadingSpinner
- Animated spinning circle
- Used during async data loads
- Stateless utility component

## Data Aggregation Logic

### getDecisionsSummary()
Counts and date range per type:
```
SELECT type, COUNT(*), MIN(date), MAX(date)
GROUP BY type
```

Returns array of `DecisionSummary`:
- type: string
- count: number
- earliest: string (ISO date)
- latest: string (ISO date)

### getMonthlyVolume()
Total decisions grouped by month:
```
GROUP BY to_char(date, 'YYYY-MM')
ORDER BY month
```

Returns array of `MonthlyVolume`:
- month: "2025-09"
- date: Date object
- count: number

### getDecisionsTimeline()
Full decision records for scatter plot:
```
SELECT * WHERE date IS NOT NULL
ORDER BY date ASC
LIMIT 1000
```

Returns array of `DecisionRecord`:
- All columns from deal_forensics table
- Sorted by date
- Limited to 1000 for performance

### getDecisionChains()
Group decisions by meta_decision_id:
```
SELECT * WHERE meta_decision_id IS NOT NULL
GROUP BY meta_decision_id
```

Returns array of `DecisionChain`:
- meta_decision_id: uuid
- meta_decision_description: string
- type: string (primary)
- count: number
- earliest_date: string
- latest_date: string
- statuses: string[]
- locations: string[]

### getDecisionTypeComposition()
Monthly stacked composition:
```
GROUP BY to_char(date, 'Mon YYYY'), type
```

Returns array of objects:
```
{
  month: "Sep 2025",
  "Site Evaluation": 45,
  "Operational": 32,
  ...
}
```

## Styling Architecture

### Tailwind Configuration
- Custom colors for 10 decision types
- Responsive grid system (1 col mobile, 2 cols tablet, 3+ cols desktop)
- Utilities for shadows, borders, spacing
- Config: `tailwind.config.ts`

### Global Styles
- Base typography (system font stack)
- Smooth scroll behavior
- Custom scrollbar styling
- CSS: `app/globals.css`

### Component Styling
- Inline Tailwind classes in JSX
- No CSS modules or separate .css files for components
- Consistent color references via `DECISION_COLORS` map

## Performance Considerations

### Data Fetching
- All queries run in parallel via `Promise.all()`
- Supabase indexes on `date_first_asked`, `type`, `meta_decision_id`
- Limit 1000 on timeline to prevent browser slowdown

### Rendering
- `useCallback` and `useMemo` prevent unnecessary re-renders
- Charts use Recharts which optimizes rendering
- Filtering done client-side for instant UI feedback

### Bundle Size
- Recharts: ~130 KB (large but necessary for charts)
- Supabase: ~30 KB
- date-fns: ~15 KB
- Next.js optimizations: code splitting, dynamic imports

## Type Safety

### TypeScript Interfaces
All data structures are fully typed:

```typescript
// From lib/supabase.ts
type DecisionRecord = { ... }
type DecisionSummary = { ... }

// From lib/data.ts
type MonthlyVolume = { ... }
type DecisionChain = { ... }
```

### Component Props
All components have explicit prop types:
```typescript
interface MonthlyVolumeChartProps {
  data: MonthlyVolume[];
  loading?: boolean;
}
```

## Filtering Architecture

Filters are applied client-side in `app/page.tsx`:

1. **Date Range**: Filter `timelineData` by `dateRange.from` and `dateRange.to`
2. **Decision Type**: Filter by `selectedType` (or "All")
3. **Chain Status**: Filter `chainData` by `chainStatus` array inclusion

State management:
```typescript
const [dateRange, setDateRange] = useState({ from, to });
const [selectedType, setSelectedType] = useState('All');
const [chainStatus, setChainStatus] = useState('All');

const filteredTimeline = timelineData.filter(record => {
  // Apply all filters
});
```

## Future Enhancements

### Short-term
1. Add export to CSV/PDF for reports
2. Add date picker UI (calendar)
3. Add search box for decision titles/locations
4. Cache data in localStorage to reduce API calls

### Medium-term
1. Add drill-down capability (click type → see all decisions)
2. Add comparison view (compare two time periods)
3. Add predictive trend lines
4. Add anomaly detection (highlight unusual patterns)

### Long-term
1. Real-time updates via Supabase Realtime subscriptions
2. Multi-project dashboard (compare across tables)
3. ML-powered recommendations
4. Custom metric builder (create KPIs on the fly)

## Security

### Environment Variables
- Only `NEXT_PUBLIC_*` variables are exposed to browser
- These are safe (public Supabase anon keys have limited scope)
- Never put secret keys in client-side code

### Supabase RLS
- Dashboard relies on Supabase Row-Level Security policies
- Anon key can only read `deal_forensics` table
- No writes possible from dashboard (read-only)

### CORS
- Supabase allows cross-origin requests by default
- No additional CORS configuration needed
- Same-origin policy is enforced by browser

## Monitoring & Debugging

### Development
```bash
npm run dev  # Start with HMR
# Open http://localhost:3000
# Check browser DevTools Console for errors
```

### Production
```bash
npm run build
npm start
# Check Vercel dashboard for deployment status
# Use Vercel Analytics for user telemetry
```

### Common Issues
See SETUP.md troubleshooting section

## Testing Strategy (Future)

```typescript
// Example: Test MetricsCard
import { render, screen } from '@testing-library/react';
import { MetricsCard } from '@/components/MetricsCard';

test('renders metric value', () => {
  render(<MetricsCard title="Total" value={100} />);
  expect(screen.getByText('100')).toBeInTheDocument();
});
```

Setup needed:
- Jest configuration
- @testing-library/react
- Mock Supabase in tests
