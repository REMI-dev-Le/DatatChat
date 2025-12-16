const API_BASE = 'http://localhost:5084';

export type StatusResponse = {
  serviceName: string;
  version: string;
  serverTimeUtc: string;
};

export async function fetchStatus(): Promise<StatusResponse> {
  const res = await fetch(`${API_BASE}/api/status`);
  if (!res.ok) {
    throw new Error(`Status request failed: ${res.status}`);
  }
  return res.json();
}
