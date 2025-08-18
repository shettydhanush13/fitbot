import { getToneInstruction, getUserDetailsExerpt, languageInstruction } from "./utils";

export const getRecipePrompt = (userDetails, userMessage, extraContext?: { topKeywords; cooccurrence }) => {
  const userInfo = getUserDetailsExerpt(userDetails);
  const toneInstruction = getToneInstruction(userInfo.age, userInfo.sex);
  const extraCtxStr = extraContext
    ? `Extra context:\n- Top Keywords: ${extraContext.topKeywords?.join(', ') || 'none'}\n- Co-occurring Keywords: ${JSON.stringify(extraContext.cooccurrence || {})}`
    : '';

  return `You are a helpful AI assistant. ${toneInstruction} ${languageInstruction}

    User details (JSON):
    ${JSON.stringify(userInfo)}

    ${extraCtxStr}

    User request: "${userMessage}"

    Suggest a healthy recipe with simple ingredients tailored to the user’s health goals, diet preference, and allergies.

    When identifying keywords:
    - Only pick **meaningful and specific** terms that are relevant to the health, food, or recipe context.
    - Avoid common, generic, or filler words (examples: "quick", "easy", "good", "make", "fix", "fast", "simple", "healthy", "recipe", "food").
    - Output maximum 5 keywords for both input and output.

    Return only valid JSON (no extra text):
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

export const getChatWithContextPrompt = (userDetails, userMessage, extraContext?: { topKeywords; cooccurrence }) => {
  const userInfo = getUserDetailsExerpt(userDetails);
  const toneInstruction = getToneInstruction(userInfo.age, userInfo.sex);
  const extraCtxStr = extraContext
    ? `Extra context:\n- Top Keywords: ${extraContext.topKeywords?.join(', ') || 'none'}\n- Co-occurring Keywords: ${JSON.stringify(extraContext.cooccurrence || {})}`
    : '';

  return `You are a helpful AI assistant. ${toneInstruction} ${languageInstruction}

    User details (JSON):
    ${JSON.stringify(userInfo)}

    ${extraCtxStr}

    User request: "${userMessage}"

    Keep answers short, sweet, and easy to understand.
    Give gentle, friendly health tips that are encouraging.
    If useful, mention helpful products lightly, like "I can help you find some if you want."

    When identifying keywords:
    - Only pick **meaningful and specific** terms that are relevant to the user’s request and your response.
    - Avoid common, generic, or filler words (examples: "quick", "easy", "good", "make", "fix", "fast", "simple", "healthy", "recipe", "food").
    - Output exactly 5 keywords for both input and output.

    Return only valid JSON (no extra text):
    {
      "response": string,
      "input_keywords": [string],
      "output_keywords": [string]
    }`;
};

export const getDailyLogAndTipPrompt = (
  tipType: "morning" | "evening",
  userDetails,
  question: string,
  userAnswer: string,
  extraContext?
) => {
  const userInfo = getUserDetailsExerpt(userDetails);
  const toneInstruction = getToneInstruction(userInfo.age, userInfo.sex);
  const extraCtxStr = extraContext
    ? `Extra context:
    - Top Keywords: ${extraContext.topKeywords?.join(', ') || 'none'}
    - Co-occurring Keywords: ${JSON.stringify(extraContext.cooccurrence || {})}`
        : '';

      return `You are a helpful AI health assistant. ${toneInstruction} ${languageInstruction}

    User details (JSON):
    ${JSON.stringify(userInfo)}

    ${extraCtxStr}

    Tip Type: ${tipType.toUpperCase()} (morning or evening)

    Question asked to user:
    "${question}"

    User answer:
    "${userAnswer}"

    Tasks:
    1. Extract the answer into a structured object suitable for database storage.
      - For morning: extract fields sleep_hours, sleep_quality, mood, goal_readiness
      - For evening: extract fields water_glasses, exercised (yes/no), exercise_type, duration_minutes, meals, diet_followed (yes/no), mood, goal_achieved (yes/no)
      - Ensure numeric fields are numbers, booleans are true/false, and categorical fields match allowed options.

    2. Generate a short, actionable, and friendly health tip based on the user's profile, behavior, and the log.
      - Morning tips: focus on energy, nutrition, or activity to start the day.
      - Evening tips: focus on reflection, relaxation, or preparing for tomorrow.
      - Keep it concise (1–2 sentences) and encouraging.
      - Respect diet preference and allergies.
      - Include a gentle motivational note if appropriate.

    Return ONLY valid JSON (no extra text):
    {
      "log": { /* structured fields extracted from user answer */ },
      "tip": {
        "message": string,
        "reason": string
      }
    }`;
};


