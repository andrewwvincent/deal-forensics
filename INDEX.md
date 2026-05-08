# Deal Forensics Dashboard — Project Index

## Quick Links

- **README.md** — Project overview, features, tech stack
- **SETUP.md** — Installation and configuration guide
- **ARCHITECTURE.md** — Component hierarchy, data flow, design decisions

## Project Statistics

- **Total Lines of Code**: 826 (TypeScript/TSX only)
- **Components**: 6 reusable React components
- **Data Queries**: 5 aggregation functions
- **Visualizations**: 5 main charts + 1 metrics card set + 1 summary table
- **Project Size**: 103 KB (without node_modules)
- **Configuration Files**: 8 (tsconfig, tailwind, next, postcss, etc.)

## File Structure at a Glance

### Configuration (8 files)
```
package.json              ← Dependencies and scripts
tsconfig.json            ← TypeScript configuration
next.config.js           ← Next.js build config
tailwind.config.ts       ← Tailwind CSS theme
postcss.config.js        ← CSS processing pipeline
.env.example             ← Environment variables template
.gitignore               ← Git exclusions
README.md                ← Main documentation
```

### Application Layer (3 files, 33 LOC)
```
app/
├── layout.tsx            ← Root layout, nav, footer
├── page.tsx              ← Main dashboard (230 LOC)
├── globals.css           ← Global styles (Tailwind imports)
└── page.tsx.example      ← Component usage reference
```

### Components (6 files, 330 LOC)
```
components/
├── MetricsCard.tsx                    ← KPI cards (23 LOC)
├── MonthlyVolumeChart.tsx             ← Bar chart (48 LOC)
├── DecisionCategoryTrends.tsx         ← Stacked area (69 LOC)
├── DecisionTimelineScatter.tsx        ← Scatter plot (91 LOC)
├── DecisionChainGantt.tsx             ← Gantt timeline (92 LOC)
└── LoadingSpinner.tsx                 ← Loading state (7 LOC)
```

### Data Layer (2 files, 233 LOC)
```
lib/
├── supabase.ts           ← Supabase client, type definitions (50 LOC)
└── data.ts               ← Query functions, aggregation logic (183 LOC)
```

### Documentation (4 files)
```
README.md                ← Overview, features, deployment
SETUP.md                 ← Installation & troubleshooting
ARCHITECTURE.md          ← Design decisions, data flow
INDEX.md                 ← This file
```

## Key Files to Know

### Entry Point
**`app/page.tsx`** (230 LOC)
- Main dashboard component
- Orchestrates all data fetching
- Implements filtering logic
- Renders 8 visualization sections

### Data Fetching
**`lib/data.ts`** (183 LOC)
- 5 query functions (summary, volume, timeline, chains, composition)
- Aggregation and transformation logic
- Color mapping for decision types

### Components
**`components/*.tsx`** (6 files)
- All pure, reusable React components
- Integrated with Recharts for visualizations
- Accept `data` and `loading` props

### Configuration
**`tailwind.config.ts`**
- Custom colors for 10 decision types
- Responsive breakpoints
- Extended theme configuration

## Data Model

### Main Table: `deal_forensics`

1,193 records with:
- `date_first_asked` (date) — Decision timestamp
- `type` (text) — One of 10 consolidated types
- `location` (text) — Site location
- `meta_decision_id` (uuid) — Decision chain ID
- `status` (text) — Current status
- Plus 7 additional fields for context

### Derived Data Structures

```
DecisionSummary
├── type: string
├── count: number
├── earliest: string
└── latest: string

MonthlyVolume
├── month: string
├── date: Date
└── count: number

DecisionRecord (extends table)
└── All columns from deal_forensics

DecisionChain
├── meta_decision_id: string
├── meta_decision_description: string
├── type: string
├── count: number
├── earliest_date: string
├── latest_date: string
├── statuses: string[]
└── locations: string[]
```

## Development Workflow

### First Time Setup
```bash
npm install
cp .env.example .env.local
npm run dev
# Visit http://localhost:3000
```

### During Development
```bash
npm run dev          # Start HMR server
npm run type-check   # Verify TypeScript
npm run lint         # ESLint check
```

### Before Production
```bash
npm run build        # Create optimized bundle
npm start            # Test production build
npm run type-check   # Final type verification
```

### Adding a New Feature

1. **New Chart**:
   - Create `components/MyChart.tsx`
   - Add query function in `lib/data.ts`
   - Import and integrate in `app/page.tsx`

2. **New Metric**:
   - Add query in `lib/data.ts`
   - Create MetricsCard instance in `app/page.tsx`
   - Update layout grid

3. **New Filter**:
   - Add state in `app/page.tsx`: `const [filter, setFilter] = useState(...)`
   - Add UI control in filter panel
   - Apply in filtered data computation

## Colors by Decision Type

| Type | Hex Color | CSS Class | Tailwind |
|------|-----------|-----------|----------|
| Site Evaluation | #8b5cf6 | site-eval | purple-500 |
| Operational | #f59e0b | operational | amber-500 |
| Process/Systems | #10b981 | process-sys | green-500 |
| Planning/Strategy | #3b82f6 | planning | blue-500 |
| Admin/Other | #6b7280 | admin | gray-500 |
| Regulatory/Legal | #ef4444 | regulatory | red-500 |
| Lease/Real Estate | #ec4899 | lease | pink-500 |
| Financial | #f97316 | financial | orange-500 |
| Facility/Infrastructure | #14b8a6 | facility | teal-500 |
| Governance | #6366f1 | governance | indigo-500 |

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile: iOS 12+, Android 8+

## Performance Targets

- **Page Load**: < 3 seconds (first paint)
- **Interactive**: < 5 seconds (time to interactive)
- **Chart Render**: < 1 second per chart
- **Filter Response**: < 100 ms

## Testing Coverage (Future)

- [ ] Unit tests for data aggregation functions
- [ ] Component render tests
- [ ] Integration tests with Supabase queries
- [ ] E2E tests for complete user flow

## Deployment Platforms

### Vercel (Recommended)
```bash
vercel deploy --prod
```
Automatic environment variable management, preview deployments, analytics included.

### Self-Hosted (Node.js)
```bash
npm run build
npm start
```
Requires Node.js 18+, PM2 or similar for process management.

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install && npm run build
CMD ["npm", "start"]
```

## Environment Variables

### Required
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Public anon key

### Optional
- None currently (all required)

### Development
Default `.env.example` is pre-configured with orchestrator-supabase credentials.

## Decision Types Breakdown

**10 Consolidated Types** from 261 originals:

1. **Site Evaluation** (297) — Site screening, location analysis, property assessment
2. **Operational** (267) — Day-to-day operations, staffing, curriculum
3. **Process/Systems** (144) — Workflow optimization, system integration
4. **Planning/Strategy** (120) — Long-term planning, expansion, market entry
5. **Admin/Other** (90) — Administrative, miscellaneous
6. **Lease/Real Estate** (73) — Lease terms, property selection, negotiations
7. **Regulatory/Legal** (69) — Compliance, legal review, permitting
8. **Financial** (59) — Budget, pricing, ROI analysis
9. **Facility/Infrastructure** (38) — Building, equipment, physical plant
10. **Governance** (36) — Board decisions, policies, oversight

## Key Insights Enabled by Dashboard

1. **Bottleneck Evolution** — Track decision volume over time
2. **Type Distribution** — See composition changes month-to-month
3. **Decision Chain Analysis** — Identify longest/most impactful chains
4. **Timeline Patterns** — Spot decision clustering/surge periods
5. **National Portfolio Chain** — The central 176-decision bottleneck is visible in Gantt view

## Next Steps After Setup

1. Run `npm install && npm run dev`
2. Open http://localhost:3000
3. Explore each visualization
4. Try filtering by date and type
5. Review ARCHITECTURE.md for design details
6. Consider deployment to Vercel

## Support Resources

- **Recharts Docs**: https://recharts.org/
- **Next.js 14 Docs**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Supabase JS Client**: https://supabase.com/docs/reference/javascript
- **TypeScript**: https://www.typescriptlang.org/docs/

## Project Contact

Created for Trilogy Deal Forensics analysis.  
For questions about the dashboard, review the README and SETUP guides, or contact the Data Operations team.

---

**Last Updated**: May 8, 2026  
**Dashboard Version**: 1.0.0  
**Status**: Ready for local development and deployment
