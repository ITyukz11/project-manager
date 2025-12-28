import { pusher, pusherChannel } from "@/lib/pusher";

export async function emitConcernUpdated(payload: {
  transactionId: string;
  casinoGroup: string;
  action: "CREATED" | "APPROVED" | "REJECTED" | "UPDATED";
}) {
  console.log("Emitting concern updated event via Pusher:", payload);
  await pusher.trigger(
    pusherChannel.transactions(payload.casinoGroup),
    "concern-updated",
    {
      transactionId: payload.transactionId,
      action: payload.action,
      timestamp: new Date().toISOString(),
    }
  );

  console.log(
    "Pusher: Concern updated",
    payload.transactionId,
    payload.casinoGroup
  );
}
