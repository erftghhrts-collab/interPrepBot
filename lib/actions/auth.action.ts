"use server";

import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { cookies } from "next/headers";

import { getDb } from "@/lib/mongodb";
import {
  createSessionToken,
  getSessionDurationSeconds,
  verifySessionToken,
} from "@/lib/session";

const SESSION_COOKIE_NAME = "session";

type UserDoc = {
  _id: ObjectId;
  name: string;
  email: string;
  emailLower: string;
  passwordHash: string;
  profileURL?: string;
  callId?: string;
  callIdUpdatedAt?: string;
  createdAt: string;
};

async function setSessionCookie(userId: string) {
  const cookieStore = await cookies();
  const maxAge = getSessionDurationSeconds();
  const sessionToken = await createSessionToken(userId);

  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    maxAge,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
  });
}

export async function signUp(params: SignUpParams) {
  const { name, email, password } = params;

  try {
    const db = await getDb();
    const users = db.collection<UserDoc>("users");

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await users.findOne({ emailLower: normalizedEmail });

    if (existingUser) {
      return {
        success: false,
        message: "User already exists. Please sign in.",
      };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await users.insertOne({
      name,
      email,
      emailLower: normalizedEmail,
      passwordHash,
      createdAt: new Date().toISOString(),
    });

    return {
      success: true,
      message: "Account created successfully. Please sign in.",
    };
  } catch (error) {
    console.error("Error creating user:", error);
    return {
      success: false,
      message: "Failed to create account. Please try again.",
    };
  }
}

export async function signIn(params: SignInParams) {
  const { email, password } = params;

  try {
    const db = await getDb();
    const users = db.collection<UserDoc>("users");

    const normalizedEmail = email.trim().toLowerCase();
    const user = await users.findOne({ emailLower: normalizedEmail });

    if (!user) {
      return {
        success: false,
        message: "User does not exist. Create an account.",
      };
    }

    if (!user.passwordHash) {
      return {
        success: false,
        message: "Account is misconfigured. Please sign up again.",
      };
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return {
        success: false,
        message: "Invalid email or password.",
      };
    }

    await setSessionCookie(String(user._id));

    return {
      success: true,
      message: "Signed in successfully.",
    };
  } catch (error) {
    console.error("Error signing in:", error);
    return {
      success: false,
      message: "Failed to log into account. Please try again.",
    };
  }
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) return null;

  try {
    const { userId } = await verifySessionToken(sessionToken);
    if (!ObjectId.isValid(userId)) return null;

    const db = await getDb();
    const users = db.collection<UserDoc>("users");
    const user = await users.findOne({ _id: new ObjectId(userId) });

    if (!user) return null;

    return {
      id: String(user._id),
      name: user.name,
      email: user.email,
      profileURL: user.profileURL,
    } as User;
  } catch {
    return null;
  }
}

export async function isAuthenticated() {
  const user = await getCurrentUser();
  return !!user;
}
