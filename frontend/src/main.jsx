// ─────────────────────────────────────────────
// main.jsx — Application entry point only
// Mounts React root. No logic here.
// ─────────────────────────────────────────────

import { StrictMode }  from 'react';
import { createRoot }  from 'react-dom/client';
import './index.css';
import App             from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
