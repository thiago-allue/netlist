// src/api/client.js

// Centralised Axios instance so base URL / auth headers are configured once.
// This file is used to create an Axios instance with a base URL and other configurations.

import axios from 'axios';

// The API URL defaults to localhost for local dev; override via .env
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',

  // JWT will be sent in headers rather than cookies.
  withCredentials: false,
});

export default api;
