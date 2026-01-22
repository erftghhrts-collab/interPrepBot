"use client";

import Vapi from "@vapi-ai/web";

const VAPI_SINGLETON_KEY = "__hyswe_vapi_singleton__" as const;

type VapiClient = InstanceType<typeof Vapi>;

function getVapiWebToken(): string {
	const token = process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN;
	if (!token) {
		throw new Error("Missing NEXT_PUBLIC_VAPI_WEB_TOKEN");
	}
	return token;
}

export function getVapi(): VapiClient {
	const globalAny = globalThis as unknown as Record<string, unknown>;
	const existing = globalAny[VAPI_SINGLETON_KEY];
	if (existing) return existing as VapiClient;

	const created = new Vapi(getVapiWebToken());
	globalAny[VAPI_SINGLETON_KEY] = created;
	return created;
}

export const vapi = getVapi();
