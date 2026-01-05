/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";
import Pusher, { Channel, PresenceChannel } from "pusher-js";

let pusherClient: Pusher | null = null;

export type PresenceMember = {
  id: string;
  info: {
    type: "auth" | "guest";
    username?: string;
  };
};

export interface UsePusherOptions<T = any> {
  channels: string[];
  eventName?: string; // optional for presence-only
  onEvent?: (data: T) => void;
  audioRef?: React.RefObject<HTMLAudioElement | null>;
  presence?: boolean;
}

export const usePusher = <T = any>({
  channels,
  eventName,
  onEvent,
  audioRef,
  presence = false,
}: UsePusherOptions<T>) => {
  const subscribedChannels = useRef<string[]>([]);
  const hasInteracted = useRef(false);
  const [membersMap, setMembersMap] = useState<Record<string, PresenceMember>>(
    {}
  );

  useEffect(() => {
    if (
      !process.env.NEXT_PUBLIC_PUSHER_KEY ||
      !process.env.NEXT_PUBLIC_PUSHER_CLUSTER
    ) {
      console.warn("[Pusher] Missing environment configuration.");
      return;
    }

    if (!pusherClient && typeof window !== "undefined") {
      pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        authEndpoint: presence ? "/api/pusher/auth" : undefined,
      });
    }

    // Unlock audio on first interaction
    const handleInteraction = () => {
      if (!hasInteracted.current && audioRef?.current) {
        hasInteracted.current = true;
        const audio = audioRef.current;
        audio.muted = true;
        audio
          .play()
          .then(() => {
            audio.pause();
            audio.currentTime = 0;
            audio.muted = false;
          })
          .catch(() => {});
        document.removeEventListener("click", handleInteraction);
        document.removeEventListener("keydown", handleInteraction);
      }
    };

    if (audioRef) {
      document.addEventListener("click", handleInteraction);
      document.addEventListener("keydown", handleInteraction);
    }

    const activeChannels: Channel[] = [];

    channels.forEach((channelName) => {
      if (!subscribedChannels.current.includes(channelName)) {
        const channel = presence
          ? (pusherClient!.subscribe(channelName) as PresenceChannel)
          : pusherClient!.subscribe(channelName);

        subscribedChannels.current.push(channelName);
        activeChannels.push(channel);

        // Presence handling
        if (presence) {
          channel.bind("pusher:subscription_succeeded", (presenceData: any) => {
            const initial: Record<string, PresenceMember> = {};
            presenceData.each((member: any) => {
              initial[member.id] = { id: member.id, info: member.info };
            });
            setMembersMap(initial);
          });

          channel.bind("pusher:member_added", (member: any) => {
            setMembersMap((prev) => ({
              ...prev,
              [member.id]: { id: member.id, info: member.info },
            }));
          });

          channel.bind("pusher:member_removed", (member: any) => {
            setMembersMap((prev) => {
              const copy = { ...prev };
              delete copy[member.id];
              return copy;
            });
          });
        }

        // Event binding
        if (eventName && onEvent) {
          channel.bind(eventName, (data: T) => {
            onEvent(data);
            if (audioRef?.current && hasInteracted.current) {
              audioRef.current.currentTime = 0;
              audioRef.current.play().catch(() => {});
            }
          });
        }
      }
    });

    return () => {
      activeChannels.forEach((channel) => {
        const name = channel.name;
        channel.unbind_all();
        pusherClient?.unsubscribe(name);
      });
      subscribedChannels.current = subscribedChannels.current.filter(
        (ch) => !channels.includes(ch)
      );

      if (audioRef) {
        document.removeEventListener("click", handleInteraction);
        document.removeEventListener("keydown", handleInteraction);
      }
    };
  }, [channels, eventName, onEvent, audioRef, presence]);

  if (presence) {
    return {
      members: membersMap,
      count: Object.keys(membersMap).length,
      authenticatedCount: Object.values(membersMap).filter(
        (m) => m.info.type === "auth"
      ).length,
      guestCount: Object.values(membersMap).filter(
        (m) => m.info.type === "guest"
      ).length,
    };
  }

  return undefined;
};
