import { pusher, pusherChannel } from "@/lib/pusher";

export async function emitTaskUpdated(payload: {
  transactionId: string;
  casinoGroup: string;
  action: "CREATED" | "APPROVED" | "REJECTED" | "UPDATED";
}) {
  console.log("Emitting task updated event via Pusher:", payload);
  await pusher.trigger(
    pusherChannel.transactions(payload.casinoGroup),
    "task-updated",
    {
      transactionId: payload.transactionId,
      action: payload.action,
      timestamp: new Date().toISOString(),
    }
  );

  console.log(
    "Pusher: Task updated",
    payload.transactionId,
    payload.casinoGroup
  );
}
