import type { IncidentDto, CreateIncidentRequest, UpdateIncidentRequest  } from '../Types/incidents';
import { http } from './http';
//const API_BASE = "http://localhost:5084"; // or https://localhost:7169 if that's your API

export const incidentsClient = {
   list: () => http<IncidentDto[]>('/api/incidents'),
  getById: (id: number) => http<IncidentDto>(`/api/incidents/${id}`),
  create: (req: CreateIncidentRequest) =>
    http<IncidentDto>('/api/incidents', { method: 'POST', body: JSON.stringify(req) }),

  update: (id: number, req: UpdateIncidentRequest) =>
    http<IncidentDto>(`/api/incidents/${id}`, { method: 'PUT', body: JSON.stringify(req) }),
  
  delete: (id: number) =>
  http<void>(`/api/incidents/${id}`, { method: 'DELETE' }),

};
