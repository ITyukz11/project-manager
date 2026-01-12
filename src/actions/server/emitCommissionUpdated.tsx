import { pusher, pusherChannel } from "@/lib/pusher";

export async function emitCommissionUpdated(payload: {
  transactionId: string;
  casinoGroup: string;
  action: "CREATED" | "APPROVED" | "REJECTED" | "UPDATED";
}) {
  console.log("Emitting commission updated event via Pusher:", payload);
  await pusher.trigger(
    pusherChannel.transactions(payload.casinoGroup),
    "commission-updated",
    {
      transactionId: payload.transactionId,
      action: payload.action,
      timestamp: new Date().toISOString(),
    }
  );

  console.log(
    "Pusher: Commission updated",
    payload.transactionId,
    payload.casinoGroup
  );
}
