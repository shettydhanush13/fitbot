import * as dayjs from "dayjs";
import { UserContext } from "./openAI/openAI.service";

// ---------------- Date & Health Utils ----------------

export function parseDOB(input: string): string | null {
  const parts = input.split("-");
  if (parts.length !== 3) return null;

  const [dd, mm, yyyy] = parts;
  const date = dayjs(`${yyyy}-${mm}-${dd}`, "YYYY-MM-DD", true);

  return date.isValid() ? date.format("YYYY-MM-DD") : null;
}

export function calculateAgeFromString(dobString: string): number | null {
  const dob = dayjs(dobString, "YYYY-MM-DD");
  if (!dob.isValid()) return null;

  const today = dayjs();
  let age = today.year() - dob.year();

  if (
    today.month() < dob.month() ||
    (today.month() === dob.month() && today.date() < dob.date())
  ) {
    age--;
  }
  return age;
}

export function calculateBMI(heightCm: number, weightKg: number): number {
  if (!heightCm || !weightKg) return 0;
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

export function daysBetweenDates(date1: Date, date2: Date): number {
  const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
  return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

// ---------------- Recipe Formatting ----------------

export interface Recipe {
  name: string;
  ingredients: string[];
  steps: string[];
  nutrition?: Record<string, string | number>;
}

export function formatRecipe(recipe: Recipe): string {
  const ingredients = recipe.ingredients.map(i => `- ${i}`).join("\n");
  const steps = recipe.steps.map((s, i) => `${i + 1}. ${s}`).join("\n");

  let msg = `🍲 ${recipe.name}\n\nIngredients:\n${ingredients}\n\nSteps:\n${steps}`;

  if (recipe.nutrition) {
    const nutrition = Object.entries(recipe.nutrition)
      .map(([key, val]) => `- ${key}: ${val}`)
      .join("\n");
    msg += `\n\nNutritional Info (per serving):\n${nutrition}`;
  }

  return msg.trim();
}

// ---------------- Tone Instructions ----------------

type ToneRule = {
  min?: number;
  max?: number;
  gender?: "male" | "female";
  tone: string;
};

const toneRules: ToneRule[] = [
  { max: 17, tone: "Respond in a fun, simple, and encouraging tone suitable for teenagers." },
  { max: 24, tone: "Respond in a casual, relatable, and upbeat tone with easy-to-understand language." },
  { min: 18, max: 40, gender: "male", tone: "Respond in a confident, concise, and solution-focused tone." },
  { min: 18, max: 40, gender: "female", tone: "Respond in a warm, clear, and supportive tone." },
  { min: 18, max: 40, tone: "Respond in a clear, friendly, and balanced tone." },
  { min: 41, max: 60, tone: "Respond in a respectful, practical, and reassuring tone." },
  { min: 61, tone: "Respond in a patient, polite, and formal tone, showing care and respect." },
];

export function getToneInstruction(age?: number, gender?: string): string {
  if (!age) return "Respond in a neutral, friendly, and clear tone.";

  const g = gender?.toLowerCase() as "male" | "female" | undefined;

  const rule = toneRules.find(r =>
    (r.min === undefined || age >= r.min) &&
    (r.max === undefined || age <= r.max) &&
    (!r.gender || r.gender === g)
  );

  return rule?.tone ?? "Respond in a neutral, friendly, and clear tone.";
}

// ---------------- Language & User Info ----------------

export function languageInstruction(userDetails: { language: string; }): string {
  return userDetails.language
    ? `Respond in ${userDetails.language} language.`
    : "";
}

export function getUserDetailsExcerpt(user: UserContext) {
  const { name, age, height, weight, bmi, sex, goals, dietPreference, allergies } = user;
  return { name, age, height, weight, bmi, sex, goals, dietPreference, allergies };
}

// ---------------- Daily Log Questions ----------------

const logQuestions = {
  morning: `Please reply in this format:

1. How many hours did you sleep?  
2. How was your sleep? (great / okay / poor)  
3. How do you feel now? (energetic / tired / happy / stressed / relaxed)  
4. How ready do you feel for your goals today? (1–5)

Example reply:  
7 hours, okay, tired, 4`,

  evening: `Please reply in this format:

1. How many glasses of water did you drink?  
2. Did you exercise? (yes / no)  
3. If yes, what type and how long? (cardio / strength / yoga / stretching / other, minutes)  
4. How many meals did you have?  
5. Did you follow your diet? (yes / no)  
6. How do you feel now? (happy / tired / stressed / relaxed)  
7. Did you achieve your main goal today? (yes / no)

Example reply:  
6 glasses, yes, strength 45, 3 meals, yes, happy, yes`,
};

export function getLogQuestion(time: "morning" | "evening"): string {
  return logQuestions[time];
}
