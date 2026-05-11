'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { DecisionRecord } from '@/lib/supabase';
import { ChevronDown, Plus, Save, AlertCircle } from 'lucide-react';

interface MetaDecisionGroup {
  meta_decision_id: string | null;
  meta_decision_description: string;
  decisions: DecisionRecord[];
}

export default function OrganizerPage() {
  const [groups, setGroups] = useState<MetaDecisionGroup[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newMetaName, setNewMetaName] = useState('');
  const [draggedItem, setDraggedItem] = useState<{ sourceGroup: string; decisionId: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('deal_forensics')
        .select('*')
        .order('date_first_asked', { ascending: true })
        .limit(2000);

      if (fetchError) throw fetchError;

      // Group by meta_decision_id
      const groupMap = new Map<string, DecisionRecord[]>();
      const metaMap = new Map<string, string>();

      (data as DecisionRecord[]).forEach((record) => {
        const key = record.meta_decision_id || `ungrouped-${record.id}`;
        if (!groupMap.has(key)) {
          groupMap.set(key, []);
        }
        groupMap.get(key)!.push(record);

        if (record.meta_decision_id && record.meta_decision_description) {
          metaMap.set(record.meta_decision_id, record.meta_decision_description);
        }
      });

      // Convert to array format
      const groupsArray: MetaDecisionGroup[] = Array.from(groupMap.entries()).map(([key, decisions]) => ({
        meta_decision_id: decisions[0].meta_decision_id || null,
        meta_decision_description: metaMap.get(decisions[0].meta_decision_id || '') || 'Ungrouped Decisions',
        decisions: decisions.sort((a, b) => new Date(a.date_first_asked).getTime() - new Date(b.date_first_asked).getTime()),
      }));

      // Sort groups by size (largest first)
      groupsArray.sort((a, b) => b.decisions.length - a.decisions.length);

      setGroups(groupsArray);
      setExpandedGroups(new Set([groupsArray[0]?.meta_decision_id || 'ungrouped']));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load data';
      setError(message);
      console.error('Error loading organizer data:', err);
    } finally {
      setLoading(false);
    }
  }

  function toggleGroup(groupId: string) {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  }

  async function createNewMetaDecision() {
    if (!newMetaName.trim()) return;

    const newId = `meta-${Date.now()}-new`;
    setGroups([
      {
        meta_decision_id: newId,
        meta_decision_description: newMetaName,
        decisions: [],
      },
      ...groups,
    ]);
    setNewMetaName('');
    setExpandedGroups(new Set([newId, ...expandedGroups]));
  }

  function handleDragStart(e: React.DragEvent, sourceGroupId: string, decisionId: string) {
    setDraggedItem({ sourceGroup: sourceGroupId, decisionId });
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function handleDrop(e: React.DragEvent, targetGroupId: string) {
    e.preventDefault();
    if (!draggedItem || draggedItem.sourceGroup === targetGroupId) return;

    const updatedGroups = groups.map((group) => {
      if (group.meta_decision_id === draggedItem.sourceGroup) {
        return {
          ...group,
          decisions: group.decisions.filter((d) => d.id !== draggedItem.decisionId),
        };
      }
      if (group.meta_decision_id === targetGroupId) {
        const movedDecision = groups
          .find((g) => g.meta_decision_id === draggedItem.sourceGroup)
          ?.decisions.find((d) => d.id === draggedItem.decisionId);
        if (movedDecision) {
          return {
            ...group,
            decisions: [...group.decisions, movedDecision],
          };
        }
      }
      return group;
    });

    setGroups(updatedGroups);
    setDraggedItem(null);
  }

  async function saveChanges() {
    try {
      setSaving(true);
      setError(null);

      for (const group of groups) {
        const metaId = group.meta_decision_id;
        if (!metaId) continue; // Skip ungrouped

        // Update all decisions in this group
        const promises = group.decisions.map((decision, index) =>
          supabase
            .from('deal_forensics')
            .update({
              meta_decision_id: metaId,
              decision_sequence_num: index + 1,
            })
            .eq('id', decision.id)
        );

        const results = await Promise.all(promises);
        const errors = results.filter((r) => r.error);
        if (errors.length > 0) {
          throw new Error(`Failed to update ${errors.length} decisions`);
        }
      }

      setError(null);
      alert('Changes saved successfully!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save changes';
      setError(message);
      console.error('Error saving changes:', err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <p className="text-gray-600">Loading organizer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Decision Chain Organizer</h1>
        <p className="text-gray-600">Organize decisions into meta-decision groups. Drag decisions between groups to reorganize.</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Error</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Create new meta-decision */}
      <div className="mb-8 bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Meta-Decision</h2>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="e.g., Denver Market Entry, Seattle Lease Negotiation"
            value={newMetaName}
            onChange={(e) => setNewMetaName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && createNewMetaDecision()}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={createNewMetaDecision}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Group
          </button>
        </div>
      </div>

      {/* Meta-decision groups */}
      <div className="space-y-4 mb-8">
        {groups.map((group) => {
          const groupId = group.meta_decision_id || 'ungrouped';
          const isExpanded = expandedGroups.has(groupId);

          return (
            <div key={groupId} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              {/* Header */}
              <button
                onClick={() => toggleGroup(groupId)}
                className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1 text-left">
                  <ChevronDown
                    className={`w-5 h-5 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{group.meta_decision_description}</h3>
                    <p className="text-sm text-gray-600">{group.decisions.length} decisions</p>
                  </div>
                </div>
              </button>

              {/* Decisions list */}
              {isExpanded && (
                <div
                  className="border-t border-gray-200 p-6 space-y-3 bg-gray-50"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, groupId)}
                >
                  {group.decisions.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No decisions in this group. Drag decisions here.</p>
                  ) : (
                    group.decisions.map((decision) => (
                      <div
                        key={decision.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, groupId, decision.id)}
                        className="bg-white p-4 rounded border border-gray-300 cursor-move hover:shadow-md hover:border-blue-400 transition-all"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{decision.title || 'Untitled'}</p>
                            <p className="text-sm text-gray-600">{decision.type}</p>
                            <div className="flex gap-4 mt-2 text-xs text-gray-500">
                              <span>{decision.location}</span>
                              <span>{decision.date_first_asked}</span>
                            </div>
                          </div>
                          {decision.status && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium whitespace-nowrap">
                              {decision.status}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Save button */}
      <div className="sticky bottom-8 flex gap-3">
        <button
          onClick={saveChanges}
          disabled={saving}
          className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          onClick={() => window.location.reload()}
          className="bg-gray-600 text-white px-8 py-3 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
