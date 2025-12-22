// ...existing code...
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { StatusPage } from './pages/StatusPage';
import { IncidentsPage } from './pages/Incidents/IncidentsPage.tsx';
import { IncidentDetailsPage } from './pages/Incidents/IncidentDetailsPage.tsx';

export default function App() {
  return (
    <div style={{ fontFamily: 'system-ui' }}>
      <div style={{ padding: '12px', borderBottom: '1px solid #ddd', display: 'flex', gap: '12px' }}>
        <Link to="/status">Status</Link>
        <Link to="/incidents">Incidents</Link>
      </div>

      <Routes>
        <Route path="/" element={<Navigate to="/status" replace />} />
        <Route path="/status" element={<StatusPage />} />
        <Route path="/incidents" element={<IncidentsPage />} />
        <Route path="/incidents/:id" element={<IncidentDetailsPage />} />
      </Routes>
    </div>
  );
}
