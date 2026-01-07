import { http } from './http';

export type IngestRequest = {
  fileName: string;
  contentType?: string;
  source?: string;
  text: string;
};

export type IngestResponse = {
  documentId: string;
  fileName: string;
  source?: string;
  originalLength: number;
  chunkCount: number;
  tenantId: string;
};

export const documentsClient = {
  ingest: (req: IngestRequest) =>
    http<IngestResponse>('/api/documents/ingest', { method: 'POST', body: JSON.stringify(req) }),

  list: () =>
    http<Array<{ id: string; fileName: string; source?: string; originalLength: number; createdUtc: string }>>(
      '/api/documents'
    ),
};
