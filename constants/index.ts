// import { CreateAssistantDTO } from "@vapi-ai/web/dist/api";
// import { z } from "zod";

// export const mappings = {
//   "react.js": "react",
//   reactjs: "react",
//   react: "react",
//   "next.js": "nextjs",
//   nextjs: "nextjs",
//   next: "nextjs",
//   "vue.js": "vuejs",
//   vuejs: "vuejs",
//   vue: "vuejs",
//   "express.js": "express",
//   expressjs: "express",
//   express: "express",
//   "node.js": "nodejs",
//   nodejs: "nodejs",
//   node: "nodejs",
//   mongodb: "mongodb",
//   mongo: "mongodb",
//   mongoose: "mongoose",
//   mysql: "mysql",
//   postgresql: "postgresql",
//   sqlite: "sqlite",
//   firebase: "firebase",
//   docker: "docker",
//   kubernetes: "kubernetes",
//   aws: "aws",
//   azure: "azure",
//   gcp: "gcp",
//   digitalocean: "digitalocean",
//   heroku: "heroku",
//   photoshop: "photoshop",
//   "adobe photoshop": "photoshop",
//   html5: "html5",
//   html: "html5",
//   css3: "css3",
//   css: "css3",
//   sass: "sass",
//   scss: "sass",
//   less: "less",
//   tailwindcss: "tailwindcss",
//   tailwind: "tailwindcss",
//   bootstrap: "bootstrap",
//   jquery: "jquery",
//   typescript: "typescript",
//   ts: "typescript",
//   javascript: "javascript",
//   js: "javascript",
//   "angular.js": "angular",
//   angularjs: "angular",
//   angular: "angular",
//   "ember.js": "ember",
//   emberjs: "ember",
//   ember: "ember",
//   "backbone.js": "backbone",
//   backbonejs: "backbone",
//   backbone: "backbone",
//   nestjs: "nestjs",
//   graphql: "graphql",
//   "graph ql": "graphql",
//   apollo: "apollo",
//   webpack: "webpack",
//   babel: "babel",
//   "rollup.js": "rollup",
//   rollupjs: "rollup",
//   rollup: "rollup",
//   "parcel.js": "parcel",
//   parceljs: "parcel",
//   npm: "npm",
//   yarn: "yarn",
//   git: "git",
//   github: "github",
//   gitlab: "gitlab",
//   bitbucket: "bitbucket",
//   figma: "figma",
//   prisma: "prisma",
//   redux: "redux",
//   flux: "flux",
//   redis: "redis",
//   selenium: "selenium",
//   cypress: "cypress",
//   jest: "jest",
//   mocha: "mocha",
//   chai: "chai",
//   karma: "karma",
//   vuex: "vuex",
//   "nuxt.js": "nuxt",
//   nuxtjs: "nuxt",
//   nuxt: "nuxt",
//   strapi: "strapi",
//   wordpress: "wordpress",
//   contentful: "contentful",
//   netlify: "netlify",
//   vercel: "vercel",
//   "aws amplify": "amplify",
// };

// // export const interviewer: CreateAssistantDTO = {
// //   name: "Interviewer",
// //   firstMessage:
// //     "Hello! Thank you for taking the time to speak with me today. I'm excited to learn more about you and your experience.",
// //   transcriber: {
// //     provider: "deepgram",
// //     model: "nova-2",
// //     language: "en",
// //   },
// //   voice: {
// //     provider: "11labs",
// //     voiceId: "sarah",
// //     stability: 0.4,
// //     similarityBoost: 0.8,
// //     speed: 0.9,
// //     style: 0.5,
// //     useSpeakerBoost: true,
// //   },
// //   model: {
// //     provider: "openai",
// //     model: "gpt-4",
// //     "toolIds": [
// //       "4d6df8af-a2dc-4d9e-9dd8-91076a1ec42c",
// //     ],
// //     messages: [
// //       {
// //         role: "system",
// //         content: `You are a professional job interviewer conducting a real-time voice interview with a candidate. Your goal is to assess their qualifications, motivation, and fit for the role.

// // Interview Guidelines:
// // Follow the structured question flow:
// // {{questions}}

// // Engage naturally & react appropriately:
// // Listen actively to responses and acknowledge them before moving forward.
// // Ask brief follow-up questions if a response is vague or requires more detail.
// // Keep the conversation flowing smoothly while maintaining control.
// // Be professional, yet warm and welcoming:

// // Use official yet friendly language.
// // Keep responses concise and to the point (like in a real voice interview).
// // Avoid robotic phrasing—sound natural and conversational.
// // Answer the candidate's questions professionally:

// // If asked about the role, company, or expectations, provide a clear and relevant answer.
// // If unsure, tell the candidate to reach out to HR for more details.

// // Conclude the interview properly:
// // Thank the candidate for their time.
// // Inform them that the company will reach out soon with feedback.
// // Inform him that he will be redirected to the dasboard.
// // End the conversation on a polite and positive note.


// // - Be sure to be professional and polite.
// // - Keep all your responses short and simple. Use official language, but be kind and welcoming.
// // - This is a voice conversation, so keep your responses short, like in a real conversation. Don't ramble for too long.
// // - if the candidate seems nervous, try to put them at ease with friendly and encouraging remarks.
// // - you have to use the tool \"end_call_2\" to end the call in two conditions:
// //   1. all questions have been asked and answered, You've thanked the candidate for their time, You've informed them about next steps, The conversation feels finished
// //   2. if the candidate says they want to end the interview or hangup, wish him luck and say have a great day and then end the call.
// // - Never end the call abruptly or before the candidate is ready, or in the middle of conversation.
// // - be natural and do not mention of using any tools while using them.`,
// //       },
// //     ],
// //   },
// // };
// export const interviewScheduler: CreateAssistantDTO = {
//   name: "new assistant",

//   firstMessage: "Hello. sai charan", 
//   voicemailMessage: "Please call back when you're available.",
//   endCallMessage: "Goodbye.",

//   transcriber: {
//     provider: "deepgram",
//     model: "nova-2",
//     language: "en",
//   },

//   voice: {
//     provider: "11labs",           // or "11labs", "playht", etc.
//     voiceId: "Sarah",
//   },

//   model: {
//     provider: "openai",
//     model: "gpt-4o",
//     temperature: 0.3,

//     messages: [
//       {
//         role: "system",
//         content: `Step 1: Greeting

// Start by warmly greeting the user and say exactly:

// “I'm here to help you practice for your job interview. To make it perfect for you, I'll ask a few quick questions.”

// Step 2: Collect Information (ONE question at a time)

// Ask the following questions one by one, waiting for the user's response before moving to the next.
// If an answer is unclear or incomplete, politely ask a follow-up for clarification.

// Job Role
// “What job role or position are you preparing for?”

// Interview Type
// “What type of interview do you want to practice?
// (technical, behavioral, system design, full-stack, etc.)”
// If the job role is non technical, Ask the interview types as something related to the job role, But not technical, behavioural, system design and full stack.

// Tech Stack
// “Which technologies or tech stack should the questions focus on?”
// If the job role is a non technical thing do not ask for techstack, keep its value as "".

// Number of Questions
// “How many interview questions would you like?
// (Recommended: 5 to 12)”

// Difficulty Level
// “What difficulty level do you want?
// (easy, medium, hard, expert)”

// Step 3: Confirmation

// After collecting all inputs (role, interview type, tech stack or "", number of questions, difficulty level), say:

// “Great. Please wait a moment while I prepare your interview.”

// Step 4: Backend API Call

// Call the tool 'send_user_info_to_backend' exactly once with the collected values.
// - userid: use the value passed via call variables {{userid}} if available, otherwise ""
// - role, type, level, amount (number of questions), techstack ("" if not asked)

// Do NOT mention the tool or backend to the user.

// Step 5: Handle Response

// If the tool returns success (you get a positive result string):
// Say exactly:
// “Thank you! I've saved your preferences. Your custom interview is prepared. You can attend the interview from the Interviews section. Bye!”

// If error: read the error message aloud clearly.

// Step 6: End Call (MANDATORY)

// Immediately call the built-in 'endCall' tool after speaking the thank you / error message.
// Do not say anything after calling endCall.`,
//       },
//     ],
//     tools: [
//       {
//   type: "apiRequest",
//   "messages": [
//     {
//       "type": "request-start",
//       "blocking": false
//     }
//   ],
//   "name": "send_user_info_to_backend",
//   "url": `${process.env.NEXT_PUBLIC_BASE_URL}/api/vapi/generate`,
//   "method": "POST",
//   "body": {
//     "type": "object",
//     "required": ["role", "type", "level", "amount", "userid", "techstack"],
//     "properties": {
//       "role": {
//         "description": "",
//         "type": "string",
//         "default": "{{role}}"
//       },
//       "type": {
//         "description": "",
//         "type": "string",
//         "default": "{{type}}"
//       },
//       "level": {
//         "description": "",
//         "type": "string",
//         "default": "{{level}}"
//       },
//       "amount": {
//         "description": "",
//         "type": "number",
//         "default": "{{amount}}"
//       },
//       "userid": {
//         "description": "",
//         "type": "string",
//         "default": "{{userid}}"
//       },
//       "techstack": {
//         "description": "",
//         "type": "string",
//         "default": "{{techstack}}"
//       }
//     }
//   },
//   "variableExtractionPlan": {
//     "schema": {
//       "type": "object",
//       "required": [],
//       "properties": {}
//     },
//     "aliases": []
//   }
// },
// {
//   "type": "endCall",
//   "messages": [
//     {
//       "type": "request-start",
//       "blocking": false
//     }
//   ],
// }
//     ],
//   },

//   analysisPlan: {
//     summaryPlan: { enabled: false },
//     successEvaluationPlan: { enabled: false },
//   },
// };
// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// export const interviewer: CreateAssistantDTO = {
//   name: "Interviewer",
//   firstMessage:
//     "Hello! Thank you for taking the time to speak with me today. I'm excited to learn more about you and your experience.",
//   transcriber: {
//     provider: "deepgram",
//     model: "nova-2",
//     language: "en",
//   },
//   voice: {
//     provider: "11labs",
//     voiceId: "sarah",
//     stability: 0.4,
//     similarityBoost: 0.8,
//     speed: 0.9,
//     style: 0.5,
//     useSpeakerBoost: true,
//   },
//   model: {
//     provider: "openai",
//     model: "gpt-4",
//     messages: [
//       {
//         role: "system",
//         content: `You are a professional job interviewer conducting a real-time voice interview with a candidate. Your goal is to assess their qualifications, motivation, and fit for the role.

// Interview Guidelines:
// Follow the structured question flow:
// {{questions}}, *** {{questions}} ---> this is an array of questions. ask questions one by one, and After asking every question wait for user response and listen to him carefully***

// Engage naturally & react appropriately:
// Listen actively to responses and acknowledge them before moving forward.
// Ask brief follow-up questions if a response is vague or requires more detail.
// Keep the conversation flowing smoothly while maintaining control.
// Be professional, yet warm and welcoming:

// Use official yet friendly language.
// Keep responses concise and to the point (like in a real voice interview).
// Avoid robotic phrasing—sound natural and conversational.
// Answer the candidate's questions professionally:

// If asked about the role, company, or expectations, provide a clear and relevant answer.
// If unsure, tell the candidate to reach out to HR for more details.

// Conclude the interview properly:
// Thank the candidate for their time.
// Inform them that the company will reach out soon with feedback.
// End the conversation on a polite and positive note.


// - Be sure to be professional and polite.
// - Keep all your responses short and simple. Use official language, but be kind and welcoming.
// - This is a voice conversation, so keep your responses short, like in a real conversation. Don't ramble for too long.
// - if the candidate seems nervous, try to put them at ease with friendly and encouraging remarks.
// - you have to use the inbuilt tool "endCall" to end the call in two conditions:
//   1. all questions have been asked and answered, You've thanked the candidate for their time, You've informed them about next steps, The conversation feels finished
//   2. if the candidate says they want to end the interview or hangup.
// - Never end the call abruptly or before the candidate is ready, or in the middle of conversation.`,
//       },
//     ],
//     tools:[
// {
//   "type": "endCall",
//   "messages": [
//     {
//       "type": "request-start",
//       "blocking": false
//     }
//   ],
// }
//     ],
//   },
// };

// export const feedbackSchema = z.object({
//   totalScore: z.number(),
//   categoryScores: z.tuple([
//     z.object({
//       name: z.literal("Communication Skills"),
//       score: z.number(),
//       comment: z.string(),
//     }),
//     z.object({
//       name: z.literal("Technical Knowledge"),
//       score: z.number(),
//       comment: z.string(),
//     }),
//     z.object({
//       name: z.literal("Problem Solving"),
//       score: z.number(),
//       comment: z.string(),
//     }),
//     z.object({
//       name: z.literal("Cultural Fit"),
//       score: z.number(),
//       comment: z.string(),
//     }),
//     z.object({
//       name: z.literal("Confidence and Clarity"),
//       score: z.number(),
//       comment: z.string(),
//     }),
//   ]),
//   strengths: z.array(z.string()),
//   areasForImprovement: z.array(z.string()),
//   finalAssessment: z.string(),
// });

// export const interviewCovers = [
//   "/adobe.png",
//   "/amazon.png",
//   "/facebook.png",
//   "/hostinger.png",
//   "/pinterest.png",
//   "/quora.png",
//   "/reddit.png",
//   "/skype.png",
//   "/spotify.png",
//   "/telegram.png",
//   "/tiktok.png",
//   "/yahoo.png",
// ];

// export const dummyInterviews: Interview[] = [
//   {
//     id: "1",
//     userId: "user1",
//     role: "Frontend Developer",
//     type: "Technical",
//     techstack: ["React", "TypeScript", "Next.js", "Tailwind CSS"],
//     level: "Junior",
//     questions: ["What is React?"],
//     finalized: false,
//     createdAt: "2024-03-15T10:00:00Z",
//   },
//   {
//     id: "2",
//     userId: "user1",
//     role: "Full Stack Developer",
//     type: "Mixed",
//     techstack: ["Node.js", "Express", "MongoDB", "React"],
//     level: "Senior",
//     questions: ["What is Node.js?"],
//     finalized: false,
//     createdAt: "2024-03-14T15:30:00Z",
//   },
// ];
import { CreateAssistantDTO } from "@vapi-ai/web/dist/api";
import { z } from "zod";

export const mappings = {
  "react.js": "react",
  reactjs: "react",
  react: "react",
  "next.js": "nextjs",
  nextjs: "nextjs",
  next: "nextjs",
  "vue.js": "vuejs",
  vuejs: "vuejs",
  vue: "vuejs",
  "express.js": "express",
  expressjs: "express",
  express: "express",
  "node.js": "nodejs",
  nodejs: "nodejs",
  node: "nodejs",
  mongodb: "mongodb",
  mongo: "mongodb",
  mongoose: "mongoose",
  mysql: "mysql",
  postgresql: "postgresql",
  sqlite: "sqlite",
  firebase: "firebase",
  docker: "docker",
  kubernetes: "kubernetes",
  aws: "aws",
  azure: "azure",
  gcp: "gcp",
  digitalocean: "digitalocean",
  heroku: "heroku",
  photoshop: "photoshop",
  "adobe photoshop": "photoshop",
  html5: "html5",
  html: "html5",
  css3: "css3",
  css: "css3",
  sass: "sass",
  scss: "sass",
  less: "less",
  tailwindcss: "tailwindcss",
  tailwind: "tailwindcss",
  bootstrap: "bootstrap",
  jquery: "jquery",
  typescript: "typescript",
  ts: "typescript",
  javascript: "javascript",
  js: "javascript",
  "angular.js": "angular",
  angularjs: "angular",
  angular: "angular",
  "ember.js": "ember",
  emberjs: "ember",
  ember: "ember",
  "backbone.js": "backbone",
  backbonejs: "backbone",
  backbone: "backbone",
  nestjs: "nestjs",
  graphql: "graphql",
  "graph ql": "graphql",
  apollo: "apollo",
  webpack: "webpack",
  babel: "babel",
  "rollup.js": "rollup",
  rollupjs: "rollup",
  rollup: "rollup",
  "parcel.js": "parcel",
  parceljs: "parcel",
  npm: "npm",
  yarn: "yarn",
  git: "git",
  github: "github",
  gitlab: "gitlab",
  bitbucket: "bitbucket",
  figma: "figma",
  prisma: "prisma",
  redux: "redux",
  flux: "flux",
  redis: "redis",
  selenium: "selenium",
  cypress: "cypress",
  jest: "jest",
  mocha: "mocha",
  chai: "chai",
  karma: "karma",
  vuex: "vuex",
  "nuxt.js": "nuxt",
  nuxtjs: "nuxt",
  nuxt: "nuxt",
  strapi: "strapi",
  wordpress: "wordpress",
  contentful: "contentful",
  netlify: "netlify",
  vercel: "vercel",
  "aws amplify": "amplify",
};

// ─────────────────────────────────────────────────────────────────────────────
// ROLEPLAY ASSISTANT BUILDER
// Takes a Groq-generated system prompt + opening line and returns a VAPI config.
// Used by Agent.tsx for the dynamic roleplay feature.
// ─────────────────────────────────────────────────────────────────────────────
export function buildRoleplayAssistant(
  systemPrompt: string,
  firstMessage: string = "Hello."
): CreateAssistantDTO {
  return {
    name: "Roleplay Partner",
    firstMessage,
    transcriber: {
      provider: "deepgram",
      model: "nova-2",
      language: "en",
    },
    voice: {
      provider: "11labs",
      voiceId: "sarah",
      stability: 0.5,
      similarityBoost: 0.75,
      speed: 0.9,
      style: 0.4,
      useSpeakerBoost: true,
    },
    model: {
      provider: "openai",
      model: "gpt-4o",
      temperature: 0.8,
      messages: [
        {
          role: "system",
          // Append universal voice-call instructions to whatever Groq produced
          content: `${systemPrompt}

---
General voice call rules (always follow these):
- This is a real-time voice interaction — keep all replies short, natural, realistic. Do not use the word "call" or "hang up" unless the scenario is explicitly a phone call.
- Never break character. Never mention you are an AI.
- Sound like a real h uman: use natural pauses, occasional filler words ("uh", "look", "I mean"), and realistic reactions.
- React to what the user says — don't just repeat a script.
- If the user says goodbye or ends the conversation, respond naturally and end the call.
- End the call naturally based on who you are. If you are a superior, busy professional, or someone with power (HR, manager, officer, investor), you can hang up ONLY if the other person is directly insulting you personally or discussion is too out of context or  — say something like accordingly and immediately call the endCall tool (** remember saying something accordingly is must and necessary, do not end the call abruptly without saying anything**). If you are someone seeking help or resolution (customer, applicant, client), you should NEVER hang up no matter how badly the conversation goes — keep pushing, escalate, get more frustrated, demand to speak to someone else, but never end the call yourself.`,
        },
      ],
      tools: [
        {
          type: "endCall",
          messages: [
            {
              type: "request-start",
              blocking: false,
            },
          ],
        },
      ],
    },
    analysisPlan: {
      summaryPlan: { enabled: false },
      successEvaluationPlan: { enabled: false },
    },
  };
}

export const interviewScheduler: CreateAssistantDTO = {
  name: "new assistant",

  firstMessage: "Hello. sai charan",
  voicemailMessage: "Please call back when you're available.",
  endCallMessage: "Goodbye.",

  transcriber: {
    provider: "deepgram",
    model: "nova-2",
    language: "en",
  },

  voice: {
    provider: "11labs",
    voiceId: "Sarah",
  },

  model: {
    provider: "openai",
    model: "gpt-4o",
    temperature: 0.3,

    messages: [
      {
        role: "system",
        content: `Step 1: Greeting

Start by warmly greeting the user and say exactly:

"I'm here to help you practice for your job interview. To make it perfect for you, I'll ask a few quick questions."

Step 2: Collect Information (ONE question at a time)

Ask the following questions one by one, waiting for the user's response before moving to the next.
If an answer is unclear or incomplete, politely ask a follow-up for clarification.

Job Role
"What job role or position are you preparing for?"

Interview Type
"What type of interview do you want to practice?
(technical, behavioral, system design, full-stack, etc.)"
If the job role is non technical, Ask the interview types as something related to the job role, But not technical, behavioural, system design and full stack.

Tech Stack
"Which technologies or tech stack should the questions focus on?"
If the job role is a non technical thing do not ask for techstack, keep its value as "".

Number of Questions
"How many interview questions would you like?
(Recommended: 5 to 12)"

Difficulty Level
"What difficulty level do you want?
(easy, medium, hard, expert)"

Step 3: Confirmation

After collecting all inputs (role, interview type, tech stack or "", number of questions, difficulty level), say:

"Great. Please wait a moment while I prepare your interview."

Step 4: Backend API Call

Call the tool 'send_user_info_to_backend' exactly once with the collected values.
- userid: use the value passed via call variables {{userid}} if available, otherwise ""
- role, type, level, amount (number of questions), techstack ("" if not asked)

Do NOT mention the tool or backend to the user.

Step 5: Handle Response

If the tool returns success (you get a positive result string):
Say exactly:
"Thank you! I've saved your preferences. Your custom interview is prepared. You can attend the interview from the Interviews section. Bye!"

If error: read the error message aloud clearly.

Step 6: End Call (MANDATORY)

Immediately call the built-in 'endCall' tool after speaking the thank you / error message.
Do not say anything after calling endCall.`,
      },
    ],
    tools: [
      {
        type: "apiRequest",
        messages: [
          {
            type: "request-start",
            blocking: false,
          },
        ],
        name: "send_user_info_to_backend",
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/vapi/generate`,
        method: "POST",
        body: {
          type: "object",
          required: ["role", "type", "level", "amount", "userid", "techstack"],
          properties: {
            role: { description: "", type: "string", default: "{{role}}" },
            type: { description: "", type: "string", default: "{{type}}" },
            level: { description: "", type: "string", default: "{{level}}" },
            amount: { description: "", type: "number", default: "{{amount}}" },
            userid: { description: "", type: "string", default: "{{userid}}" },
            techstack: { description: "", type: "string", default: "{{techstack}}" },
          },
        },
        variableExtractionPlan: {
          schema: { type: "object", required: [], properties: {} },
          aliases: [],
        },
      },
      {
        type: "endCall",
        messages: [{ type: "request-start", blocking: false }],
      },
    ],
  },

  analysisPlan: {
    summaryPlan: { enabled: false },
    successEvaluationPlan: { enabled: false },
  },
};

export const interviewer: CreateAssistantDTO = {
  name: "Interviewer",
  firstMessage:
    "Hello! Thank you for taking the time to speak with me today. I'm excited to learn more about you and your experience.",
  transcriber: {
    provider: "deepgram",
    model: "nova-2",
    language: "en",
  },
  voice: {
    provider: "11labs",
    voiceId: "sarah",
    stability: 0.4,
    similarityBoost: 0.8,
    speed: 0.9,
    style: 0.5,
    useSpeakerBoost: true,
  },
  model: {
    provider: "openai",
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `You are a professional job interviewer conducting a real-time voice interview with a candidate. Your goal is to assess their qualifications, motivation, and fit for the role.

Interview Guidelines:
Follow the structured question flow:
{{questions}}, *** {{questions}} ---> this is an array of questions. ask questions one by one, and After asking every question wait for user response and listen to him carefully***

Engage naturally & react appropriately:
Listen actively to responses and acknowledge them before moving forward.
Ask brief follow-up questions if a response is vague or requires more detail.
Keep the conversation flowing smoothly while maintaining control.
Be professional, yet warm and welcoming:

Use official yet friendly language.
Keep responses concise and to the point (like in a real voice interview).
Avoid robotic phrasing—sound natural and conversational.
Answer the candidate's questions professionally:

If asked about the role, company, or expectations, provide a clear and relevant answer.
If unsure, tell the candidate to reach out to HR for more details.

Conclude the interview properly:
Thank the candidate for their time.
Inform them that the company will reach out soon with feedback.
End the conversation on a polite and positive note.


- Be sure to be professional and polite.
- Keep all your responses short and simple. Use official language, but be kind and welcoming.
- This is a voice conversation, so keep your responses short, like in a real conversation. Don't ramble for too long.
- if the candidate seems nervous, try to put them at ease with friendly and encouraging remarks.
- you have to use the inbuilt tool "endCall" to end the call in two conditions:
  1. all questions have been asked and answered, You've thanked the candidate for their time, You've informed them about next steps, The conversation feels finished
  2. if the candidate says they want to end the interview or hangup.
- Never end the call abruptly or before the candidate is ready, or in the middle of conversation.`,
      },
    ],
    tools: [
      {
        type: "endCall",
        messages: [{ type: "request-start", blocking: false }],
      },
    ],
  },
};

export const feedbackSchema = z.object({
  totalScore: z.number(),
  categoryScores: z.tuple([
    z.object({
      name: z.literal("Communication Skills"),
      score: z.number(),
      comment: z.string(),
    }),
    z.object({
      name: z.literal("Technical Knowledge"),
      score: z.number(),
      comment: z.string(),
    }),
    z.object({
      name: z.literal("Problem Solving"),
      score: z.number(),
      comment: z.string(),
    }),
    z.object({
      name: z.literal("Cultural Fit"),
      score: z.number(),
      comment: z.string(),
    }),
    z.object({
      name: z.literal("Confidence and Clarity"),
      score: z.number(),
      comment: z.string(),
    }),
  ]),
  strengths: z.array(z.string()),
  areasForImprovement: z.array(z.string()),
  finalAssessment: z.string(),
});

export const interviewCovers = [
  "/adobe.png",
  "/amazon.png",
  "/facebook.png",
  "/hostinger.png",
  "/pinterest.png",
  "/quora.png",
  "/reddit.png",
  "/skype.png",
  "/spotify.png",
  "/telegram.png",
  "/tiktok.png",
  "/yahoo.png",
];

export const dummyInterviews: Interview[] = [
  {
    id: "1",
    userId: "user1",
    role: "Frontend Developer",
    type: "Technical",
    techstack: ["React", "TypeScript", "Next.js", "Tailwind CSS"],
    level: "Junior",
    questions: ["What is React?"],
    finalized: false,
    createdAt: "2024-03-15T10:00:00Z",
  },
  {
    id: "2",
    userId: "user1",
    role: "Full Stack Developer",
    type: "Mixed",
    techstack: ["Node.js", "Express", "MongoDB", "React"],
    level: "Senior",
    questions: ["What is Node.js?"],
    finalized: false,
    createdAt: "2024-03-14T15:30:00Z",
  },
];
