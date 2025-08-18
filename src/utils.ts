export function parseDOB(input: string): Date | null {
  // Accepts DD-MM-YYYY or DD/MM/YYYY formats
  const parts = input.trim().split(/[-\/]/);
  if (parts.length !== 3) return null;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // zero-based month
  const year = parseInt(parts[2], 10);

  const date = new Date(year, month, day);
  // Basic validation to check if date matches input (handle invalid dates)
  if (
    date.getFullYear() === year &&
    date.getMonth() === month &&
    date.getDate() === day
  ) {
    return date;
  }
  return null;
}

export function calculateAge(dob: Date): number {
  const diffMs = Date.now() - dob.getTime();
  const ageDt = new Date(diffMs);
  return Math.abs(ageDt.getUTCFullYear() - 1970);
}

export function calculateBMI(heightCm: number, weightKg: number): number {
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return Math.round(bmi * 10) / 10; // round to 1 decimal place
}

export function daysBetweenDates(date1: Date, date2: Date): number {
  const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
  return (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24);
}

export function formatRecipe(recipe: {
  name: string;
  ingredients: string[];
  steps: string[];
  nutrition?: Record<string, string | number>;
}): string {
  let msg = `🍲 ${recipe.name}\n\nIngredients:\n`;
  for (const item of recipe.ingredients) {
    msg += `- ${item}\n`;
  }
  msg += `\nSteps:\n`;
  recipe.steps.forEach((step, i) => {
    msg += `${i + 1}. ${step}\n`;
  });

  if (recipe.nutrition) {
    msg += `\nNutritional Info (per serving):\n`;
    for (const [key, value] of Object.entries(recipe.nutrition)) {
      msg += `- ${key}: ${value}\n`;
    }
  }

  return msg.trim();
}

export function getToneInstruction(age?: number, gender?: string) {
    const g = gender?.toLowerCase();
  
    if (!age) return "Respond in a neutral, friendly, and clear tone.";
  
    if (age < 18) {
      return "Respond in a fun, simple, and encouraging tone suitable for teenagers.";
    }
  
    if (age < 25) {
      return "Respond in a casual, relatable, and upbeat tone with easy-to-understand language.";
    }
  
    if (age <= 40) {
      if (g === "male") return "Respond in a confident, concise, and solution-focused tone.";
      if (g === "female") return "Respond in a warm, clear, and supportive tone.";
      return "Respond in a clear, friendly, and balanced tone.";
    }
  
    if (age <= 60) {
      return "Respond in a respectful, practical, and reassuring tone.";
    }
  
    return "Respond in a patient, polite, and formal tone, showing care and respect.";
}

export function languageInstruction(userDetails) {
    return userDetails.language
        ? `Respond in ${userDetails.language} language.`
        : '';
} 

export function getUserDetailsExerpt(user) {
    return {
      name: user.name,
      age: user.age,
      height: user.height,
      weight: user.weight,
      bmi: user.bmi,
      sex: user.sex,
      goals: user.goals,
      dietPreference: user.dietPreference,
      allergies: user.allergies,
    }
}
  
export function getLogQuestion(time: 'morning' | 'evening') {
    const eveningQuestion = `Please reply in this format:

    1. How many glasses of water did you drink?  
    2. Did you exercise? (yes / no)  
    3. If yes, what type and how long? (cardio / strength / yoga / stretching / other, minutes)  
    4. How many meals did you have?  
    5. Did you follow your diet? (yes / no)  
    6. How do you feel now? (happy / tired / stressed / relaxed)  
    7. Did you achieve your main goal today? (yes / no)
  
    Example reply:  
    6 glasses, yes, strength 45, 3 meals, yes, happy, yes`;
  
    const morningQuestion = `Please reply in this format:
  
    1. How many hours did you sleep?  
    2. How was your sleep? (great / okay / poor)  
    3. How do you feel now? (energetic / tired / happy / stressed / relaxed)  
    4. How ready do you feel for your goals today? (1–5)
  
    Example reply:  
    7 hours, okay, tired, 4`;

    return time === 'morning' ? morningQuestion : eveningQuestion;
}
