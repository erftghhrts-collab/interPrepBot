"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
import { createFeedback } from "@/lib/actions/general.action";
import { interviewScheduler, interviewer } from "@/constants";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

type VapiMessage =
  | {
      type: "transcript";
      transcriptType: "final" | "partial";
      role: SavedMessage["role"];
      transcript: string;
    }
  | {
      type: string;
      [key: string]: unknown;
    };

const SAVED_MESSAGE_ROLES = ["user", "system", "assistant"] as const;

function isSavedMessageRole(role: unknown): role is SavedMessage["role"] {
  return (
    typeof role === "string" &&
    (SAVED_MESSAGE_ROLES as readonly string[]).includes(role)
  );
}

function isFinalTranscriptMessage(
  message: VapiMessage
): message is {
  type: "transcript";
  transcriptType: "final";
  role: SavedMessage["role"];
  transcript: string;
} {
  return (
    message.type === "transcript" &&
    (message as { transcriptType?: unknown }).transcriptType === "final" &&
    isSavedMessageRole((message as { role?: unknown }).role) &&
    typeof (message as { transcript?: unknown }).transcript === "string"
  );
}

async function fetchWithRetryClient(
  input: RequestInfo | URL,
  init: RequestInit,
  options?: { retries?: number; baseDelayMs?: number; maxDelayMs?: number; retryOnStatuses?: number[] }
): Promise<Response> {
  const retries = Math.max(0, options?.retries ?? 2);
  const baseDelayMs = Math.max(20, options?.baseDelayMs ?? 250);
  const maxDelayMs = Math.max(baseDelayMs, options?.maxDelayMs ?? 2500);
  const retryOnStatuses = options?.retryOnStatuses ?? [502, 503, 504];

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  const jitterDelay = (attempt: number) => {
    const exp = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt));
    const jitter = exp * (0.15 + Math.random() * 0.2);
    return Math.min(maxDelayMs, Math.round(exp + jitter));
  };

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(input, init);
      if (attempt < retries && retryOnStatuses.includes(res.status)) {
        try {
          await res.text();
        } catch {
          // ignore
        }
        await sleep(jitterDelay(attempt));
        continue;
      }
      return res;
    } catch (err) {
      lastError = err;
      if (attempt >= retries) throw err;
      await sleep(jitterDelay(attempt));
    }
  }

  throw lastError ?? new Error("fetchWithRetryClient failed");
}

const Agent = ({
  userName,
  userId,
  interviewId,
  feedbackId,
  type,
  questions,
}: AgentProps) => {
  const router = useRouter();
  const callIdRef = useRef<string | null>(null);
  const vapiToolTokenRef = useRef<string | null>(null);
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>("");
  const [isRedirecting, setIsRedirecting] = useState(false);

  // console.log(interviewId,"questions rey baba" ,questions);

  useEffect(() => {
    const onCallStart = async () => {
      setCallStatus(CallStatus.ACTIVE);
    };

    const onCallEnd = () => {
      setIsRedirecting(true);
      setCallStatus(CallStatus.FINISHED);
    };

    const onMessage = (message: VapiMessage) => {
      if (isFinalTranscriptMessage(message)) {
        const newMessage: SavedMessage = { role: message.role, content: message.transcript };
        setMessages((prev) => [...prev, newMessage]);
      }
    };

    const onSpeechStart = () => {
      console.log("speech start");
      setIsSpeaking(true);
    };

    const onSpeechEnd = () => {
      console.log("speech end");
      setIsSpeaking(false);
    };

    const onError = (error: Error) => {
      console.log("Error:", error);
    };

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("error", onError);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("error", onError);
    };
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setLastMessage(messages[messages.length - 1].content);
    }

    const handleGenerateFeedback = async (messages: SavedMessage[]) => {
      console.log("handleGenerateFeedback");

      const { success, feedbackId: id } = await createFeedback({
        interviewId: interviewId!,
        userId: userId!,
        transcript: messages,
        feedbackId,
      });

      if (!success || !id) {
        console.log("Error saving feedback");
      }

      // Requirement: after call ends, always redirect to dashboard.
      router.push("/");
    };

    if (callStatus === CallStatus.FINISHED) {
      setIsRedirecting(true);
      if (type === "generate") {
        router.push("/");
      } else {
        handleGenerateFeedback(messages);
      }
    }
  }, [messages, callStatus, feedbackId, interviewId, router, type, userId]);

  const handleCall = async () => {
    if (isRedirecting) return;
    setCallStatus(CallStatus.CONNECTING);

    // We cannot (and should not) read an httpOnly `session` cookie directly in client JS.
    // Instead, mint a short-lived token server-side (still authenticated via cookie)
    // and pass it to Vapi as a variable.
    if (!vapiToolTokenRef.current) {
      try {
        const res = await fetchWithRetryClient(
          "/api/vapi/tool-token",
          { method: "GET" },
          { retries: 3, baseDelayMs: 250, maxDelayMs: 2500, retryOnStatuses: [502, 503, 504] }
        );
        const data = await res.json().catch(() => null);
        if (res.ok && data?.token && typeof data.token === "string") {
          vapiToolTokenRef.current = data.token;
        }
      } catch {
        // Non-blocking; interview call can still proceed.
      }
    }

    if (type === "generate") {
      await vapi.start(interviewScheduler, {
        variableValues: {
          username: userName,
          userid: userId,
          vapiToolToken: vapiToolTokenRef.current || "",
        },
      });
    } else {
      const curr_call_response = await vapi.start(interviewer, {
        variableValues: {
          username: userName,
          userid: userId,
          // Pass-through: send DB `questions` exactly as stored.
          questions: questions as any,
        },
      });
      const curr_call_id = curr_call_response!=null ? curr_call_response.id : "";
      // Store the callId; we'll send it to the server after we receive the "call-start" event.
      callIdRef.current = curr_call_id || null;

      // console.log(curr_call_response);
    }
  };

  const handleDisconnect = () => {
    setIsRedirecting(true);
    setCallStatus(CallStatus.FINISHED);
    vapi.stop();
  };

  return (
    <>
      {isRedirecting && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-2xl">
          <div className="rounded-2xl px-10 py-8 shadow-2xl ring-1 ring-black/5">
            <div className="flex flex-col items-center">
              <span
                aria-hidden="true"
                className="size-14 animate-spin rounded-full border-[5px] border-[#00FFFF]/15 border-t-[#00FFFF]"
              />
              <p className="mt-4 text-base font-semibold text-[#ffffff]">
                Redirecting to dashboard
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Call UI should occupy only the original "cards" area (not full screen) */}
      <div className="w-full" aria-label="Interview call screen">
        <div
          className={cn(
            "relative w-full",
            "h-[550px] sm:h-[570px]"
          )}
        >
          <div
            className={cn(
              "relative z-20 h-full w-full overflow-hidden rounded-2xl border border-white/10 bg-black"
            )}
            style={{
              background:
                "radial-gradient(1200px 600px at 20% 20%, rgba(0, 255, 255, 0.12), transparent 60%), radial-gradient(800px 500px at 80% 80%, rgba(202, 197, 254, 0.12), transparent 65%), linear-gradient(180deg, rgba(2, 4, 8, 0.98), rgba(2, 4, 8, 0.78))",
            }}
          >
            {/* AI interviewer card */}
            <div className="absolute left-0 top-0 z-20">
              <div
                className="pointer-events-auto flex items-center gap-3 rounded-br-2xl px-3 py-2"
                style={{
                  background: "rgba(0, 0, 0, 0.38)",
                  backdropFilter: "blur(14px)",
                  borderRight: "1px solid rgba(255, 255, 255, 0.12)",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
                  boxShadow: "0 14px 40px rgba(0, 0, 0, 0.35)",
                  paddingTop: "10px",
                  paddingLeft: "10px",
                }}
              >
                <div
                  className="relative grid place-items-center rounded-2xl p-2"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(0, 255, 255, 0.25), rgba(202, 197, 254, 0.15))",
                  }}
                >
                  <Image
                    src="/ai-avatar.png"
                    alt="AI interviewer"
                    width={44}
                    height={44}
                    className="object-cover"
                  />
                  {isSpeaking && (
                    <span
                      className="absolute -inset-1 rounded-2xl"
                      style={{
                        boxShadow: "0 0 0 2px rgba(0, 255, 255, 0.35)",
                        animation: "callPulse 1.05s ease-in-out infinite",
                      }}
                    />
                  )}
                </div>

                <div className="flex flex-col">
                  <p className="text-sm font-semibold text-white">AI Interviewer</p>
                  <p className="text-[11px] text-white/70">
                    {callStatus === CallStatus.CONNECTING
                      ? "Connecting…"
                      : callStatus === CallStatus.ACTIVE
                        ? isSpeaking
                          ? "Speaking"
                          : "Listening"
                        : "Ready"}
                  </p>
                </div>
              </div>
            </div>

            {/* Status pill */}
            <div
              className="absolute right-3 top-3 z-20 rounded-full px-3 py-1 text-[11px] font-semibold text-white/90"
              style={{
                background: "rgba(0, 0, 0, 0.35)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                backdropFilter: "blur(14px)",
                top: "12px",
                right: "12px",
              }}
              aria-live="polite"
            >
              {callStatus === CallStatus.ACTIVE
                ? "Live"
                : callStatus === CallStatus.CONNECTING
                  ? "Calling"
                  : "Preview"}
            </div>

            {messages.length > 0 && (
            <div
              className="absolute left-0 right-0 z-20 px-4"
              style={{
                bottom: "92px",
              }}
            >
              <p
                key={lastMessage}
                className={cn(
                  "transition-opacity duration-500 opacity-0",
                  "animate-fadeIn opacity-100"
                )}
                style={{
                  background: "rgba(0, 0, 0, 0.42)",
                  border: "1px solid rgba(255, 255, 255, 0.14)",
                  backdropFilter: "blur(16px)",
                  boxShadow: "0 10px 28px rgba(0, 0, 0, 0.35)",
                }}
              >
                <span className="mx-auto block max-w-3xl text-center text-base text-white">
                  {lastMessage}
                </span>
              </p>
            </div>
          )}

            {/* Keep the rest of the UI above the controls */}
          </div>

          {/* Call controls OUTSIDE the stage */}
          <div
            className={cn(
              "absolute left-1/2 z-[70] flex -translate-x-1/2 justify-center"
            )}
            style={{
              bottom: "22px",
            }}
          >
            {callStatus !== CallStatus.ACTIVE ? (
              <button
                className={cn(
                  "inline-flex min-w-32 items-center justify-center rounded-full px-8 py-3 text-sm font-bold text-white",
                  "cursor-pointer",
                  (isRedirecting || callStatus === CallStatus.CONNECTING) && "opacity-80 cursor-not-allowed"
                )}
                style={{
                  boxShadow: "0 16px 44px rgba(0, 0, 0, 0.55)",
                  letterSpacing: "0.2px",
                  background:
                    "linear-gradient(180deg, rgba(73, 222, 80, 0.95), rgba(66, 199, 72, 0.95))",
                }}
                disabled={isRedirecting || callStatus === CallStatus.CONNECTING}
                onClick={handleCall}
              >
                {callStatus === CallStatus.CONNECTING ? (
                  <span className="inline-flex items-center">
                    <span
                      aria-hidden="true"
                      className="mr-2 size-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                    />
                    Calling…
                  </span>
                ) : (
                  "Call"
                )}
              </button>
            ) : (
              <button
                className={cn(
                  "inline-flex min-w-32 items-center justify-center rounded-full px-8 py-3 text-sm font-bold text-white",
                  "cursor-pointer",
                  isRedirecting && "opacity-80 cursor-not-allowed"
                )}
                style={{
                  boxShadow: "0 16px 44px rgba(0, 0, 0, 0.55)",
                  letterSpacing: "0.2px",
                  background:
                    "linear-gradient(180deg, rgba(247, 83, 83, 0.95), rgba(196, 65, 65, 0.95))",
                }}
                disabled={isRedirecting}
                onClick={handleDisconnect}
              >
                End call
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Agent;
