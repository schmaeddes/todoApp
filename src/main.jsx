import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BrowserRouter,
  HashRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';
import App from './App.jsx';
import './index.css';

const isElectron = Boolean(window.electronAPI);
const Router = isElectron ? HashRouter : BrowserRouter;

if (isElectron && (!window.location.hash || window.location.hash === '#')) {
  window.location.hash = '#/inbox';
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/inbox" replace />} />
        <Route path="/projects" element={<App />} />
        <Route path="/projects/:projectSlug" element={<App />} />
        <Route path="/:view" element={<App />} />
        <Route path="*" element={<Navigate to="/inbox" replace />} />
      </Routes>
    </Router>
  </StrictMode>,
);
