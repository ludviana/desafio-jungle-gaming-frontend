import { beforeEach, describe, expect, it } from 'vitest';
import { getSafeReturnPath, getToken, messageFromError, TOKEN_KEY } from '../site';

describe('presentation utilities', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('reads the current session token and falls back to empty', () => {
    expect(getToken()).toBe('');
    localStorage.setItem(TOKEN_KEY, 'session-token');
    expect(getToken()).toBe('session-token');
  });

  it('accepts supported return paths and rejects external destinations', () => {
    sessionStorage.setItem('kurio_return_to', '/nft/emerald-ape-042?ref=home');
    expect(getSafeReturnPath()).toBe('/nft/emerald-ape-042?ref=home');

    sessionStorage.setItem('kurio_return_to', '//evil.example');
    expect(getSafeReturnPath()).toBe('/');
  });

  it('extracts API messages and handles unknown errors', () => {
    expect(messageFromError({ response: { data: { message: 'Falha de validação.' } } })).toBe(
      'Falha de validação.',
    );
    expect(messageFromError(new Error('Offline'))).toBe('Offline');
    expect(messageFromError(null)).toBe('Ocorreu um erro. Tente novamente.');
  });
});
