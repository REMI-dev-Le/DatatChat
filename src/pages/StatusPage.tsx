import React, { useEffect, useState, useRef, useCallback } from 'react';
import { fetchStatus } from '../api/statusClient';
import type { StatusResponse } from '../api/statusClient';

export const StatusPage: React.FC = () => {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}


   const handleCheckStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchStatus();
      setStatus(data);
      setLastChecked(new Date().toLocaleString());
    } catch (e: unknown) {
      setError(getErrorMessage(e) || 'Unknown error');
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

useEffect(() => {
    // clear on disable
    if (!autoRefresh) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // start immediate check and interval
    handleCheckStatus();
    intervalRef.current = window.setInterval(() => {
      handleCheckStatus();
    }, 30_000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoRefresh, handleCheckStatus]);

  return (
    <div style={{ padding: '1.5rem', fontFamily: 'system-ui' }}>
      <h1>DataChat Workbench – API Status</h1>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button onClick={handleCheckStatus} disabled={loading}>
          {loading ? 'Checking…' : 'Check API Status'}
        </button>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
          />
          Auto-refresh every 30s
        </label>
      </div>

      {error && (
        <p style={{ color: 'red', marginTop: '1rem' }}>
          Error: {error}
        </p>
      )}
      {status && (
        <div style={{ marginTop: '1rem' }}>
          <h2>Current Status</h2>
          <ul>
            <li><strong>Service:</strong> {status.serviceName}</li>
            <li><strong>Version:</strong> {status.version}</li>
            <li><strong>Server Time (UTC):</strong> {status.serverTimeUtc}</li>
            <li><strong>Last Checked at(Local Time):</strong> {lastChecked ?? '—'}</li>
          </ul>
        </div>
      )}
    </div>
  );
};
