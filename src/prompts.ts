import { UserContext } from "./openAI/openAI.service";
import { User } from "./user/user.schema";
import { getToneInstruction, getUserDetailsExcerpt, languageInstruction } from "./utils";

// 🔹 Helper: Build extra context block only if provided
const formatExtraContext = (extraContext?: { topKeywords?: string[]; cooccurrence?: any; memory?: string }) => {
  if (!extraContext) return "";
  return `Extra context:
- Top Keywords: ${extraContext.topKeywords?.join(", ") || "none"}
- Co-occurring Keywords: ${JSON.stringify(extraContext.cooccurrence || {})}
- Semantic Memory: ${extraContext.memory || "none"}`;
};

// 🔹 Recipe Prompt
export const getRecipePrompt = (
  userMessage: string,
  userDetails: UserContext,
  extraContext?: { topKeywords?: string[]; cooccurrence?: any }
) => {
  const userInfo = getUserDetailsExcerpt(userDetails);
  return `You are a helpful AI assistant. ${getToneInstruction(userInfo.age, userInfo.sex)} ${languageInstruction}

User details (JSON):
${JSON.stringify(userInfo)}

${extraContext ? formatExtraContext(extraContext) : ""}

User request: "${userMessage}"

Instructions:
- Suggest a healthy recipe tailored to the user’s goals, diet, and allergies.
- Keep ingredients simple and steps clear.
- Identify up to 5 **meaningful** input/output keywords (exclude generic/filler words).

Return ONLY valid JSON:
{
  "recipe": {
    "name": string,
    "ingredients": [string],
    "steps": [string],
    "nutrition": {
      "calories": number,
      "protein": string,
      "carbs": string,
      "fat": string
    }
  },
  "input_keywords": [string],
  "output_keywords": [string]
}`;
};

// 🔹 Chat With Context Prompt
export const getChatWithContextPrompt = (
  userDetails: UserContext,
  userMessage: string,
  extraContext?: { topKeywords?: string[]; cooccurrence?: any; memory?: string }
) => {
  const userInfo = getUserDetailsExcerpt(userDetails);
  return `You are a helpful AI assistant. ${getToneInstruction(userInfo.age, userInfo.sex)} ${languageInstruction}

User details (JSON):
${JSON.stringify(userInfo)}

${extraContext ? formatExtraContext(extraContext) : ""}

User request: "${userMessage}"

Instructions:
- Keep answers short, friendly, and encouraging, with gentle health tips.
- Mention helpful products lightly only if relevant.
- Only respond if request is **health/wellness related**, else return null.
- Always output exactly 5 input/output keywords (exclude generic/filler words).

Return ONLY valid JSON:
{
  "response": string | null,
  "input_keywords": [string],
  "output_keywords": [string]
}`;
};

// 🔹 Daily Log + Tip Prompt
export const getDailyLogAndTipPrompt = (
  tipType: "morning" | "evening",
  userDetails: User,
  question: string,
  userAnswer: string,
  extraContext?: { topKeywords?: string[]; cooccurrence?: any }
) => {
  const userInfo = getUserDetailsExcerpt(userDetails);
  return `You are a helpful AI health assistant. ${getToneInstruction(userInfo.age, userInfo.sex)} ${languageInstruction}

User details (JSON):
${JSON.stringify(userInfo)}

${extraContext ? formatExtraContext(extraContext) : ""}

Tip Type: ${tipType.toUpperCase()}

Question: "${question}"
Answer: "${userAnswer}"

Tasks:
1. Extract structured log:
   - Morning → { sleep_hours, sleep_quality, mood, goal_readiness }
   - Evening → { water_glasses, exercised, exercise_type, duration_minutes, meals, diet_followed, mood, goal_achieved }
   - Use correct types (numbers, booleans, categorical values).
2. Generate a short, actionable, and encouraging health tip:
   - Morning → focus on energy/nutrition/activity
   - Evening → focus on reflection/relaxation/tomorrow prep
   - Respect diet & allergies
   - Keep within 1–2 sentences

Return ONLY valid JSON:
{
  "log": { ... },
  "tip": {
    "message": string,
    "reason": string
  }
}`;
};
