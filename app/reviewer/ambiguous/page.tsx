'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, ChevronRight, Save, Check } from 'lucide-react';

interface AmbiguousMatch {
  id: string;
  location: string;
  sites: string[];
  count: number;
}

export default function AmbiguousReviewPage() {
  const [matches, setMatches] = useState<AmbiguousMatch[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSites, setSelectedSites] = useState<Set<string>>(new Set());
  const [resolved, setResolved] = useState(0);

  useEffect(() => {
    loadMatches();
  }, []);

  async function loadMatches() {
    try {
      setLoading(true);
      // Load the ambiguous matches JSON file
      const response = await fetch('/ambiguous-rebl-matches.json');
      const data = await response.json();
      setMatches(data.matches || []);
    } catch (err) {
      setError('Could not load ambiguous matches. Run the match script first.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const current = matches[currentIndex];

  async function saveSelection() {
    if (!current || selectedSites.size === 0) return;

    try {
      setSaving(true);
      const { error: updateError } = await supabase
        .from('deal_forensics')
        .update({
          related_rebl_sites: Array.from(selectedSites),
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', current.id);

      if (updateError) throw updateError;

      setResolved(r => r + 1);
      nextMatch();
    } catch (err) {
      setError('Failed to save selection');
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  function toggleSite(site: string) {
    const updated = new Set(selectedSites);
    if (updated.has(site)) {
      updated.delete(site);
    } else {
      updated.add(site);
    }
    setSelectedSites(updated);
  }

  function nextMatch() {
    setCurrentIndex(i => (i + 1) % matches.length);
    setSelectedSites(new Set());
  }

  function prevMatch() {
    setCurrentIndex(i => (i - 1 + matches.length) % matches.length);
    setSelectedSites(new Set());
  }

  if (loading) {
    return <div className="p-8">Loading ambiguous matches...</div>;
  }

  if (matches.length === 0) {
    return (
      <div className="p-8">
        <p className="text-gray-600">No ambiguous matches found. Run the auto-tracking script first.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Resolve Ambiguous REBL Matches</h1>
        <p className="text-gray-600">
          {currentIndex + 1} / {matches.length} | {resolved} resolved
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {current && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Decision Location</h2>
            <p className="text-lg text-gray-700">{current.location}</p>
            <p className="text-sm text-gray-500 mt-2">Decision ID: {current.id}</p>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Possible REBL Sites ({current.sites.length})
            </h3>
            <div className="space-y-2">
              {current.sites.map(site => (
                <label
                  key={site}
                  className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedSites.has(site)}
                    onChange={() => toggleSite(site)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="ml-3 text-sm font-mono text-gray-700">
                    {site.replace(/-/g, ' ')}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <button
              onClick={saveSelection}
              disabled={selectedSites.size === 0 || saving}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Check size={18} />
              {saving ? 'Saving...' : 'Save & Next'}
            </button>
            <button
              onClick={nextMatch}
              className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Skip
            </button>
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={prevMatch}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft size={18} />
              Previous
            </button>
            <span className="text-sm text-gray-600">
              {currentIndex + 1} of {matches.length}
            </span>
            <button
              onClick={nextMatch}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Next
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
