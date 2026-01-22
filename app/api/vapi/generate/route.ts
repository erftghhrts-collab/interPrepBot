import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import crypto from "crypto";

import { getDb } from "@/lib/mongodb";
import { getRandomInterviewCover } from "@/lib/utils";

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeAmount(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value.trim());
    if (Number.isFinite(n)) return n;
  }
  return NaN;
}

function normalizeTechstack(value: unknown): string[] {
  const raw = normalizeString(value);
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function sha256Hex(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({} as any));
  const type = normalizeString(body?.type);
  const role = normalizeString(body?.role);
  const level = normalizeString(body?.level);
  const userid = normalizeString(body?.userid);
  const amount = normalizeAmount(body?.amount);
  const techstackList = normalizeTechstack(body?.techstack);
  const techstack = techstackList.join(",");

  // Prevent accidental "random"/garbage interview inserts when the tool is
  // invoked early or retried with incomplete variables.
  if (!role || !type || !level || !Number.isFinite(amount) || amount <= 0) {
    return Response.json(
      {
        success: false,
        error:
          "Missing or invalid fields. Required: role, type, level, amount (number > 0).",
      },
      { status: 400 }
    );
  }

  try {
    // Dedupe within a short time window to handle Vapi retries / repeated tool calls.
    // Bucket-based key ensures only ONE interview gets created for identical inputs
    // within the same window, while still allowing a fresh one later.
    const DEDUPE_WINDOW_SECONDS = 5 * 60;
    const bucket = Math.floor(Date.now() / (DEDUPE_WINDOW_SECONDS * 1000));
    const fingerprint = JSON.stringify({ role, type, level, techstack, amount, userid });
    const payloadHash = sha256Hex(fingerprint);
    const idempotencyKey = `${userid || "anon"}:${bucket}:${payloadHash}`;

    const db = await getDb();

    // Fast path: if already created, return existing interview id (no extra LLM call).
    const existing = await db.collection("interviews").findOne(
      { idempotencyKey },
      { projection: { _id: 1 } }
    );
    if (existing?._id) {
      return Response.json(
        { success: true, interviewId: String(existing._id), deduped: true },
        { status: 200 }
      );
    }

    const { text: questions } = await generateText({
      model: google("gemini-2.0-flash-001"),
      prompt: `Prepare questions for a job interview.
        The job role is ${role}.
        The job experience level is ${level}.
        The tech stack used in the job is: ${techstack}.
        The focus between behavioural and technical questions should lean towards: ${type}.
        The amount of questions required is: ${amount}.
        Prepare only number of questions requested, no more no less. no less no more.
        Please return only the questions, without any additional text.
        Please do not generate any programming questions.
        The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters which might break the voice assistant.
        Return the questions formatted like this:
        ["Question 1", "Question 2", "Question 3"]
        
        Thank you! <3
    `,
    });
    
    let geminiJson: unknown;
    try {
      geminiJson = JSON.parse(questions);
    } catch (parseError) {
      const start = questions.indexOf("{");
      const end = questions.lastIndexOf("}");
      if (start !== -1 && end !== -1 && end > start) {
        const extracted = questions.slice(start, end + 1);
        try {
          geminiJson = JSON.parse(extracted);
        } catch (extractedParseError) {
          console.error("Failed to parse extracted Gemini JSON response", {
            parseError,
            extractedParseError,
            sample: questions.slice(0, 500),
            extractedSample: extracted.slice(0, 500),
          });
          throw extractedParseError;
        }
      } else {
        console.error("Failed to parse Gemini JSON response", {
          parseError,
          sample: questions.slice(0, 500),
        });
        throw parseError;
      }
    }

    const interview = {
      role: role,
      type: type,
      level: level,
      techstack: techstackList,
      questions: geminiJson,
      userId: userid,
      finalized: true,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date().toISOString(),
      createdAtMs: Date.now(),
      idempotencyKey,
    };

    // Atomic upsert to avoid race-condition duplicates if Vapi calls concurrently.
    const upsert = await db.collection("interviews").updateOne(
      { idempotencyKey },
      { $setOnInsert: interview },
      { upsert: true }
    );

    const interviewId = upsert.upsertedId
      ? String(upsert.upsertedId)
      : String(
          (await db.collection("interviews").findOne(
            { idempotencyKey },
            { projection: { _id: 1 } }
          ))?._id
        );

    return Response.json({ success: true, interviewId }, { status: 200 });
  } catch (error) {
    console.error("Error generating interview:", error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({ success: true, data: "Thank you!" }, { status: 200 });
}
