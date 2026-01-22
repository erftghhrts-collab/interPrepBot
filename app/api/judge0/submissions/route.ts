import { NextResponse } from "next/server";

function getJudge0BaseUrl() {
  return (
    process.env.JUDGE0_BASE_URL ||
    process.env.NEXT_PUBLIC_JUDGE0_BASE_URL ||
    "http://50.17.210.111:2358"
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const language_id = Number(body?.language_id);
    const source_code = typeof body?.source_code === "string" ? body.source_code : "";
    const stdin = typeof body?.stdin === "string" ? body.stdin : "";

    if (!Number.isFinite(language_id) || language_id <= 0) {
      return NextResponse.json({ error: "Invalid language_id" }, { status: 400 });
    }

    const baseUrl = getJudge0BaseUrl();
    const url = new URL("/submissions", baseUrl);
    url.searchParams.set("base64_encoded", "true");
    url.searchParams.set("wait", "false");

    const upstreamRes = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language_id, source_code, stdin }),
      // Judge0 responses should not be cached
      cache: "no-store",
    });

    const text = await upstreamRes.text();
    let data: unknown = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { error: "Upstream returned non-JSON response", raw: text };
    }

    return NextResponse.json(data, { status: upstreamRes.status });
  } catch (err) {
    console.error("/api/judge0/submissions: error", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Failed to reach Judge0", detail: message },
      { status: 502 }
    );
  }
}
