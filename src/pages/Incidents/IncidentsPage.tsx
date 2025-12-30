import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { incidentsClient } from '../../api/incidentsClient';
import type { IncidentDto, IncidentPriority } from '../../Types/incidents';
import type { PagedResult } from '../../Types/paging';
import { ApiError } from '../../api/http';

const SORT_BY = ['updatedUtc', 'priority', 'status', 'title'] as const;
type SortBy = (typeof SORT_BY)[number];

const SORT_DIR = ['asc', 'desc'] as const;
type SortDir = (typeof SORT_DIR)[number];

function isSortBy(v: string): v is SortBy {
  return (SORT_BY as readonly string[]).includes(v);
}
function isSortDir(v: string): v is SortDir {
  return (SORT_DIR as readonly string[]).includes(v);
}

export const IncidentsPage: React.FC = () => {
  const qc = useQueryClient();

  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<IncidentPriority>('P3');

  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);
  const [sortBy, setSortBy] = useState<SortBy>('updatedUtc');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const incidentsKey = ['incidents', page, pageSize, sortBy, sortDir] as const;

  const list = useQuery<PagedResult<IncidentDto>, ApiError>({
    queryKey: incidentsKey,
    queryFn: () => incidentsClient.list({ page, pageSize, sortBy, sortDir }),
    placeholderData: keepPreviousData, // ✅ v5 replacement for keepPreviousData: true
    refetchOnWindowFocus: false,
  });

  const create = useMutation<IncidentDto, ApiError, { title: string; priority: IncidentPriority }>({
    mutationFn: incidentsClient.create,
    onSuccess: async () => {
      setTitle('');
      setPriority('P3');
      setPage(1);
      await qc.invalidateQueries({ queryKey: ['incidents'] }); // prefix invalidation
    },
  });

  const del = useMutation<void, ApiError, number, { prev?: PagedResult<IncidentDto> }>({
    mutationFn: (id: number) => incidentsClient.delete(id),

    onMutate: async (id: number) => {
      await qc.cancelQueries({ queryKey: incidentsKey });

      const prev = qc.getQueryData<PagedResult<IncidentDto>>(incidentsKey);

      if (prev) {
        const newTotal = Math.max(0, prev.total - 1);
        qc.setQueryData<PagedResult<IncidentDto>>(incidentsKey, {
          ...prev,
          items: prev.items.filter((x) => x.id !== id),
          total: newTotal,
          totalPages: Math.max(1, Math.ceil(newTotal / prev.pageSize)),
        });
      }

      return { prev };
    },

    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(incidentsKey, ctx.prev);
    },

    onSettled: async () => {
      await qc.invalidateQueries({ queryKey: ['incidents'] });
    },
  });

  return (
    <div style={{ padding: '1.5rem' }}>
      <h1>Incidents</h1>

      <div style={{ border: '1px solid #ddd', padding: 12, maxWidth: 520 }}>
        <h3>Create Incident</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
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
          <button onClick={() => create.mutate({ title, priority })} disabled={create.isPending || !title.trim()}>
            {create.isPending ? 'Saving…' : 'Create'}
          </button>
        </div>

        {create.isError && (
          <div style={{ color: 'red' }}>
            <p>{create.error.message}</p>
            {create.error.problem?.errors?.Title?.length ? (
              <ul>
                {create.error.problem.errors.Title.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            ) : null}
          </div>
        )}
      </div>

      <hr style={{ margin: '16px 0' }} />

      {list.isLoading && <p>Loading…</p>}
      {list.isError && <p style={{ color: 'red' }}>Error: {list.error.message}</p>}

      {list.data && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '12px 0' }}>
          <label>
            Sort By:&nbsp;
            <select
              value={sortBy}
              onChange={(e) => {
                const v = e.target.value;
                if (isSortBy(v)) setSortBy(v);
              }}
            >
              <option value="updatedUtc">Updated</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
              <option value="title">Title</option>
            </select>
          </label>

          <label>
            Direction:&nbsp;
            <select
              value={sortDir}
              onChange={(e) => {
                const v = e.target.value;
                if (isSortDir(v)) setSortDir(v);
              }}
            >
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </label>

          <span style={{ marginLeft: 'auto' }}>
            Total: {list.data.total} | Page {list.data.page} / {list.data.totalPages}
          </span>

          <button disabled={page <= 1 || list.isFetching} onClick={() => setPage((p) => p - 1)}>
            Prev
          </button>
          <button
            disabled={page >= list.data.totalPages || list.isFetching}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}

      {list.data && (
        <table style={{ borderCollapse: 'collapse', marginTop: 8 }}>
          <thead>
            <tr>
              <th style={th}>ID</th>
              <th style={th}>Title</th>
              <th style={th}>Status</th>
              <th style={th}>Priority</th>
              <th style={th}>Updated (UTC)</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.data.items.map((x) => (
              <tr key={x.id}>
                <td style={td}>{x.id}</td>
                <td style={td}>
                  <Link to={`/incidents/${x.id}`}>{x.title}</Link>
                </td>
                <td style={td}>{x.status}</td>
                <td style={td}>{x.priority}</td>
                <td style={td}>{new Date(x.updatedUtc).toISOString()}</td>
                <td style={td}>
                  <button
                    onClick={() => {
                      if (window.confirm('Delete this incident?')) del.mutate(x.id);
                    }}
                    disabled={del.isPending}
                  >
                    {del.isPending ? 'Deleting…' : 'Delete'}
                  </button>
                </td>
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
