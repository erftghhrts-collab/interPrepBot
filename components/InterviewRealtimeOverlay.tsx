"use client";

import Ably from "ably";
import { useEffect, useRef } from "react";

type OpenCompilerPayload = {
  qid?: string;
  language?: string;
  userId?: string;
  at?: string;
};

type CloseMonacoPayload = {
  qid?: string;
  language?: string;
  userId?: string;
  at?: string;
};

declare global {
  interface WindowEventMap {
    "interview:open_compiler": CustomEvent<OpenCompilerPayload>;
    "interview:close_monaco": CustomEvent<CloseMonacoPayload>;
  }
}

const InterviewRealtimeOverlay = ({ userId }: { userId: string }) => {
  const clientRef = useRef<Ably.Realtime | null>(null);

  useEffect(() => {
    const client = new Ably.Realtime({
      authUrl: "/api/realtime/auth",
      authMethod: "GET",
    });
    clientRef.current = client;

    const channelName = `user:${userId}`;
    const channel = client.channels.get(channelName);

    const onOpenCompiler = (message: { data?: unknown } | null) => {
      const payload = (message?.data as OpenCompilerPayload) ?? null;
      window.dispatchEvent(
        new CustomEvent<OpenCompilerPayload>("interview:open_compiler", {
          detail: payload ?? {},
        })
      );
    };

    const onCloseMonaco = (message: { data?: unknown } | null) => {
      const payload = (message?.data as CloseMonacoPayload) ?? null;
      window.dispatchEvent(
        new CustomEvent<CloseMonacoPayload>("interview:close_monaco", {
          detail: payload ?? {},
        })
      );
    };

    channel.subscribe("open_compiler", onOpenCompiler);
    channel.subscribe("close_monaco", onCloseMonaco);

    return () => {
      channel.unsubscribe("open_compiler", onOpenCompiler);
      channel.unsubscribe("close_monaco", onCloseMonaco);
      client.close();
      clientRef.current = null;
    };
  }, [userId]);

  // This component's job is to subscribe + dispatch a UI event.
  // Rendering UI is handled inside the interview screen.
  return null;
};

export default InterviewRealtimeOverlay;
