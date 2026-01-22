import { NextResponse } from "next/server";

function getJudge0BaseUrl() {
  return (
    process.env.JUDGE0_BASE_URL ||
    process.env.NEXT_PUBLIC_JUDGE0_BASE_URL ||
    "http://50.17.210.111:2358"
  );
}

export async function GET(
  _request: Request,
  context: { params: { token: string } } | { params: Promise<{ token: string }> }
) {
  try {
    // Next.js versions differ: `params` may be a plain object or a Promise.
    // `await` works for both (it returns the object unchanged if it's not a Promise).
    const params = await (context as any).params;
    const token = typeof params?.token === "string" ? params.token : "";
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const baseUrl = getJudge0BaseUrl();
    const url = new URL(`/submissions/${encodeURIComponent(token)}`, baseUrl);
    url.searchParams.set("base64_encoded", "true");

    const upstreamRes = await fetch(url.toString(), {
      method: "GET",
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
    console.error("/api/judge0/submissions/[token]: error", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Failed to reach Judge0", detail: message },
      { status: 502 }
    );
  }
}
