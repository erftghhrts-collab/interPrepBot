type RetryOptions = {
  retries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  retryOnStatuses?: number[];
  retryOnMethods?: Array<"GET" | "POST" | "PATCH" | "PUT" | "DELETE">;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function computeDelayMs(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
  // Exponential backoff with jitter.
  const exp = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt));
  const jitter = exp * (0.15 + Math.random() * 0.2);
  return Math.min(maxDelayMs, Math.round(exp + jitter));
}

function isRetriableStatus(status: number, retryOnStatuses: number[]): boolean {
  if (retryOnStatuses.includes(status)) return true;
  // Sensible defaults for transient upstream/proxy issues.
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

export async function fetchWithRetry(
  input: RequestInfo | URL,
  init: RequestInit = {},
  options: RetryOptions = {}
): Promise<Response> {
  const retries = Math.max(0, options.retries ?? 2);
  const baseDelayMs = Math.max(20, options.baseDelayMs ?? 200);
  const maxDelayMs = Math.max(baseDelayMs, options.maxDelayMs ?? 2000);
  const retryOnStatuses = options.retryOnStatuses ?? [];

  const method = String(init.method ?? "GET").toUpperCase() as any;
  const retryOnMethods = new Set(options.retryOnMethods ?? ["GET", "PATCH"]);

  let lastError: unknown = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(input, init);

      if (attempt < retries && retryOnMethods.has(method) && isRetriableStatus(res.status, retryOnStatuses)) {
        // Drain body so connections can be reused.
        try {
          await res.text();
        } catch {
          // ignore
        }

        const delay = computeDelayMs(attempt, baseDelayMs, maxDelayMs);
        await sleep(delay);
        continue;
      }

      return res;
    } catch (err) {
      lastError = err;
      if (attempt >= retries || !retryOnMethods.has(method)) throw err;
      const delay = computeDelayMs(attempt, baseDelayMs, maxDelayMs);
      await sleep(delay);
    }
  }

  // Should not reach here.
  throw lastError ?? new Error("fetchWithRetry: failed");
}
