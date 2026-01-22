export const runtime = "nodejs";

import Ably from "ably";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";

import { verifySessionToken } from "@/lib/session";

async function getCurrentUserIdFromSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;
  if (!sessionToken) return null;

  try {
    const { userId } = await verifySessionToken(sessionToken);
    return userId;
  } catch (error) {
    console.error("/api/realtime/auth: invalid session token", error);
    return null;
  }
}

export async function GET() {
  const sessionUserId = await getCurrentUserIdFromSession();
  if (!sessionUserId || !ObjectId.isValid(sessionUserId)) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const apiKey = process.env.ABLY_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Missing ABLY_API_KEY" },
      { status: 500 }
    );
  }

  const ably = new Ably.Rest({ key: apiKey });

  // Per-user channel. Client is only allowed to subscribe to its own channel.
  const channelName = `user:${sessionUserId}`;
  const capability = {
    [channelName]: ["subscribe"],
  };

  const tokenRequest = await ably.auth.createTokenRequest({
    clientId: sessionUserId,
    capability: JSON.stringify(capability),
  });

  return Response.json(tokenRequest, { status: 200 });
}
