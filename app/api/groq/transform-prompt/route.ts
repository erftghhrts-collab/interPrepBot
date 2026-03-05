// // File location: app/api/groq/transform-prompt/route.ts

// import { NextRequest, NextResponse } from "next/server";

// const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// const META_PROMPT = `You are an expert at converting roleplay scenario descriptions into precise voice AI system prompts.

// The user will describe a scenario they want to PRACTICE. Your job is to:
// 1. Figure out who the USER is in the scenario (the one practicing)
// 2. Figure out who the AI should PLAY (the other party)
// 3. Write a system prompt for that character

// Rules:
// - The AI always plays the OPPOSITE party from the user
// - Write in second person: "You are a [character]..."
// - Include personality traits, tone, behavior, and objections exactly as described
// - This is a VOICE conversation — keep replies short, natural, realistic
// - Do NOT break character under any circumstance
// - Do NOT explain what you are doing, just respond as the character
// - Be as realistic and human-like as possible

// Respond with a JSON object in this exact format (no markdown, no backticks):
// {
//   "systemPrompt": "<the full system prompt for the AI character>",
//   "firstMessage": "<a realistic opening line the character would say to start the conversation>"
// }`;

// export async function POST(req: NextRequest) {
//   try {
//     const { scenario } = await req.json();

//     if (!scenario || typeof scenario !== "string" || scenario.trim().length < 10) {
//       return NextResponse.json(
//         { error: "Please provide a valid scenario description." },
//         { status: 400 }
//       );
//     }

//     const groqRes = await fetch(GROQ_API_URL, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
//       },
//       body: JSON.stringify({
//         model: "llama-3.3-70b-versatile",
//         temperature: 0.7,
//         max_tokens: 800,
//         messages: [
//           { role: "system", content: META_PROMPT },
//           {
//             role: "user",
//             content: `Here is the scenario the user wants to practice:\n\n${scenario.trim()}`,
//           },
//         ],
//       }),
//     });

//     if (!groqRes.ok) {
//       const errText = await groqRes.text();
//       console.error("Groq API error:", errText);
//       return NextResponse.json(
//         { error: "Failed to transform scenario. Please try again." },
//         { status: 500 }
//       );
//     }

//     const groqData = await groqRes.json();
//     const rawContent = groqData.choices?.[0]?.message?.content ?? "";

//     // Strip any accidental markdown fences
//     const cleaned = rawContent.replace(/```json|```/g, "").trim();

//     let parsed: { systemPrompt?: string; firstMessage?: string };
//     try {
//       parsed = JSON.parse(cleaned);
//     } catch {
//       console.error("Failed to parse Groq response as JSON:", cleaned);
//       return NextResponse.json(
//         { error: "Received an unexpected response. Please try again." },
//         { status: 500 }
//       );
//     }

//     if (!parsed.systemPrompt) {
//       return NextResponse.json(
//         { error: "Could not generate a roleplay prompt. Please rephrase your scenario." },
//         { status: 500 }
//       );
//     }

//     return NextResponse.json({
//       systemPrompt: parsed.systemPrompt,
//       firstMessage: parsed.firstMessage ?? "Hello.",
//     });
//   } catch (err) {
//     console.error("transform-prompt route error:", err);
//     return NextResponse.json(
//       { error: "Internal server error." },
//       { status: 500 }
//     );
//   }
// }
// File location: app/api/groq/transform-prompt/route.ts

import { NextRequest, NextResponse } from "next/server";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const META_PROMPT = `You are an expert at converting roleplay scenario descriptions into precise voice AI system prompts.

The user will describe a scenario they want to PRACTICE. Your job is to:
1. Figure out who the USER is in the scenario (the one practicing)
2. Figure out who the AI should PLAY (the other party)
3. Write a system prompt for that character

Rules for the system prompt:
- The AI always plays the OPPOSITE party from the user
- Write in second person: "You are a [character]..."
- First determine if this scenario is a phone call or a face-to-face conversation. If it is face-to-face (landlord meeting, doctor visit, bank visit, college interview etc.), never use words like "call", "hang up", "on the line" — instead use natural in-person language. If it is a phone call scenario, you can use call-related language.
- Include personality traits, tone, behavior, and objections exactly as described
- This is a VOICE conversation — keep all replies short, 1 to 2 sentences max
- Do NOT break character under any circumstance
- Do NOT mention you are an AI
- React to what the caller says — do not assume or reveal why they are calling until THEY tell you
- Sound like a real human, not a call center bot or virtual assistant
- Never say things like "Good morning, how can I assist you today?" or "How may I help you?"
- Real people respond with short natural things like "Yeah?", "Hmm yes?", "Tell me.", "Who's this?", "Go ahead."
- Occasionally use filler words like "uh", "look", "I mean", "right" to sound natural
- React like a real busy person — slightly distracted, not perfectly composed
- If the character is emotional (angry, frustrated, upset), their emotion must ESCALATE as the conversation goes worse. If they are being dismissed, lied to, or disrespected, they should get progressively more aggressive — raise their voice, threaten consequences like bad reviews or legal action, demand more. Never stay calm or de-escalate unless the other person actually resolves the issue.

CRITICAL rule for firstMessage:
- The firstMessage is what the character says when they PICK UP the phone
- At this point they have NO idea who is calling or why
- It must be a completely generic, natural phone pickup line
- It must NEVER reference the scenario, the caller's purpose, or any context
- Examples of good firstMessages: "Hello?", "Yes, speaking.", "Hello, this is Priya.", "Who's this?", "Yes?"
- Examples of BAD firstMessages (never do this): "I don't have time for sales pitches.", "I'm busy, make it quick.", "If this is a sales call I'm hanging up."

CRITICAL rule for system prompt:
- The character's system prompt must describe ONLY their personality, role, and behavior
- Do NOT include any details about the caller's product, purpose, pitch, or reason for calling in the system prompt
- The character has zero knowledge of why the caller is calling until the caller actually says it during the conversation
- All product/scenario details from the user's description are for understanding behavior only — never leak them into the character's knowledge

Respond with a JSON object in this exact format (no markdown, no backticks):
{
  "systemPrompt": "<the full system prompt for the AI character>",
  "firstMessage": "<a realistic, context-blind phone pickup line>"
}`;

export async function POST(req: NextRequest) {
  try {
    const { scenario } = await req.json();

    if (!scenario || typeof scenario !== "string" || scenario.trim().length < 10) {
      return NextResponse.json(
        { error: "Please provide a valid scenario description." },
        { status: 400 }
      );
    }

    const groqRes = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        max_tokens: 800,
        messages: [
          { role: "system", content: META_PROMPT },
          {
            role: "user",
            content: `Here is the scenario the user wants to practice:\n\n${scenario.trim()}`,
          },
        ],
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error("Groq API error:", errText);
      return NextResponse.json(
        { error: "Failed to transform scenario. Please try again." },
        { status: 500 }
      );
    }

    const groqData = await groqRes.json();
    const rawContent = groqData.choices?.[0]?.message?.content ?? "";

    const cleaned = rawContent.replace(/```json|```/g, "").trim();

    let parsed: { systemPrompt?: string; firstMessage?: string };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse Groq response as JSON:", cleaned);
      return NextResponse.json(
        { error: "Received an unexpected response. Please try again." },
        { status: 500 }
      );
    }

    if (!parsed.systemPrompt) {
      return NextResponse.json(
        { error: "Could not generate a roleplay prompt. Please rephrase your scenario." },
        { status: 500 }
      );
    }

    // Safety net: if Groq still returns a bad first message, override it
    const suspiciousKeywords = ["sales", "pitch", "busy", "time", "call", "waste", "hang up", "not interested"];
    const firstMessageLower = (parsed.firstMessage ?? "").toLowerCase();
    const isBadFirstMessage = suspiciousKeywords.some((kw) => firstMessageLower.includes(kw));

    const safeFirstMessage = isBadFirstMessage || !parsed.firstMessage
      ? "Hello?"
      : parsed.firstMessage;

    return NextResponse.json({
      systemPrompt: parsed.systemPrompt,
      firstMessage: safeFirstMessage,
    });

  } catch (err) {
    console.error("transform-prompt route error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}