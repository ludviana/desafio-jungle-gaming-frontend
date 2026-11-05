import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10_000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('kurio_session_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const scenario = localStorage.getItem('kurio_mock_scenario');
  if (scenario) config.headers['X-Mock-Scenario'] = scenario;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      (error as { response?: { status?: number } }).response?.status === 401 &&
      !(
        'config' in error &&
        (error as { config?: { url?: string } }).config?.url?.includes('/auth/login')
      ) &&
      localStorage.getItem('kurio_session_token')
    ) {
      if (localStorage.getItem('kurio_mock_scenario') === 'session-expired') {
        localStorage.removeItem('kurio_mock_scenario');
      }
      window.dispatchEvent(new CustomEvent('kurio:session-expired'));
    }
    return Promise.reject(error);
  },
);
