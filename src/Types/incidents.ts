export type IncidentStatus = 'Open' | 'InProgress' | 'Closed';
export type IncidentPriority = 'P1' | 'P2' | 'P3';

export type IncidentDto = {
  id: number;
  title: string;
  status: IncidentStatus;
  priority: IncidentPriority;
  updatedUtc: string;
};

export type CreateIncidentRequest = {
  title: string;
  priority: IncidentPriority;
};
