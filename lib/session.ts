import { jwtVerify, SignJWT } from "jose";

const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;
const VAPI_TOOL_TOKEN_DURATION_SECONDS = 60 * 10;

function getJwtSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("Missing environment variable: AUTH_SECRET");
  }
  return new TextEncoder().encode(secret);
}

export function getSessionDurationSeconds() {
  return SESSION_DURATION_SECONDS;
}

export async function createSessionToken(userId: string) {
  const secret = getJwtSecret();

  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(secret);
}

export async function verifySessionToken(token: string) {
  const secret = getJwtSecret();
  const { payload } = await jwtVerify(token, secret);

  if (!payload.sub) {
    throw new Error("Invalid session token: missing subject");
  }

  return {
    userId: payload.sub,
  };
}

export async function createVapiToolToken(userId: string) {
  const secret = getJwtSecret();

  return new SignJWT({ purpose: "vapi_tool" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setAudience("vapi")
    .setIssuedAt()
    .setExpirationTime(`${VAPI_TOOL_TOKEN_DURATION_SECONDS}s`)
    .sign(secret);
}

export async function verifyVapiToolToken(token: string) {
  const secret = getJwtSecret();
  const { payload } = await jwtVerify(token, secret, { audience: "vapi" });

  if (!payload.sub) {
    throw new Error("Invalid Vapi tool token: missing subject");
  }

  if (payload.purpose !== "vapi_tool") {
    throw new Error("Invalid Vapi tool token: wrong purpose");
  }

  return {
    userId: payload.sub,
  };
}
