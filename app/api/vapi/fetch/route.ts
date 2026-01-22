export const runtime = "nodejs";

import Ably from "ably";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";

import { verifySessionToken, verifyVapiToolToken } from "@/lib/session";

async function getCurrentUserIdFromSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;
  if (!sessionToken) return null;

  try {
    const { userId } = await verifySessionToken(sessionToken);
    return userId;
  } catch (error) {
    console.error("/api/vapi/fetch: invalid session token", error);
    return null;
  }
}

export async function GET() {
  return Response.json(
    { ok: false, error: "Method Not Allowed" },
    { status: 405, headers: { Allow: "POST" } }
  );
}

export async function POST(request: Request) {
  let body: any = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const action = typeof body?.action === "string" ? body.action : "";
  const qid =
    typeof body?.qid === "string"
      ? body.qid
      : typeof body?.qid === "number" && Number.isFinite(body.qid)
        ? String(body.qid)
        : "";
  const language = typeof body?.language === "string" ? body.language : "";
  const requestUserId =
    typeof body?.userId === "string"
      ? body.userId
      : typeof body?.userid === "string"
        ? body.userid
        : "";

  // Auth options:
  // 1) Browser call: session cookie is present (same as PATCH)
  // 2) Server-to-server call (e.g. Vapi tool): Authorization: Bearer <vapiToolToken>
  const authHeader = request.headers.get("authorization") || "";
  const bearer = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";

  let tokenUserId: string | null = null;
  if (bearer) {
    try {
      const { userId } = await verifyVapiToolToken(bearer);
      tokenUserId = userId;
    } catch (error) {
      console.error("/api/vapi/fetch: invalid tool token", error);
      return Response.json(
        { ok: false, error: "Invalid tool token" },
        { status: 401 }
      );
    }
  }

  const sessionUserId = await getCurrentUserIdFromSession();
  const effectiveUserId = tokenUserId || sessionUserId;

  if (!effectiveUserId || !ObjectId.isValid(effectiveUserId)) {
    return Response.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  if (tokenUserId && sessionUserId && tokenUserId !== sessionUserId) {
    return Response.json(
      { ok: false, error: "Auth mismatch" },
      { status: 403 }
    );
  }

  // If caller provided a userId in body, it must match the authenticated identity.
  if (requestUserId && requestUserId !== effectiveUserId) {
    return Response.json(
      {
        ok: false,
        error: "userId mismatch",
        sessionUserId: sessionUserId || null,
        requestUserId: requestUserId || null,
      },
      { status: 403 }
    );
  }

  if (!action) {
    return Response.json(
      { ok: false, error: "Missing required field in POST body: action" },
      { status: 400 }
    );
  }

  if (action === "open_compiler") {
    const published = await publishOpenCompiler({
      userId: effectiveUserId,
      qid,
      language,
    });

    if (!published.ok) {
      return Response.json(
        { ok: false, error: published.error },
        { status: published.status }
      );
    }

    return Response.json(
      { ok: true, emitted: true, action, qid: qid || null, language: language || null },
      { status: 200 }
    );
  }

  if (action === "close_monaco") {
    const published = await publishCloseMonaco({
      userId: effectiveUserId,
      qid,
      language,
    });

    if (!published.ok) {
      return Response.json(
        { ok: false, error: published.error },
        { status: published.status }
      );
    }

    return Response.json(
      { ok: true, emitted: true, action, qid: qid || null, language: language || null },
      { status: 200 }
    );
  }

  return Response.json(
    { ok: false, error: `Unsupported action: ${action}` },
    { status: 400 }
  );
}

async function publishOpenCompiler(params: {
  userId: string;
  qid: string;
  language: string;
}) {
  const apiKey = process.env.ABLY_API_KEY;
  if (!apiKey) {
    return { ok: false as const, status: 500, error: "Missing ABLY_API_KEY" };
  }

  const ably = new Ably.Rest({ key: apiKey });
  const channelName = `user:${params.userId}`;

  try {
    await ably.channels
      .get(channelName)
      .publish("open_compiler", {
        qid: params.qid,
        language: params.language,
        userId: params.userId,
        at: new Date().toISOString(),
      });

    return { ok: true as const, status: 200 };
  } catch (e) {
    return {
      ok: false as const,
      status: 502,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

async function publishCloseMonaco(params: {
  userId: string;
  qid: string;
  language: string;
}) {
  const apiKey = process.env.ABLY_API_KEY;
  if (!apiKey) {
    return { ok: false as const, status: 500, error: "Missing ABLY_API_KEY" };
  }

  const ably = new Ably.Rest({ key: apiKey });
  const channelName = `user:${params.userId}`;

  try {
    await ably.channels
      .get(channelName)
      .publish("close_monaco", {
        qid: params.qid,
        language: params.language,
        userId: params.userId,
        at: new Date().toISOString(),
      });

    return { ok: true as const, status: 200 };
  } catch (e) {
    return {
      ok: false as const,
      status: 502,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}