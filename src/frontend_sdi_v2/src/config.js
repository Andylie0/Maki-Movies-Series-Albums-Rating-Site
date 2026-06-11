export const BASE_URL = import.meta.env.VITE_API_URL ||  'https://localhost:8000';
export const WB_URL = `${BASE_URL.replace(/^http/, 'ws')}`