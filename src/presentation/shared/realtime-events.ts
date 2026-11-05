export function shouldApplyRealtimeEvent(
  eventId: string,
  resourceId: string,
  version: number,
  seenEventIds: Set<string>,
  latestVersions: Map<string, number>,
): boolean {
  if (seenEventIds.has(eventId)) return false;
  seenEventIds.add(eventId);
  if ((latestVersions.get(resourceId) ?? 0) >= version) return false;
  latestVersions.set(resourceId, version);
  return true;
}
