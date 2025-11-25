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
}

export const pusherChannel = {
  global: () => NotificationChannel.Global,
  user: (userId: string) => `${NotificationChannel.User}-${userId}`,
  org: (orgId: string) => `${NotificationChannel.Organization}-${orgId}`,
  role: (role: string) => `${NotificationChannel.Role}-${role}`,
  position: (position: string) => `${NotificationChannel.Position}-${position}`,
  attachmentProgress: (key: string) =>
    `${NotificationChannel.AttachmentProgress}-${key}`,
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
