import type { IncidentDto, CreateIncidentRequest } from '../Types/incidents';
import { http } from './http';
//const API_BASE = "http://localhost:5084"; // or https://localhost:7169 if that's your API

export const incidentsClient = {
   list: () => http<IncidentDto[]>('/api/incidents'),
  create: (req: CreateIncidentRequest) =>
    http<IncidentDto>('/api/incidents', { method: 'POST', body: JSON.stringify(req) }),
};
