import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { incidentsClient } from '../../api/incidentsClient';
import type { IncidentPriority, IncidentStatus } from '../../Types/incidents';
import { ApiError } from '../../api/http';

type Draft = {
  title: string;
  status: IncidentStatus;
  priority: IncidentPriority;
};

export const IncidentDetailsPage: React.FC = () => {
  const { id } = useParams();

  const parsedId = Number(id);
  const validId = Number.isFinite(parsedId) && parsedId > 0;

  // IMPORTANT: keep hooks stable → always have a numeric id
  const incidentId = validId ? parsedId : 0;

  const qc = useQueryClient();
  const nav = useNavigate();

  // ✅ Hook always called (not conditional)
  const q = useQuery({
    queryKey: ['incident', incidentId],
    queryFn: () => incidentsClient.getById(incidentId),
    enabled: validId, // ✅ prevents calling API for invalid ids
    refetchOnWindowFocus: false,
  });

  // ✅ Hook always called (not conditional)
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});

  const base: Draft | null = q.data
    ? { title: q.data.title, status: q.data.status, priority: q.data.priority }
    : null;

  const current: Draft | null = base ? (drafts[incidentId] ?? base) : null;

  function updateDraft(patch: Partial<Draft>) {
    if (!base) return;

    setDrafts((prev) => ({
      ...prev,
      [incidentId]: { ...(prev[incidentId] ?? base), ...patch },
    }));
  }

  // ✅ Hook always called (not conditional)
  const update = useMutation({
    mutationFn: () => {
      if (!validId) throw new Error('Invalid incident id');
      if (!current) throw new Error('Incident not loaded');
      return incidentsClient.update(incidentId, current);
    },
    onSuccess: async () => {
      // ✅ No unused vars; clear draft safely
      setDrafts((prev) => {
        const copy = { ...prev };
        delete copy[incidentId];
        return copy;
      });

      await qc.invalidateQueries({ queryKey: ['incidents'] });
      await qc.invalidateQueries({ queryKey: ['incident', incidentId] });
    },
  });

  const del = useMutation({
  mutationFn: () => incidentsClient.delete(incidentId),
  onSuccess: async () => {
    await qc.invalidateQueries({ queryKey: ['incidents'] });
    nav('/incidents');
  },
});

  // ✅ Early returns happen AFTER hooks (allowed)
  if (!validId) return <div style={{ padding: 16, color: 'red' }}>Invalid incident id.</div>;
  if (q.isLoading) return <div style={{ padding: 16 }}>Loading…</div>;
  if (q.isError) return <div style={{ padding: 16, color: 'red' }}>Error: {(q.error as Error).message}</div>;
  if (!q.data || !current) return <div style={{ padding: 16 }}>Not found.</div>;

  const err = update.error as ApiError | undefined;
  const titleErrors = err?.problem?.errors?.Title;

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 12 }}>
        <Link to="/incidents">← Back to Incidents</Link>
      </div>

      <h2>Incident #{q.data.id}</h2>

      <div style={{ border: '1px solid #ddd', padding: 12, maxWidth: 520 }}>
        <div style={{ display: 'grid', gap: 8 }}>
          <label>
            Title
            <input
              value={current.title}
              onChange={(e) => updateDraft({ title: e.target.value })}
              style={{ width: '100%' }}
            />
          </label>

          <label>
            Status
            <select
              value={current.status}
              onChange={(e) => updateDraft({ status: e.target.value as IncidentStatus })}
            >
              <option value="Open">Open</option>
              <option value="InProgress">InProgress</option>
              <option value="Closed">Closed</option>
            </select>
          </label>

          <label>
            Priority
            <select
              value={current.priority}
              onChange={(e) => updateDraft({ priority: e.target.value as IncidentPriority })}
            >
              <option value="P1">P1</option>
              <option value="P2">P2</option>
              <option value="P3">P3</option>
            </select>
          </label>

          <button onClick={() => update.mutate()} disabled={update.isPending || !current.title.trim()}>
            {update.isPending ? 'Saving…' : 'Save'}
          </button>
          <button onClick={() => {if (window.confirm('Delete this incident?')) del.mutate();}}
            disabled={del.isPending}>
            {del.isPending ? 'Deleting…' : 'Delete'}
          </button>

          {update.isSuccess && <p style={{ color: 'green' }}>Saved!</p>}

          {update.isError && (
            <div style={{ color: 'red' }}>
              <p>{err?.message ?? 'Update failed'}</p>
              {titleErrors?.length ? (
                <ul>
                  {titleErrors.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <p style={{ marginTop: 12, color: '#666' }}>
        Updated (UTC): {new Date(q.data.updatedUtc).toISOString()}
      </p>
    </div>
  );
};
