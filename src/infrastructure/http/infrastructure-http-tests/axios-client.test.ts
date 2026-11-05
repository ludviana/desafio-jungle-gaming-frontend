import { AxiosError, type AxiosResponse } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../axios-client';

async function requestWithStatus(status: number, path: string) {
  return apiClient.get(path, {
    adapter: async (config) => {
      const response: AxiosResponse = {
        data: {},
        status,
        statusText: status === 401 ? 'Unauthorized' : 'OK',
        headers: {},
        config,
      };
      if (status >= 400) {
        throw new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, undefined, response);
      }
      return response;
    },
  });
}

beforeEach(() => {
  localStorage.clear();
});

describe('Axios client interceptors', () => {
  it('adds session and scenario headers from browser storage', async () => {
    localStorage.setItem('kurio_session_token', 'token-1');
    localStorage.setItem('kurio_mock_scenario', 'slow');
    const response = await requestWithStatus(200, '/probe');

    expect(response.config.headers.get('Authorization')).toBe('Bearer token-1');
    expect(response.config.headers.get('X-Mock-Scenario')).toBe('slow');
  });

  it('announces session expiry and clears the expired mock scenario', async () => {
    localStorage.setItem('kurio_session_token', 'expired-token');
    localStorage.setItem('kurio_mock_scenario', 'session-expired');
    const onExpired = vi.fn();
    window.addEventListener('kurio:session-expired', onExpired);

    await expect(requestWithStatus(401, '/profile')).rejects.toBeInstanceOf(AxiosError);

    expect(onExpired).toHaveBeenCalledOnce();
    expect(localStorage.getItem('kurio_mock_scenario')).toBeNull();
    window.removeEventListener('kurio:session-expired', onExpired);
  });

  it('does not broadcast a login failure as session expiration', async () => {
    localStorage.setItem('kurio_session_token', 'expired-token');
    const onExpired = vi.fn();
    window.addEventListener('kurio:session-expired', onExpired);

    await expect(requestWithStatus(401, '/auth/login')).rejects.toBeInstanceOf(AxiosError);

    expect(onExpired).not.toHaveBeenCalled();
    window.removeEventListener('kurio:session-expired', onExpired);
  });
});
