import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/inbox" replace />} />
        <Route path="/projects" element={<App />} />
        <Route path="/projects/:projectSlug" element={<App />} />
        <Route path="/:view" element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
