export type ProblemDetails = {
  title?: string;
  detail?: string;
  status?: number;
  errors?: Record<string, string[]>;
};

export class ApiError extends Error {
  status?: number;
  problem?: ProblemDetails;

  constructor(message: string, status?: number, problem?: ProblemDetails) {
    super(message);
    this.status = status;
    this.problem = problem;
  }
}


const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

export async function http<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
    ...options,
  });

  if (!res.ok) {
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/problem+json')) {
      const problem = (await res.json()) as ProblemDetails;
      throw new ApiError(problem.title || 'Request failed', res.status, problem);
    }

    const text = await res.text();
    throw new ApiError(text || `Request failed: ${res.status}`, res.status);
  }

  return res.json() as Promise<T>;
}
