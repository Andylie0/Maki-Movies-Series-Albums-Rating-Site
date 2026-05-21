export const BASE_URL = import.meta.env. || 'https://localhost:8000';
VITE_API_URL
export const WB_URL = `${BASE_URL.replace(/^http/, 'ws')}`