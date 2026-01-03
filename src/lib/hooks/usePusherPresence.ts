import { useEffect, useRef, useState } from "react";
import Pusher, { PresenceChannel } from "pusher-js";

let pusherClient: Pusher | null = null;

type PresenceMember = {
  id: string;
  info: {
    type: "auth" | "guest";
    username?: string;
  };
};

export function usePusherPresence(channelName: string) {
  const [members, setMembers] = useState<Record<string, PresenceMember>>({});
  const channelRef = useRef<PresenceChannel | null>(null);

  useEffect(() => {
    if (!pusherClient) {
      pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        authEndpoint: "/api/pusher/auth",
      });
    }

    const channel = pusherClient.subscribe(channelName) as PresenceChannel;

    channelRef.current = channel;

    channel.bind("pusher:subscription_succeeded", (presence: any) => {
      const initialMembers: Record<string, PresenceMember> = {};

      presence.each((member: any) => {
        initialMembers[member.id] = {
          id: member.id,
          info: member.info,
        };
      });

      setMembers(initialMembers);
    });

    channel.bind("pusher:member_added", (member: any) => {
      setMembers((prev) => ({
        ...prev,
        [member.id]: {
          id: member.id,
          info: member.info,
        },
      }));
    });

    channel.bind("pusher:member_removed", (member: any) => {
      setMembers((prev) => {
        const copy = { ...prev };
        delete copy[member.id];
        return copy;
      });
    });

    return () => {
      channel.unbind_all();
      pusherClient?.unsubscribe(channelName);
    };
  }, [channelName]);

  return {
    members,
    count: Object.keys(members).length,
    authenticatedCount: Object.values(members).filter(
      (m) => m.info.type === "auth"
    ).length,
    guestCount: Object.values(members).filter((m) => m.info.type === "guest")
      .length,
  };
}
