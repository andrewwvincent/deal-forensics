const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const orchestratorUrl = 'https://shluyjyhbrttwqfriemc.supabase.co';
const orchestratorAnonKey = 'sb_publishable_iCSRbK5xL7uHCaa1JtG6Eg_hcxGn1r0';

const reblUrl = 'https://mnxgkozrutvylzeogphh.supabase.co';
const reblAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ueGdrb3pydXR2eWx6ZW9ncGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNTM3MjUsImV4cCI6MjA2NDcyOTcyNX0.SAxTY42F5W_XdA6p7g5fnlunu0yGzNacoBXWTmNj4is';

const supabase = createClient(orchestratorUrl, orchestratorAnonKey);
const supabaseRebl = createClient(reblUrl, reblAnonKey);

// Parse REBL site_id to extract city (second-to-last segment)
function extractCity(siteId) {
  const parts = siteId.split('-');
  return parts[parts.length - 2] || 'unknown'; // e.g., "new-york" from "180-maiden-ln-new-york-ny"
}

// Extract state from decision location
function extractState(location) {
  if (!location) return null;
  const stateAbbrevs = {
    'tx': 'tx', 'texas': 'tx',
    'ca': 'ca', 'california': 'ca',
    'fl': 'fl', 'florida': 'fl',
    'ny': 'ny', 'new york': 'ny', 'nyc': 'ny',
    'az': 'az', 'arizona': 'az',
    'co': 'co', 'colorado': 'co',
    'il': 'il', 'illinois': 'il', 'chicago': 'il',
    'ma': 'ma', 'massachusetts': 'ma',
    'wa': 'wa', 'washington': 'wa',
    'ut': 'ut', 'utah': 'ut',
    'tn': 'tn', 'tennessee': 'tn',
    'ok': 'ok', 'oklahoma': 'ok',
    'nc': 'nc', 'north carolina': 'nc',
    'ct': 'ct', 'connecticut': 'ct',
    'va': 'va', 'virginia': 'va',
    'md': 'md', 'maryland': 'md',
    'nj': 'nj', 'new jersey': 'nj',
    'pa': 'pa', 'pennsylvania': 'pa',
  };

  const lower = location.toLowerCase();
  for (const [pattern, state] of Object.entries(stateAbbrevs)) {
    if (lower.includes(pattern)) return state;
  }
  return null;
}

// Extract city from decision location using patterns
function extractCitiesFromLocation(location) {
  if (!location) return [];

  const lower = location.toLowerCase();
  const cities = [];

  // Comprehensive city keyword mapping
  const cityPatterns = {
    'austin': ['austin'],
    'boston': ['boston'],
    'chicago': ['chicago'],
    'dallas': ['dallas', 'dfw'],
    'denver': ['denver'],
    'los-angeles': ['los angeles', ' la '],
    'miami': ['miami'],
    'miami-beach': ['miami beach'],
    'new-york': ['new york', 'nyc', 'manhattan', '150 west'],
    'palm-beach': ['palm beach'],
    'san-francisco': ['san francisco', ' sf ', 'bay area'],
    'scottsdale': ['scottsdale'],
    'phoenix': ['phoenix'],
    'tulsa': ['tulsa'],
    'park-city': ['park city'],
    'frisco': ['frisco'],
    'plano': ['plano'],
    'carrollton': ['carrollton'],
    'greenwich': ['greenwich'],
    'stamford': ['stamford'],
    'lexington': ['lexington'],
    'raleigh': ['raleigh'],
    'boca-raton': ['boca'],
    'fort-worth': ['fort worth'],
    'santa-monica': ['santa monica'],
    'campbell': ['campbell', 'santa clara'],
  };

  for (const [city, keywords] of Object.entries(cityPatterns)) {
    if (keywords.some(kw => lower.includes(kw))) {
      if (!cities.includes(city)) cities.push(city);
    }
  }

  return cities;
}

async function matchAndUpdate() {
  console.log('Fetching all REBL sites...');
  const { data: reblSites, error: reblError } = await supabaseRebl
    .from('rebl3_status')
    .select('site_id');

  if (reblError) throw reblError;

  // Get unique REBL sites
  const uniqueReblSites = [...new Set(reblSites.map(r => r.site_id))];
  console.log(`Found ${uniqueReblSites.length} unique REBL sites`);

  // Instead of extracting cities, just keep full site_ids and search them directly
  // This avoids the parsing problem
  const sitesBySearchable = {};

  uniqueReblSites.forEach(site => {
    // Create searchable version of site_id
    const searchable = site.replace(/-/g, ' ').toLowerCase(); // e.g., "180 maiden ln new york ny"
    sitesBySearchable[site] = searchable;
  });

  console.log(`Indexed ${uniqueReblSites.length} sites for direct matching`);

  console.log('Fetching decisions without REBL sites...');
  const { data: allDecisions, error: decisionError } = await supabase
    .from('deal_forensics')
    .select('id, location, related_sites, notes, title, related_rebl_sites')
    .range(0, 2000);

  if (decisionError) throw decisionError;

  // Filter for empty related_rebl_sites
  const decisions = allDecisions.filter(d =>
    !d.related_rebl_sites || d.related_rebl_sites.length === 0
  );

  console.log(`Found ${decisions.length} decisions to match (out of ${allDecisions.length} total)`);

  let matched = 0;
  let ambiguous = 0;
  let stateFiltered = 0;
  const updates = [];
  const ambiguousMatches = [];

  for (const decision of decisions) {
    const decisionLocation = (decision.location || '').toLowerCase();
    const decisionState = extractState(decision.location);
    const matchedSites = new Set();

    // Search all REBL sites for matches based on location text
    for (const site of uniqueReblSites) {
      const siteSearchable = sitesBySearchable[site];
      const siteState = site.split('-').pop();

      // Match if location text contains words from the site_id
      // e.g., "Santa Barbara" should match site containing "santa barbara"
      const locationWords = decisionLocation.split(/[\s,()]/g).filter(w => w.length > 2);

      let matchScore = 0;
      for (const word of locationWords) {
        if (siteSearchable.includes(word)) {
          matchScore++;
        }
      }

      // If we have meaningful matches (2+ words or match state), add it
      if (matchScore >= 2 || (matchScore >= 1 && decisionState && siteState === decisionState)) {
        matchedSites.add(site);
      }
    }

    // If exactly one match, update it
    if (matchedSites.size === 1) {
      updates.push({
        id: decision.id,
        sites: Array.from(matchedSites),
        confidence: 'exact'
      });
      matched++;
    }
    // If multiple but reasonable, still update
    else if (matchedSites.size > 1 && matchedSites.size <= 3) {
      updates.push({
        id: decision.id,
        sites: Array.from(matchedSites),
        confidence: 'multi'
      });
      stateFiltered++;
    }
    // If multiple but high ambiguity, save for review
    else if (matchedSites.size > 3 && matchedSites.size <= 10) {
      ambiguousMatches.push({
        id: decision.id,
        location: decision.location,
        sites: Array.from(matchedSites).sort(),
        count: matchedSites.size
      });
      ambiguous++;
    }
  }

  const noMatch = decisions.length - matched - stateFiltered - ambiguous;

  console.log(`\nMatching Results:`);
  console.log(`- Exact matches (1 site): ${matched}`);
  console.log(`- Multi matches (2-3 sites): ${stateFiltered}`);
  console.log(`- Ambiguous (4+ sites): ${ambiguous}`);
  console.log(`- No matches: ${noMatch}`);
  console.log(`- Total updates: ${updates.length}`);

  // Show sample of no-match decisions for debugging
  if (noMatch > 0 && noMatch <= 20) {
    console.log(`\nAll ${noMatch} no-match decisions:`);
    const noMatchDecisions = decisions.filter(d => {
      const location = (d.location || '').toLowerCase();
      let foundMatch = false;
      for (const site of uniqueReblSites) {
        const siteSearchable = sitesBySearchable[site];
        const locationWords = location.split(/[\s,()]/g).filter(w => w.length > 2);
        let matchScore = 0;
        for (const word of locationWords) {
          if (siteSearchable.includes(word)) matchScore++;
        }
        if (matchScore >= 2 || matchScore >= 1) {
          foundMatch = true;
          break;
        }
      }
      return !foundMatch;
    });

    noMatchDecisions.forEach(d => {
      console.log(`  - "${d.location}"`);
    });
  }

  // Apply updates in batches
  if (updates.length > 0) {
    console.log(`\nApplying ${updates.length} updates...`);
    let batchCount = 0;

    for (let i = 0; i < updates.length; i += 50) {
      const batch = updates.slice(i, i + 50);

      for (const update of batch) {
        const { error } = await supabase
          .from('deal_forensics')
          .update({ related_rebl_sites: update.sites })
          .eq('id', update.id);

        if (error) {
          console.error(`Error updating ${update.id}:`, error);
        }
      }
      batchCount++;
      console.log(`Applied batch ${batchCount}/${Math.ceil(updates.length / 50)}`);
    }
  }

  // Save ambiguous matches to file for review
  if (ambiguousMatches.length > 0) {
    const outputPath = path.join(__dirname, 'ambiguous-rebl-matches.json');
    fs.writeFileSync(outputPath, JSON.stringify({
      count: ambiguousMatches.length,
      generated: new Date().toISOString(),
      matches: ambiguousMatches
    }, null, 2));

    console.log(`\nExported ${ambiguousMatches.length} ambiguous matches to ambiguous-rebl-matches.json`);
  }

  console.log('\nDone!');
}

matchAndUpdate().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
