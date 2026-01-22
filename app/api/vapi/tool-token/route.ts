export const runtime = "nodejs";

import { cookies } from "next/headers";

import { createVapiToolToken, verifySessionToken } from "@/lib/session";

export async function GET() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;

  if (!sessionToken) {
    return Response.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { userId } = await verifySessionToken(sessionToken);
    const token = await createVapiToolToken(userId);

    return Response.json(
      {
        ok: true,
        userId,
        token,
        expiresInSeconds: 60 * 10,
      },
      { status: 200 }
    );
  } catch {
    return Response.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }
}
