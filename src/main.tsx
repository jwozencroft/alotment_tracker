import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Automatically register and update service worker for offline allotment access
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log("New Allotment Tracker update available.");
  },
  onOfflineReady() {
    console.log("Allotment Tracker is ready for offline operation.");
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
