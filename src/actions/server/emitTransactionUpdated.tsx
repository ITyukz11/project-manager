import { pusher, pusherChannel } from "@/lib/pusher";

export async function emitTransactionUpdated(payload: {
  transactionId: string;
  casinoGroup: string;
  action: "CREATED" | "APPROVED" | "REJECTED" | "UPDATED" | "CLAIMED";
}) {
  console.log("Emitting transaction updated event via Pusher:", payload);
  await pusher.trigger(
    pusherChannel.transactions(payload.casinoGroup),
    "transaction-updated",
    {
      transactionId: payload.transactionId,
      action: payload.action,
      timestamp: new Date().toISOString(),
    }
  );

  console.log(
    "Pusher: Transaction updated",
    payload.transactionId,
    payload.casinoGroup
  );
}
