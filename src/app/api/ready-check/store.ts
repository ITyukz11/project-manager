// Simple in-memory store for demo. Replace with Redis/DB in production.
export type ReadyCheckParticipant = {
  id: string;
  name: string;
  username: string;
};

export type ReadyCheckRecord = {
  id: string;
  initiator: { id: string; name: string; username?: string };
  participants: ReadyCheckParticipant[];
  // responses: Map of userId -> boolean
  responses: Record<string, boolean>;
  createdAt: string;
};

const readyChecks = new Map<string, ReadyCheckRecord>();

export function createReadyCheck(record: ReadyCheckRecord) {
  readyChecks.set(record.id, record);
}

export function getReadyCheck(id: string) {
  return readyChecks.get(id);
}

export function updateResponse(id: string, userId: string, ready: boolean) {
  const rec = readyChecks.get(id);
  if (!rec) return null;
  rec.responses[userId] = ready;
  return rec;
}

export function deleteReadyCheck(id: string) {
  readyChecks.delete(id);
}

export function listReadyChecks() {
  return Array.from(readyChecks.values());
}
