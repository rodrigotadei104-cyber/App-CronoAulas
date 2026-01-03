import React from 'react';

import ReactDOM from 'react-dom/client';
import App from './App';
import { ScheduleProvider } from './context/ScheduleContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ScheduleProvider>
      <App />
    </ScheduleProvider>
  </React.StrictMode>
);

// --- AGGRESSIVE SERVICE WORKER UNREGISTRATION ---
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function (registrations) {
    for (let registration of registrations) {
      console.log('Unregistering found service worker:', registration);
      registration.unregister();
    }
  });

  // Force reload if controller changes (meaning SW was removed)
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('Controller changed, reloading page...');
    window.location.reload();
  });
}