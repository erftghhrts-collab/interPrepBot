"use server";

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";

import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { feedbackSchema } from "@/constants";

type InterviewDoc = {
  _id: ObjectId;
  role: string;
  level: string;
  questions: string[];
  techstack: string[];
  createdAt: string;
  userId: string;
  type: string;
  finalized: boolean;
  coverImage?: string;
};

type FeedbackDoc = {
  _id?: ObjectId;
  interviewId: string;
  userId: string;
  totalScore: number;
  categoryScores: Array<{ name: string; score: number; comment: string }>;
  strengths: string[];
  areasForImprovement: string[];
  finalAssessment: string;
  createdAt: string;
};

export async function createFeedback(params: CreateFeedbackParams) {
  const { interviewId, userId, transcript, feedbackId } = params;

  try {
    const formattedTranscript = transcript
      .map(
        (sentence: { role: string; content: string }) =>
          `- ${sentence.role}: ${sentence.content}\n`
      )
      .join("");

    const model = google("gemini-2.0-flash-001", {
      // Keep this off for Gemini + generateObject; enabling it triggers a response_schema payload
      // that fails with certain Zod constructs (e.g., tuples/arrays) on the Google API.
      structuredOutputs: false,
    });

    const schemaAndRules = `
Return ONLY a valid JSON object (no markdown, no backticks, no extra text) that matches this exact structure:
{
  "totalScore": number,
  "categoryScores": [
    { "name": "Communication Skills", "score": number, "comment": string },
    { "name": "Technical Knowledge", "score": number, "comment": string },
    { "name": "Problem Solving", "score": number, "comment": string },
    { "name": "Cultural Fit", "score": number, "comment": string },
    { "name": "Confidence and Clarity", "score": number, "comment": string }
  ],
  "strengths": string[],
  "areasForImprovement": string[],
  "finalAssessment": string
}

Rules:
- Use ONLY those 5 categories, in that exact order.
- Each score must be between 0 and 100.
- If the interview ended early, reflect that in the comments and scoring.
`;

    const evaluationPrompt = `
You are an AI interviewer analyzing a mock interview.

${schemaAndRules}

Transcript:
${formattedTranscript}
`;

    let object: any;
    try {
      ({ object } = await generateObject({
        model,
        schema: feedbackSchema,
        prompt: evaluationPrompt,
        system:
          "You are a professional interviewer. Return only valid JSON that matches the requested schema.",
      }));
    } catch (error) {
      // If the model returns almost-JSON (common with early hangups), do one repair attempt.
      const rawText =
        (error as any)?.text ??
        (error as any)?.cause?.text ??
        (error as any)?.response?.text;

      if (typeof rawText !== "string" || rawText.trim().length === 0) {
        throw error;
      }

      ({ object } = await generateObject({
        model,
        schema: feedbackSchema,
        prompt: `
You will be given an INVALID JSON attempt for interview feedback.
Fix it and return ONLY the corrected, valid JSON object that matches the exact structure and rules below.

Required structure and rules:
${schemaAndRules}

Invalid JSON attempt (fix this):
${rawText}
`,
        system:
          "You are a strict JSON repair tool. Output only corrected JSON.",
      }));
    }

    const feedback: Omit<FeedbackDoc, "_id"> = {
      interviewId: interviewId,
      userId: userId,
      totalScore: object.totalScore,
      categoryScores: object.categoryScores,
      strengths: object.strengths,
      areasForImprovement: object.areasForImprovement,
      finalAssessment: object.finalAssessment,
      createdAt: new Date().toISOString(),
    };

    const db = await getDb();
    const feedbackCollection = db.collection<FeedbackDoc>("feedback");

    if (feedbackId && ObjectId.isValid(feedbackId)) {
      await feedbackCollection.updateOne(
        { _id: new ObjectId(feedbackId) },
        { $set: feedback },
        { upsert: true }
      );
      return { success: true, feedbackId };
    }

    const result = await feedbackCollection.insertOne(feedback);
    return { success: true, feedbackId: String(result.insertedId) };
  } catch (error) {
    console.error("Error saving feedback:", error);

    // Fallback behavior:
    // If the AI model fails (missing API key, quota, transient errors, malformed output),
    // still persist a minimal feedback record so the interview can complete gracefully.
    try {
      const messageCount = Array.isArray(transcript) ? transcript.length : 0;
      const endedEarly = messageCount < 6;

      const feedback: Omit<FeedbackDoc, "_id"> = {
        interviewId,
        userId,
        totalScore: 0,
        categoryScores: [
          {
            name: "Communication Skills",
            score: 0,
            comment: endedEarly
              ? "Interview ended early; insufficient transcript to evaluate communication."
              : "Unable to generate AI evaluation; communication not scored.",
          },
          {
            name: "Technical Knowledge",
            score: 0,
            comment: endedEarly
              ? "Interview ended early; insufficient transcript to evaluate technical knowledge."
              : "Unable to generate AI evaluation; technical knowledge not scored.",
          },
          {
            name: "Problem Solving",
            score: 0,
            comment: endedEarly
              ? "Interview ended early; insufficient transcript to evaluate problem solving."
              : "Unable to generate AI evaluation; problem solving not scored.",
          },
          {
            name: "Cultural Fit",
            score: 0,
            comment: endedEarly
              ? "Interview ended early; insufficient transcript to evaluate cultural fit."
              : "Unable to generate AI evaluation; cultural fit not scored.",
          },
          {
            name: "Confidence and Clarity",
            score: 0,
            comment: endedEarly
              ? "Interview ended early; insufficient transcript to evaluate confidence and clarity."
              : "Unable to generate AI evaluation; confidence and clarity not scored.",
          },
        ],
        strengths: endedEarly
          ? ["Interview started successfully"]
          : ["Completed the interview session"],
        areasForImprovement: endedEarly
          ? ["Complete more of the interview to receive detailed feedback"]
          : ["Retry feedback generation to receive AI-scored feedback"],
        finalAssessment: endedEarly
          ? "Feedback generation fell back to a minimal record because the interview ended early or the evaluation service was unavailable."
          : "Feedback generation fell back to a minimal record because the evaluation service was unavailable.",
        createdAt: new Date().toISOString(),
      };

      const db = await getDb();
      const feedbackCollection = db.collection<FeedbackDoc>("feedback");

      if (feedbackId && ObjectId.isValid(feedbackId)) {
        await feedbackCollection.updateOne(
          { _id: new ObjectId(feedbackId) },
          { $set: feedback },
          { upsert: true }
        );
        return { success: true, feedbackId, fallback: true };
      }

      const result = await feedbackCollection.insertOne(feedback);
      return {
        success: true,
        feedbackId: String(result.insertedId),
        fallback: true,
      };
    } catch (persistError) {
      console.error("Failed to persist fallback feedback:", persistError);
      return { success: false };
    }
  }
}

export async function getInterviewById(id: string): Promise<Interview | null> {
  if (!ObjectId.isValid(id)) return null;
  const db = await getDb();
  const interview = await db
    .collection<InterviewDoc>("interviews")
    .findOne({ _id: new ObjectId(id) });

  if (!interview) return null;

  const { _id, ...rest } = interview;
  return {
    id: String(_id),
    ...rest,
  } as Interview;
}

export async function getFeedbackByInterviewId(
  params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
  const { interviewId, userId } = params;

  const db = await getDb();
  const feedback = await db
    .collection<FeedbackDoc>("feedback")
    .find({ interviewId, userId })
    .sort({ createdAt: -1 })
    .limit(1)
    .next();

  if (!feedback) return null;

  const { _id, ...rest } = feedback;
  return {
    id: String(_id),
    ...rest,
  } as Feedback;
}

export async function getLatestInterviews(
  params: GetLatestInterviewsParams
): Promise<Interview[] | null> {
  const { userId, limit = 20 } = params;

  const db = await getDb();
  const interviews = await db
    .collection<InterviewDoc>("interviews")
    .find({ finalized: true, userId: { $ne: userId } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  return interviews.map((interview) => {
    const { _id, ...rest } = interview;
    return { id: String(_id), ...rest };
  }) as Interview[];
}

export async function getInterviewsByUserId(
  userId: string
): Promise<Interview[] | null> {
  const db = await getDb();
  const interviews = await db
    .collection<InterviewDoc>("interviews")
    .find({ userId })
    .sort({ createdAt: -1 })
    .toArray();

  return interviews.map((interview) => {
    const { _id, ...rest } = interview;
    return { id: String(_id), ...rest };
  }) as Interview[];
}

export async function getCompletedInterviewsByUserId(
  userId: string,
  limit = 50
): Promise<Interview[] | null> {
  const db = await getDb();

  const feedbacks = await db
    .collection<FeedbackDoc>("feedback")
    .find({ userId })
    .project({ interviewId: 1, createdAt: 1 })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  if (feedbacks.length === 0) return [];

  const orderedUniqueInterviewIds: string[] = [];
  const seen = new Set<string>();
  for (const fb of feedbacks) {
    const interviewId = fb.interviewId;
    if (!interviewId || seen.has(interviewId)) continue;
    seen.add(interviewId);
    orderedUniqueInterviewIds.push(interviewId);
  }

  const objectIds = orderedUniqueInterviewIds
    .filter((id) => ObjectId.isValid(id))
    .map((id) => new ObjectId(id));

  if (objectIds.length === 0) return [];

  const interviews = await db
    .collection<InterviewDoc>("interviews")
    .find({ _id: { $in: objectIds } })
    .toArray();

  const byId = new Map(
    interviews.map((interview) => {
      const { _id, ...rest } = interview;
      return [String(_id), { id: String(_id), ...rest } as Interview] as const;
    })
  );

  return orderedUniqueInterviewIds
    .map((id) => byId.get(id))
    .filter((x): x is Interview => Boolean(x));
}
