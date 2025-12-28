import Pusher from "pusher";

export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
});

export enum NotificationChannel {
  Global = "notifications",
  User = "user",
  Organization = "org",
  Role = "role",
  Position = "position",
  AttachmentProgress = "attachment-progress",

  OnlineUsers = "online-users",
  Transactions = "transactions",
}

export const pusherChannel = {
  global: () => NotificationChannel.Global,
  user: (userId: string) => `${NotificationChannel.User}-${userId}`,
  org: (orgId: string) => `${NotificationChannel.Organization}-${orgId}`,
  role: (role: string) => `${NotificationChannel.Role}-${role}`,
  position: (position: string) => `${NotificationChannel.Position}-${position}`,
  attachmentProgress: (key: string) =>
    `${NotificationChannel.AttachmentProgress}-${key}`,
  onlineUsers: () => NotificationChannel.OnlineUsers,
  transactions: (casinoGroup: string) =>
    `${NotificationChannel.Transactions}-${casinoGroup.toLocaleLowerCase()}`,
};

export async function emitUploadProgress(
  uploadKey: string,
  fileName: string,
  progress: number
) {
  await pusher.trigger(
    pusherChannel.attachmentProgress(uploadKey),
    "upload-progress",
    {
      key: uploadKey,
      fileName,
      progress,
    }
  );
}

// NEW:  Emit user clocked in event
export async function emitUserClockedIn(user: {
  id: string;
  name: string;
  username: string;
  email: string | null;
  role: string;
  time: string | null;
  ipAddress: string | null;
  device: string | null;
  isClockedIn: boolean;
}) {
  await pusher.trigger(pusherChannel.onlineUsers(), "user-clocked-in", {
    user,
  });
  console.log("Pusher: User clocked in event triggered", user.id);
}

// NEW: Emit user clocked out event
export async function emitUserClockedOut(userId: string) {
  await pusher.trigger(pusherChannel.onlineUsers(), "user-clocked-out", {
    userId,
  });
  console.log("Pusher: User clocked out event triggered", userId);
}

// NEW: Emit online users status change
export async function emitOnlineUsersUpdate() {
  await pusher.trigger(pusherChannel.onlineUsers(), "online-users-updated", {
    timestamp: new Date().toISOString(),
  });
  console.log("Pusher: Online users updated event triggered");
}
