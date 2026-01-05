export type Member = { user_id: string; name: string; type: string };

export type PresenceMember = {
  id: string;
  type: "auth" | "guest";
  username?: string;
};

export type PresenceState = {
  members: Record<string, PresenceMember>;
  count: number;
};
