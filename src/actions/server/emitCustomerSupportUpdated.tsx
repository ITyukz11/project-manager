import { pusher, pusherChannel } from "@/lib/pusher";

export async function emitCustomerSupportUpdated(payload: {
  transactionId: string;
  casinoGroup: string;
  action: "CREATED" | "APPROVED" | "REJECTED" | "UPDATED";
}) {
  console.log("Emitting customerSupport updated event via Pusher:", payload);
  await pusher.trigger(
    pusherChannel.transactions(payload.casinoGroup),
    "customerSupport-updated",
    {
      transactionId: payload.transactionId,
      action: payload.action,
      timestamp: new Date().toISOString(),
    }
  );

  console.log(
    "Pusher: CustomerSupport updated",
    payload.transactionId,
    payload.casinoGroup
  );
}
