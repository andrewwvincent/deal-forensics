# Deal Forensics Decision Analytics Dashboard

A Next.js 14 dashboard for analyzing decision patterns across 1,193 decisions from the deal forensics Supabase table. The dashboard visualizes the evolution of the approval bottleneck from September 2025 to May 2026.

## Overview

This dashboard provides comprehensive analytics on decision-making patterns across 10 consolidated decision types:

- **Site Evaluation** (297 decisions)
- **Operational** (267 decisions)
- **Process/Systems** (144 decisions)
- **Planning/Strategy** (120 decisions)
- **Admin/Other** (90 decisions)
- **Lease/Real Estate** (73 decisions)
- **Regulatory/Legal** (69 decisions)
- **Financial** (59 decisions)
- **Facility/Infrastructure** (38 decisions)
- **Governance** (36 decisions)

Plus 10 major decision chains tracking meta-decision groups and their progression through stages.

## Features

### Visualizations

1. **Key Metrics Card** — Total decisions, date range, number of chains, monthly average
2. **Monthly Decision Volume** — Bar chart showing total decisions per month
3. **Decision Category Composition** — Stacked area chart showing type distribution over time
4. **Decision Timeline Scatter Plot** — X-axis: date, Y-axis: type, sized to emphasize volume
5. **Decision Chain Gantt** — Horizontal timeline showing top 15 decision chains and their duration
6. **Decision Type Summary Table** — Detailed breakdown with count, date range, duration

### Filtering

- **Date Range** — Filter decisions by start and end date
- **Decision Type** — Filter by consolidated type
- **Chain Status** — Filter decision chains by status

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **UI**: React 18
- **Visualizations**: Recharts
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- npm, yarn, or pnpm

### Installation

```bash
# Clone or navigate to the project
cd dashboard

# Install dependencies
npm install
# or
yarn install
# or
pnpm install
```

### Environment Setup

1. Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

2. Update with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://shluyjyhbrttwqfriemc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_iCSRbK5xL7uHCaa1JtG6Eg_hcxGn1r0
```

The credentials are available from:
- Orchestrator Supabase dashboard (shluyjyhbrttwqfriemc)
- Or retrieve via: `mcp__supabase-orchestrator__get_publishable_keys`

### Development

```bash
npm run dev
```

The dashboard will be available at `http://localhost:3000`

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
dashboard/
├── app/
│   ├── layout.tsx           # Root layout with nav and footer
│   ├── page.tsx             # Main dashboard page
│   └── globals.css          # Global styles
├── components/
│   ├── MetricsCard.tsx      # Key metrics display
│   ├── MonthlyVolumeChart.tsx # Monthly bar chart
│   ├── DecisionCategoryTrends.tsx # Stacked area chart
│   ├── DecisionTimelineScatter.tsx # Scatter plot
│   ├── DecisionChainGantt.tsx # Gantt timeline
│   └── LoadingSpinner.tsx   # Loading indicator
├── lib/
│   ├── supabase.ts          # Supabase client setup and types
│   └── data.ts              # Data fetching and aggregation logic
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── next.config.js
├── .env.example
├── .gitignore
└── README.md
```

## Data Schema

The dashboard queries the `deal_forensics` table with the following relevant columns:

```typescript
type DecisionRecord = {
  id: string;                      // Unique record ID
  date_first_asked: date;          // Decision date
  type: text;                      // One of 10 consolidated types
  type_original: text;             // Original granular type
  location: text;                  // Site location
  title: text;                     // Decision title
  status: text;                    // Current status
  decision_owner: text;            // Responsible party
  notes: text;                     // Additional context
  meta_decision_id: uuid;          // Decision chain ID
  decision_sequence_num: int;      // Sequence in chain
  meta_decision_description: text; // Chain description
  // ... plus additional fields
};
```

## Query Functions

All data queries are in `lib/data.ts`:

- `getDecisionsSummary()` — Get count, earliest, latest per type
- `getMonthlyVolume()` — Get total decisions per month
- `getDecisionsTimeline()` — Get all decisions with dates for scatter plot
- `getDecisionChains()` — Get grouped decisions by meta_decision_id
- `getDecisionTypeComposition()` — Get monthly type distribution

## Color Scheme

Each decision type has a dedicated color:

- Site Evaluation: `#8b5cf6` (Purple)
- Operational: `#f59e0b` (Amber)
- Process/Systems: `#10b981` (Green)
- Planning/Strategy: `#3b82f6` (Blue)
- Admin/Other: `#6b7280` (Gray)
- Regulatory/Legal: `#ef4444` (Red)
- Lease/Real Estate: `#ec4899` (Pink)
- Financial: `#f97316` (Orange)
- Facility/Infrastructure: `#14b8a6` (Teal)
- Governance: `#6366f1` (Indigo)

## Key Insights

The dashboard emphasizes:

1. **Bottleneck Evolution** — How decision volume and type distribution shifted over 8 months
2. **National Portfolio Chain** — The largest meta-decision (176+ records) tracking the central bottleneck
3. **Decision Type Composition** — The shifting balance between Site Evaluation, Operational, and Process/Systems decisions
4. **Timeline Clustering** — Visual detection of decision surges at specific dates

## Deployment

To deploy to Vercel:

```bash
vercel deploy
```

The dashboard will automatically pull from your Supabase project and display live data.

## Performance

- All data queries use Supabase indexes for fast retrieval
- Charts are memoized to prevent unnecessary re-renders
- Filtering is done client-side for instant feedback
- Limit of 1,000 records per scatter plot (top records by date)

## Troubleshooting

### "No data appears"

1. Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
2. Verify the `deal_forensics` table exists in Supabase
3. Open browser DevTools and check Network tab for API errors
4. Confirm Supabase project is accessible and has RLS policies allowing public reads

### Slow load times

1. Check your internet connection
2. Verify Supabase project is not under heavy load
3. Consider reducing the scatter plot limit in `getDecisionsTimeline()`

### Charts not rendering

1. Clear browser cache and reload
2. Check browser console for Recharts errors
3. Ensure React 18+ is installed (`npm list react`)

## License

Internal use only. Created for Trilogy decision forensics analysis.

## Contact

For questions, contact the Data Operations team or the session that built this dashboard.
