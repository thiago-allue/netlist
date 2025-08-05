// src/main.jsx
//
// Entry point that mounts the React app and provides global providers.
//

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import 'antd/dist/reset.css'; // Ant Design v5 CSS reset

// Initialise React Query client

const qc = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>

    {/* Provide router + react-query context to the whole app */}
    <BrowserRouter>
      <QueryClientProvider client={qc}>
        <App />
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
