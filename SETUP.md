# Setup Guide for Deal Forensics Dashboard

## Quick Start (5 minutes)

### 1. Install Dependencies

```bash
cd dashboard
npm install
```

### 2. Configure Environment

Copy the existing `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

The default credentials in `.env.example` are already set to the orchestrator-supabase project:
- `NEXT_PUBLIC_SUPABASE_URL=https://shluyjyhbrttwqfriemc.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_iCSRbK5xL7uHCaa1JtG6Eg_hcxGn1r0`

**No changes needed** if using the orchestrator Supabase project.

### 3. Start Development Server

```bash
npm run dev
```

Navigate to `http://localhost:3000` in your browser.

## Verification Checklist

- [ ] npm install completes without errors
- [ ] Environment variables are set in .env.local
- [ ] `npm run dev` starts without errors
- [ ] Dashboard loads at http://localhost:3000
- [ ] Key metrics display (Total Decisions, Date Range, etc.)
- [ ] Charts render without "no data" errors
- [ ] Filters work when you change date range or type

## Troubleshooting

### "Cannot find module" errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Supabase connection errors

1. Check `.env.local` has both keys set:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://shluyjyhbrttwqfriemc.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
   ```

2. Verify you're not on a corporate proxy that blocks Supabase
3. Test connection:
   ```bash
   curl https://shluyjyhbrttwqfriemc.supabase.co
   ```

### "deal_forensics table not found"

- Confirm you're connecting to the correct Supabase project
- Verify the `deal_forensics` table exists:
  ```bash
  # In browser DevTools console
  const { data, error } = await supabase.from('deal_forensics').select('count(*)');
  ```

### Charts show "No data"

1. Open browser DevTools > Network tab
2. Look for failed requests to `.supabase.co`
3. Check the Supabase dashboard for RLS policy issues
4. Verify `deal_forensics` table has at least 1 row

## Production Build

```bash
npm run build
npm start
```

Test before deploying to ensure all assets are bundled correctly.

## Deployment to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## Code Quality

Type checking:
```bash
npm run type-check
```

Linting:
```bash
npm run lint
```

## Next Steps

After setup is verified:

1. Explore the dashboard at `http://localhost:3000`
2. Try filtering by date range and decision type
3. Hover over chart points to see tooltips
4. Review the monthly trends in the composition chart
5. Scroll to the summary table at the bottom

## File Organization

```
dashboard/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout (nav, footer)
│   ├── page.tsx                 # Main dashboard
│   └── globals.css              # Global styles
│
├── components/                   # Reusable React components
│   ├── MetricsCard.tsx          # Info cards
│   ├── MonthlyVolumeChart.tsx   # Bar chart
│   ├── DecisionCategoryTrends.tsx # Stacked area
│   ├── DecisionTimelineScatter.tsx # Scatter plot
│   ├── DecisionChainGantt.tsx   # Gantt chart
│   └── LoadingSpinner.tsx       # Loading state
│
├── lib/                          # Utilities and data
│   ├── supabase.ts              # Client init + types
│   └── data.ts                  # Query functions
│
├── public/                       # Static assets (create if needed)
│
└── Configuration Files
    ├── package.json
    ├── tsconfig.json
    ├── next.config.js
    ├── tailwind.config.ts
    ├── postcss.config.js
    ├── .env.example
    └── .gitignore
```

## Development Tips

### Adding a New Chart

1. Create component in `components/MyChart.tsx`:
   ```typescript
   'use client';
   import { MyChartData } from '@/lib/data';
   
   export function MyChart({ data }: { data: MyChartData[] }) {
     return <div>// Recharts component</div>;
   }
   ```

2. Add data fetch in `lib/data.ts`:
   ```typescript
   export async function getMyChartData(): Promise<MyChartData[]> {
     const { data } = await supabase.from('deal_forensics').select(...);
     return data || [];
   }
   ```

3. Import and use in `app/page.tsx`:
   ```typescript
   const [myData, setMyData] = useState<MyChartData[]>([]);
   
   useEffect(() => {
     getMyChartData().then(setMyData);
   }, []);
   
   return <MyChart data={myData} />;
   ```

### Modifying Colors

Edit `lib/data.ts`:
```typescript
export const DECISION_COLORS: Record<string, string> = {
  'Site Evaluation': '#8b5cf6',
  // ... change hex values
};
```

Also update `tailwind.config.ts` for consistency.

### Performance Optimization

If dashboard gets slow:

1. Reduce limit in `getDecisionsTimeline()`:
   ```typescript
   .limit(500)  // Instead of 1000
   ```

2. Add pagination to the summary table

3. Cache results using SWR or React Query (future enhancement)

## Questions?

- Check browser DevTools Console for errors
- Review data.ts query functions
- Verify Supabase credentials
- Check README.md for more details
