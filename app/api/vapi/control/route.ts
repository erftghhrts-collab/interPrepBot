export const runtime = "nodejs";

import { cookies } from "next/headers";
import { ObjectId } from "mongodb";

import { getDb } from "@/lib/mongodb";
import { verifySessionToken } from "@/lib/session";
import { fetchWithRetry } from "@/lib/fetchWithRetry";

type UserDoc = {
  _id: ObjectId;
  callId?: string;
  callIdUpdatedAt?: string;
};

async function getCurrentUserIdFromSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;
  if (!sessionToken) return null;

  try {
    const { userId } = await verifySessionToken(sessionToken);
    return userId;
  } catch (error) {
    console.error("/api/vapi/control: invalid session token", error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const token = process.env.NEXT_PRIVATE_VAPI_WEB_TOKEN;
    if (!token) {
      console.error("/api/vapi/control: Missing NEXT_PRIVATE_VAPI_WEB_TOKEN");
      return Response.json(
        { ok: false, error: "Missing NEXT_PRIVATE_VAPI_WEB_TOKEN" },
        { status: 500 }
      );
    }

    let body: any = null;
    try {
      body = await request.json();
    } catch (error) {
      console.error("/api/vapi/control: Failed to parse JSON body", error);
      body = null;
    }

    const payload = body?.payload;
    if (!payload || typeof payload !== "object") {
      return Response.json(
        { ok: false, error: "Missing required field: payload" },
        { status: 400 }
      );
    }

    const userId = await getCurrentUserIdFromSession();
    if (!userId || !ObjectId.isValid(userId)) {
      return Response.json(
        { ok: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Prefer an explicit callId provided by the client to avoid race conditions
    // (e.g., proctoring fires before /api/vapi/fetch persists callId).
    let callId: string | undefined =
      typeof body?.callId === "string" && body.callId.trim().length > 0
        ? body.callId.trim()
        : undefined;

    if (!callId) {
      try {
        const db = await getDb();
        const users = db.collection<UserDoc>("users");
        const user = await users.findOne({ _id: new ObjectId(userId) });
        callId = user?.callId;
      } catch (error) {
        console.error("/api/vapi/control: DB lookup failed", error);
        return Response.json(
          { ok: false, error: "Failed to lookup callId" },
          { status: 500 }
        );
      }
    }

    if (!callId) {
      return Response.json(
        { ok: false, error: "No callId found for current user" },
        { status: 404 }
      );
    }

    // 1) Fetch fresh call details to obtain the monitor.controlUrl
    let callRes: Response;
    try {
      callRes = await fetchWithRetry(
        `https://api.vapi.ai/call/${encodeURIComponent(callId)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        },
        {
          retries: 3,
          baseDelayMs: 250,
          maxDelayMs: 2500,
          retryOnMethods: ["GET"],
        }
      );
    } catch (error) {
      console.error("/api/vapi/control: Failed to reach Vapi call endpoint", error);
      return Response.json(
        { ok: false, error: "Failed to reach Vapi" },
        { status: 502 }
      );
    }

    const callText = await callRes.text();
    if (!callRes.ok) {
      console.error("/api/vapi/control: Failed to get call details", {
        status: callRes.status,
        body: callText,
      });
      return Response.json(
        { ok: false, error: "Failed to fetch call details", vapiStatus: callRes.status },
        { status: callRes.status }
      );
    }

    let callJson: any = null;
    try {
      callJson = JSON.parse(callText);
    } catch (error) {
      console.error("/api/vapi/control: Failed to parse call JSON", error);
      callJson = null;
    }

    const controlUrl: string | undefined = callJson?.monitor?.controlUrl;
    if (!controlUrl) {
      console.error("/api/vapi/control: Missing monitor.controlUrl on call payload", {
        callId,
        hasMonitor: !!callJson?.monitor,
      });
      return Response.json(
        {
          ok: false,
          error:
            "Call does not expose monitor.controlUrl. Enable live control by setting monitorPlan.controlEnabled=true in your assistant/workflow.",
        },
        { status: 409 }
      );
    }

    // 2) POST the message to the controlUrl
    let vapiRes: Response;
    try {
      // POST is not strictly idempotent; keep retries conservative.
      vapiRes = await fetchWithRetry(
        controlUrl,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
        {
          retries: 1,
          baseDelayMs: 200,
          maxDelayMs: 1200,
          retryOnMethods: ["POST"],
          retryOnStatuses: [502, 503, 504],
        }
      );
    } catch (error) {
      console.error("/api/vapi/control: Failed to reach Vapi controlUrl", error);
      return Response.json(
        { ok: false, error: "Failed to reach Vapi control endpoint" },
        { status: 502 }
      );
    }

    const vapiText = await vapiRes.text();
    if (!vapiRes.ok) {
      console.error("/api/vapi/control: Vapi control failed", {
        status: vapiRes.status,
        body: vapiText,
      });
      return Response.json(
        { ok: false, error: "Vapi control request failed", vapiStatus: vapiRes.status },
        { status: vapiRes.status }
      );
    }

    return Response.json(
      {
        ok: true,
        callId,
        vapiStatus: vapiRes.status,
        vapiBody: vapiText,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("/api/vapi/control: Unhandled error", error);
    return Response.json(
      { ok: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }

}
