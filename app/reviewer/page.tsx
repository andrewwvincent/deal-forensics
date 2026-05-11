'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { DecisionRecord } from '@/lib/supabase';
import { ChevronLeft, ChevronRight, Save, AlertCircle } from 'lucide-react';

const DEPARTMENTS = ['Ops', 'Finance', 'Legal', 'Marketing', 'RE'];
const OUTCOMES = ['approval', 'rejection', 'escalation', 'policy-change', 'information-gathering', 'pending'];

interface ReblSite {
  site_id: string;
  status: string;
}

export default function ReviewerPage() {
  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
  const [allDecisions, setAllDecisions] = useState<DecisionRecord[]>([]);
  const [reblSites, setReblSites] = useState<ReblSite[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterLocation, setFilterLocation] = useState('');
  const [showUnreviewedOnly, setShowUnreviewedOnly] = useState(true);

  // Local state for current decision annotation
  const [selectedDepts, setSelectedDepts] = useState<Set<string>>(new Set());
  const [selectedOutcome, setSelectedOutcome] = useState('');
  const [userNotes, setUserNotes] = useState('');
  const [selectedReblSites, setSelectedReblSites] = useState<Set<string>>(new Set());
  const [newReblSiteInput, setNewReblSiteInput] = useState('');

  useEffect(() => {
    loadData();
  }, [filterLocation, showUnreviewedOnly]);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      // Fetch decisions
      let query = supabase
        .from('deal_forensics')
        .select('*')
        .order('date_first_asked', { ascending: false })
        .range(0, 2000);

      if (filterLocation) {
        query = query.ilike('location', `%${filterLocation}%`);
      }

      const { data: decisionsData, error: decisionsError } = await query;
      if (decisionsError) throw decisionsError;

      const allDecs = decisionsData as DecisionRecord[];
      setAllDecisions(allDecs);

      // Apply reviewed filter
      const filtered = showUnreviewedOnly
        ? allDecs.filter((d) => !d.reviewed_at)
        : allDecs;

      setDecisions(filtered);
      setCurrentIndex(0);

      // Fetch REBL sites
      const { data: reblData, error: reblError } = await supabase
        .from('rebl3_status')
        .select('site_id, status')
        .range(0, 500);

      if (reblError) {
        console.warn('Could not fetch REBL sites:', reblError);
      } else {
        setReblSites((reblData || []) as ReblSite[]);
      }

      // Load current decision's annotations
      if (decisionsData && decisionsData.length > 0) {
        loadDecisionAnnotations(decisionsData[0] as DecisionRecord);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load data';
      setError(message);
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }

  function loadDecisionAnnotations(decision: DecisionRecord) {
    setSelectedDepts(new Set(decision.departments || []));
    setSelectedOutcome(decision.outcome || '');
    setUserNotes(decision.user_notes || '');
    setSelectedReblSites(new Set(decision.related_rebl_sites || []));
  }

  async function saveDecision() {
    if (decisions.length === 0) return;

    try {
      setSaving(true);
      const current = decisions[currentIndex];

      const { error, data } = await supabase
        .from('deal_forensics')
        .update({
          departments: Array.from(selectedDepts),
          outcome: selectedOutcome || null,
          user_notes: userNotes || null,
          related_rebl_sites: Array.from(selectedReblSites),
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', current.id)
        .select();

      if (error) {
        console.error('Update error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('Update did not affect any rows. Check RLS policy.');
      }

      // Mark this decision as saved and move to next
      const updated = [...decisions];
      updated[currentIndex] = {
        ...current,
        departments: Array.from(selectedDepts),
        outcome: selectedOutcome || '',
        user_notes: userNotes,
        related_rebl_sites: Array.from(selectedReblSites),
        reviewed_at: new Date().toISOString(),
      };
      setDecisions(updated);

      // Move to next
      if (currentIndex < decisions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        loadDecisionAnnotations(updated[currentIndex + 1]);
      } else {
        const reviewedCount = allDecisions.filter((d) => d.reviewed_at).length;
        const unreviewed = allDecisions.filter((d) => !d.reviewed_at).length;
        alert(`Finished! ${reviewedCount} reviewed, ${unreviewed} remaining.`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save';
      setError(message);
      console.error('Error saving:', err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <p className="text-gray-600">Loading decisions...</p>
      </div>
    );
  }

  if (decisions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <p className="text-gray-600">No decisions found</p>
      </div>
    );
  }

  const current = decisions[currentIndex];
  const progress = ((currentIndex + 1) / decisions.length) * 100;
  const reviewedCount = allDecisions.filter((d) => d.reviewed_at).length;
  const totalCount = allDecisions.length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Decision Reviewer</h1>
      <p className="text-gray-600 mb-8">Annotate decisions with departments, outcomes, and REBL sites</p>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Error</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Filter and Toggle */}
      <div className="mb-6 space-y-3">
        <input
          type="text"
          placeholder="Filter by location (leave empty for all)..."
          value={filterLocation}
          onChange={(e) => setFilterLocation(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showUnreviewedOnly}
            onChange={(e) => setShowUnreviewedOnly(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-gray-700">Show unreviewed only</span>
        </label>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>
            {reviewedCount} reviewed of {totalCount} total
            {showUnreviewedOnly && decisions.length > 0 && ` (${decisions.length} unreviewed left)`}
          </span>
          <span>{Math.round(progress)}% of current view</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      {/* Decision card */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 mb-8">
        {/* Header info */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-gray-500">ID: {current.id}</p>
              <h2 className="text-2xl font-bold text-gray-900 mt-2">{current.title || 'Untitled'}</h2>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">{current.date_first_asked}</p>
              <p className="text-sm text-gray-600">{current.type}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Location</p>
              <p className="font-medium text-gray-900">{current.location || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500">Owner</p>
              <p className="font-medium text-gray-900">{current.decision_owner || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500">Status</p>
              <p className="font-medium text-gray-900">{current.status || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500">Meta-Decision</p>
              <p className="font-medium text-gray-900 text-xs">{current.meta_decision_id || 'None'}</p>
            </div>
          </div>

          {current.notes && (
            <div className="mt-4 p-4 bg-blue-50 rounded border border-blue-200">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Call Notes:</span> {current.notes}
              </p>
            </div>
          )}
        </div>

        {/* Annotation form */}
        <div className="space-y-6">
          {/* Departments */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">Departments Involved</label>
            <div className="flex flex-wrap gap-2">
              {DEPARTMENTS.map((dept) => (
                <button
                  key={dept}
                  onClick={() => {
                    const updated = new Set(selectedDepts);
                    if (updated.has(dept)) {
                      updated.delete(dept);
                    } else {
                      updated.add(dept);
                    }
                    setSelectedDepts(updated);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedDepts.has(dept)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          {/* Outcome */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">Outcome</label>
            <div className="grid grid-cols-2 gap-2">
              {OUTCOMES.map((outcome) => (
                <button
                  key={outcome}
                  onClick={() => setSelectedOutcome(selectedOutcome === outcome ? '' : outcome)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors text-left ${
                    selectedOutcome === outcome
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {outcome}
                </button>
              ))}
            </div>
          </div>

          {/* REBL Sites */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">Related REBL Sites</label>

            {/* Add new site ID */}
            <div className="mb-4 flex gap-2">
              <input
                type="text"
                placeholder="Type site_id (e.g., 1201-spyglass-dr-austin-tx)"
                value={newReblSiteInput}
                onChange={(e) => setNewReblSiteInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newReblSiteInput.trim()) {
                    const updated = new Set(selectedReblSites);
                    updated.add(newReblSiteInput.trim());
                    setSelectedReblSites(updated);
                    setNewReblSiteInput('');
                  }
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                onClick={() => {
                  if (newReblSiteInput.trim()) {
                    const updated = new Set(selectedReblSites);
                    updated.add(newReblSiteInput.trim());
                    setSelectedReblSites(updated);
                    setNewReblSiteInput('');
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Add
              </button>
            </div>

            {/* Selected sites */}
            {selectedReblSites.size > 0 && (
              <div className="mb-4 space-y-2">
                <p className="text-xs font-semibold text-gray-600 uppercase">Selected Sites:</p>
                <div className="flex flex-wrap gap-2">
                  {Array.from(selectedReblSites).map((siteId) => (
                    <div key={siteId} className="inline-flex items-center gap-2 bg-blue-100 text-blue-900 px-3 py-1 rounded-full text-sm">
                      <span>{siteId}</span>
                      <button
                        onClick={() => {
                          const updated = new Set(selectedReblSites);
                          updated.delete(siteId);
                          setSelectedReblSites(updated);
                        }}
                        className="text-blue-600 hover:text-blue-900 font-bold"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Browse from list */}
            <div className="space-y-2 max-h-48 overflow-y-auto border-t border-gray-200 pt-4">
              <p className="text-xs font-semibold text-gray-600 uppercase">Browse REBL Sites:</p>
              {reblSites.length === 0 ? (
                <p className="text-sm text-gray-500">No REBL sites available</p>
              ) : (
                reblSites.map((site) => (
                  <label key={site.site_id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                    <input
                      type="checkbox"
                      checked={selectedReblSites.has(site.site_id)}
                      onChange={(e) => {
                        const updated = new Set(selectedReblSites);
                        if (e.target.checked) {
                          updated.add(site.site_id);
                        } else {
                          updated.delete(site.site_id);
                        }
                        setSelectedReblSites(updated);
                      }}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{site.site_id}</p>
                      <p className="text-xs text-gray-500">{site.status}</p>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* User Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">Your Notes</label>
            <textarea
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              placeholder="Add clarifications, cross-references, or grouping notes..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex gap-4 justify-between items-center pt-6 border-t border-gray-200">
          <button
            onClick={() => {
              if (currentIndex > 0) {
                setCurrentIndex(currentIndex - 1);
                loadDecisionAnnotations(decisions[currentIndex - 1]);
              }
            }}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <button
            onClick={saveDecision}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save & Next'}
          </button>

          <button
            onClick={() => {
              if (currentIndex < decisions.length - 1) {
                setCurrentIndex(currentIndex + 1);
                loadDecisionAnnotations(decisions[currentIndex + 1]);
              }
            }}
            disabled={currentIndex === decisions.length - 1}
            className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
