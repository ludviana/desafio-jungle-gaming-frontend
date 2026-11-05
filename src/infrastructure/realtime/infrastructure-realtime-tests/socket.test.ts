import { describe, expect, it } from 'vitest';
import { getRealtimeSocket } from '../socket';

describe('realtime socket client', () => {
  it('reuses one socket configured for the mock Socket.IO endpoint', () => {
    const socket = getRealtimeSocket();

    expect(getRealtimeSocket()).toBe(socket);
    expect(socket.io.opts.path).toBe('/socket.io/');
    expect(socket.io.opts.transports).toEqual(['websocket']);
    expect(socket.io.opts.reconnection).toBe(true);
    expect(socket.active).toBe(false);
  });
});
