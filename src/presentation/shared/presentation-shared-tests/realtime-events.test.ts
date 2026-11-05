import { describe, expect, it } from 'vitest';
import { shouldApplyRealtimeEvent } from '../realtime-events';

describe('realtime event ordering', () => {
  it('ignores a duplicate event id', () => {
    const seenEventIds = new Set<string>();
    const latestVersions = new Map<string, number>();

    expect(shouldApplyRealtimeEvent('event-1', 'nft-1', 1, seenEventIds, latestVersions)).toBe(
      true,
    );
    expect(shouldApplyRealtimeEvent('event-1', 'nft-1', 1, seenEventIds, latestVersions)).toBe(
      false,
    );
  });

  it('does not apply an older resource version', () => {
    const seenEventIds = new Set<string>();
    const latestVersions = new Map<string, number>();

    expect(shouldApplyRealtimeEvent('event-2', 'order-1', 2, seenEventIds, latestVersions)).toBe(
      true,
    );
    expect(shouldApplyRealtimeEvent('event-1', 'order-1', 1, seenEventIds, latestVersions)).toBe(
      false,
    );
    expect(latestVersions.get('order-1')).toBe(2);
  });
});
