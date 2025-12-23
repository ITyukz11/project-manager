import { pusher, pusherChannel } from "@/lib/pusher";

export async function emitCashinUpdated(payload: {
  transactionId: string;
  casinoGroup: string;
  action: "CREATED" | "APPROVED" | "REJECTED" | "UPDATED";
}) {
  console.log("Emitting cashin updated event via Pusher:", payload);
  await pusher.trigger(
    pusherChannel.transactions(payload.casinoGroup),
    "cashin-updated",
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
