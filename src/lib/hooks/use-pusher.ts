/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef } from "react";
import Pusher, { Channel } from "pusher-js";

let pusherClient: Pusher | null = null;

export interface UsePusherOptions<T = any> {
  channels: string[];
  eventName: string;
  onEvent: (data: T) => void;
  audioRef?: React.RefObject<HTMLAudioElement | null>;
}

export const usePusher = <T = any>({
  channels,
  eventName,
  onEvent,
  audioRef,
}: UsePusherOptions<T>) => {
  const subscribedChannels = useRef<string[]>([]);
  const hasInteracted = useRef<boolean>(false);

  useEffect(() => {
    if (
      !process.env.NEXT_PUBLIC_PUSHER_KEY ||
      !process.env.NEXT_PUBLIC_PUSHER_CLUSTER
    ) {
      console.warn("[Pusher] Missing environment configuration.");
      return;
    }

    if (!pusherClient) {
      pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      });
    }

    // Unlock audio on first user interaction
    const handleInteraction = () => {
      if (!hasInteracted.current && audioRef?.current) {
        hasInteracted.current = true;

        audioRef.current
          .play()
          .then(() => audioRef.current?.pause())
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
        const channel = pusherClient!.subscribe(channelName);
        subscribedChannels.current.push(channelName);
        activeChannels.push(channel);

        console.info(`[Pusher] Subscribing to ${channelName}`);

        channel.bind("pusher:subscription_succeeded", () => {
          console.log(`[Pusher] Subscribed to ${channelName}`);
        });

        channel.bind(eventName, (data: T) => {
          console.log(`[Pusher] Event '${eventName}' on ${channelName}`, data);
          onEvent(data);

          // 🔔 PLAY AUDIO WHEN EVENT HAPPENS
          if (audioRef?.current && hasInteracted.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => {});
          }
        });
      }
    });

    return () => {
      activeChannels.forEach((channel) => {
        const name = channel.name;
        channel.unbind_all();
        pusherClient?.unsubscribe(name);
        console.log(`[Pusher] Unsubscribed from ${name}`);
      });

      subscribedChannels.current = subscribedChannels.current.filter(
        (ch) => !channels.includes(ch)
      );

      if (audioRef) {
        document.removeEventListener("click", handleInteraction);
        document.removeEventListener("keydown", handleInteraction);
      }
    };
  }, [audioRef, channels, eventName, onEvent]);
};
