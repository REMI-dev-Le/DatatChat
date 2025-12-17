import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { incidentsClient } from '../../api/incidentsClient.ts';
import type { IncidentPriority } from '../../Types/incidents.ts';

export const IncidentsPage: React.FC = () => {
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<IncidentPriority>('P3');

  const list = useQuery({
    queryKey: ['incidents'],
    queryFn: incidentsClient.list,
    refetchOnWindowFocus: false,
  });

  const create = useMutation({
    mutationFn: incidentsClient.create,
    onSuccess: async () => {
      setTitle('');
      setPriority('P3');
      await qc.invalidateQueries({ queryKey: ['incidents'] });
    },
  });

  return (
    <div style={{ padding: '1.5rem' }}>
      <h1>Incidents</h1>

      <div style={{ border: '1px solid #ddd', padding: '12px', maxWidth: 520 }}>
        <h3>Create Incident</h3>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            style={{ flex: 1 }}
          />
          <select value={priority} onChange={(e) => setPriority(e.target.value as IncidentPriority)}>
            <option value="P1">P1</option>
            <option value="P2">P2</option>
            <option value="P3">P3</option>
          </select>
          <button
            onClick={() => create.mutate({ title, priority })}
            disabled={create.isPending || !title.trim()}
          >
            {create.isPending ? 'Saving…' : 'Create'}
          </button>
        </div>
        {create.isError && <p style={{ color: 'red' }}>Error: {(create.error as Error).message}</p>}
      </div>

      <hr style={{ margin: '16px 0' }} />

      {list.isLoading && <p>Loading…</p>}
      {list.isError && <p style={{ color: 'red' }}>Error: {(list.error as Error).message}</p>}

      {list.data && (
        <table style={{ borderCollapse: 'collapse', marginTop: 8 }}>
          <thead>
            <tr>
              <th style={th}>ID</th>
              <th style={th}>Title</th>
              <th style={th}>Status</th>
              <th style={th}>Priority</th>
              <th style={th}>Updated (UTC)</th>
            </tr>
          </thead>
          <tbody>
            {list.data.map((x) => (
              <tr key={x.id}>
                <td style={td}>{x.id}</td>
                <td style={td}>{x.title}</td>
                <td style={td}>{x.status}</td>
                <td style={td}>{x.priority}</td>
                <td style={td}>{new Date(x.updatedUtc).toISOString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

const th: React.CSSProperties = { border: '1px solid #ccc', padding: '6px 10px' };
const td: React.CSSProperties = { border: '1px solid #ccc', padding: '6px 10px' };
