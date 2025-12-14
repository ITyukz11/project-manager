// Simple in-memory store that uses globalThis to survive HMR reloads in development.
// Replace with Redis/DB for production.

export type ReadyCheckParticipant = {
  id: string;
  name?: string | null;
  username?: string | null;
  role?: string | null;
};

export type ReadyCheckRecord = {
  id: string;
  initiator: {
    id: string;
    name?: string | null;
    username?: string | null;
    role?: string | null;
  };
  participants: ReadyCheckParticipant[];
  responses: Record<string, boolean>;
  createdAt: string;
};

declare global {
  // eslint-disable-next-line no-var
  var __READY_CHECKS__: Map<string, ReadyCheckRecord> | undefined;
}

const getStore = (): Map<string, ReadyCheckRecord> => {
  if (!globalThis.__READY_CHECKS__) {
    globalThis.__READY_CHECKS__ = new Map<string, ReadyCheckRecord>();
  }
  return globalThis.__READY_CHECKS__;
};

export function createReadyCheck(record: ReadyCheckRecord) {
  const store = getStore();
  store.set(record.id, record);
}

export function getReadyCheck(id: string) {
  const store = getStore();
  return store.get(id);
}

export function updateResponse(id: string, userId: string, ready: boolean) {
  const store = getStore();
  const rec = store.get(id);
  if (!rec) return null;
  rec.responses[userId] = ready;
  return rec;
}

export function deleteReadyCheck(id: string) {
  const store = getStore();
  store.delete(id);
}

export function listReadyChecks() {
  return Array.from(getStore().values());
}
