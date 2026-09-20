export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
export const WS_BASE = import.meta.env.VITE_WS_BASE_URL || (
  API_BASE.startsWith('https://')
    ? API_BASE.replace('https://', 'wss://')
    : API_BASE.replace('http://', 'ws://')
);
