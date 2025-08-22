import { Injectable, Logger } from '@nestjs/common';
import { HealthService } from '../health/health.service';
import { UserService } from '../user/user.service';
import { User } from 'src/user/user.schema';
import {
  calculateAgeFromString,
  calculateBMI,
  parseDOB,
  daysBetweenDates,
} from '../utils';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    private readonly healthService: HealthService,
    private readonly userService: UserService,
  ) {}

  async handleIncoming(body: any) {
    const from = body.From;
    const text = body.Body?.trim();

    if (!text || !from) return;

    let user = await this.userService.findByPhone(from);
    console.log({ user });

    // create skeleton user if not found
    if (!user) {
      user = await this.userService.createOrUpdate(from, {
        onboardingStep: 0,
        onboardingComplete: false,
      });
    }

    const onboardingStep = user.onboardingStep ?? 0;
    const onboardingComplete = user.onboardingComplete ?? false;
    const lowerText = text.toLowerCase();

    // ✅ Quick-command handling
    if (lowerText === 'hi' && onboardingComplete) {
      return this.sendMessage(from, this.greetingMessage(user));
    }

    if (lowerText === '/help') {
      return this.sendMessage(from, this.helpMessage(user));
    }

    if (lowerText === '/profile') {
      return this.sendMessage(from, this.profileMessage(user));
    }

    // ✅ Onboarding flow
    if (!onboardingComplete && onboardingStep < 10) {
      return this.handleOnboarding(from, text, user, onboardingStep);
    }

    // ✅ Update streak
    const streakMessage = await this.updateStreak(user);

    // ✅ Health features
    if (lowerText.includes('recipe')) {
      const { message } = await this.healthService.suggestRecipe(text, user);
      return this.sendMessage(from, this.appendStreak(message, streakMessage));
    }

    if (lowerText.includes('log')) {
      const tip = await this.healthService.logDailyActivity(user, text);
      return this.sendMessage(from, tip);
    }

    // ✅ AI fallback
    const aiReply = await this.healthService.chatWithAI(text, user);
    return this.sendMessage(from, this.appendStreak(aiReply, streakMessage));
  }

  /** =======================
   * Onboarding Flow
   * ======================= */
  private async handleOnboarding(from: string, text: string, user: User, step: number) {
    const updateData: Partial<User> = {};
    let reply = '';

    switch (step) {
      case 0:
        reply = this.onboardingIntro();
        updateData.onboardingStep = 1;
        break;

      case 1:
        updateData.name = text;
        updateData.onboardingStep = 2;
        reply = `Nice to meet you, ${text}! 🥰  
When’s your birthday? 🎂 (please use DD-MM-YYYY)`;
        break;

      case 2:
        const dobString = parseDOB(text);
        if (!dobString) {
          reply = `Oops 😅 that doesn’t look like a valid date.  
Please enter in **DD-MM-YYYY** format (e.g. 25-12-1990)`;
          break;
        }
        updateData.dob = dobString;
        updateData.age = calculateAgeFromString(dobString);
        updateData.onboardingStep = 3;
        reply = `Got it! You’re ${updateData.age} years young 🎉  

What’s your height in **cm**?`;
        break;

      case 3:
        updateData.height = parseInt(text, 10);
        updateData.onboardingStep = 4;
        reply = `Great 👍 and what is your weight in **kg** (e.g. 65.5)?`;
        break;

      case 4:
        const weight = parseFloat(text);
        if (isNaN(weight) || weight <= 0) {
          reply = `That doesn’t look like a valid weight 🤔  

Please enter your weight in kg (e.g. 65.5).`;
          break;
        }
        updateData.weight = weight;
        updateData.bmi = calculateBMI(updateData.height || user.height, weight);
        updateData.onboardingStep = 5;
        reply = `Thanks! What’s your sex? (male / female / other)`;
        break;

      case 5:
        updateData.sex = text;
        updateData.onboardingStep = 6;
        reply = `Perfect! 🌟 Now let’s set your health **goals** (this also unlocks your **+50 points** 😉).  

Please type your top goal(s) — (e.g., stay fit, eat healthy, lose weight — you can type multiple)`;
        break;

      case 6:
        updateData.goals = text.split(',').map((g) => g.trim());
        updateData.onboardingStep = 7;
        reply = `Great goals 🙌  Do you follow any specific diet style? (e.g. Vegetarian / Low carb / No preference)`;
        break;

      case 7:
        updateData.dietPreference = text;
        updateData.onboardingStep = 8;
        reply = `Got it ✅  Any foods you avoid or allergies I should remember?`;
        break;

      case 8:
        updateData.allergies = text;
        updateData.onboardingStep = 9;
        reply = `Almost at the finish line! 💪  

How many meals do you usually have in a day? (2 / 3 / 4+)`;
        break;

      case 9:
        updateData.mealFrequency = text;
        updateData.onboardingStep = 10;
        updateData.onboardingComplete = true;
        updateData.points = (user.points || 0) + 50;

        reply = `🎉 Woohoo! Onboarding complete!  
You’ve earned **+50 health points** 🏆  

From now on I’ll send personalised **morning & evening nudges** and you can ask me anything anytime (recipes, tips, questions).  
Let’s crush your health goals together 💪🌿`;
        break;
    }

    await this.userService.createOrUpdate(from, updateData);
    return this.sendMessage(from, reply);
  }

  /** =======================
   * Streak Handling
   * ======================= */
  async updateStreak(user: User): Promise<string> {
    const now = new Date();
    const last = user.lastInteraction ? new Date(user.lastInteraction) : null;
    let message = '';

    if (last) {
      const diff = daysBetweenDates(last, now);

      if (diff === 1) {
        user.currentStreak = (user.currentStreak || 0) + 1;
        user.points = (user.points || 0) + 5;
        message = `👏 Nice! You’ve kept a **${user.currentStreak}-day streak** and earned **+5 points** today (Total: ${user.points} pts)`;
      } else if (diff > 1) {
        user.currentStreak = 1;
        user.points = (user.points || 0) + 1;
        message = `New day, fresh start 🌱 You earned **+1 point** for showing up today! (Total: ${user.points} pts)`;
      }
    } else {
      user.currentStreak = 1;
      user.points = (user.points || 0) + 5;
      message = `Welcome! You’ve started a new streak and earned **+5 points** 🙌 (Total: ${user.points} pts)`;
    }

    user.lastInteraction = now;
    await this.userService.createOrUpdate(user.phone, user);
    return message;
  }

  /** =======================
   * Utility Messages
   * ======================= */
  private greetingMessage(user: User): string {
    return `Hi ${user.name || 'there'}! 👋  
It’s so nice to see you again. You can ask me anything — recipes, healthy tips or even a little motivation 😊  
BTW the more you interact, the more **health points** you earn (you currently have **${user.points || 0} pts**).  
What would you like help with today?`;
  }

  private helpMessage(user: User): string {
    return `
Hey ${user.name || 'there'}! 👋  
Here’s what you can do with Hitha AI:

📝 Profile & Stats ( type /profile to view )
- View profile details (age, height, weight, BMI)
- Check points & streaks
- Update personal info

🥗 Health & Wellness
- Log daily meals or activity
- Get personalised health tips curated to your goal and lifestyle
- Get personalised healthy recipes

💬 Ask Hitha AI
- Ask any health question (nutrition, fitness, lifestyle)

💡 Tip: The more you interact, the smarter I get! Your data is always private 🔒`;
  }

  private profileMessage(user: User): string {
    return `
📝 **Your Hitha AI Profile**

Name: ${user.name || 'N/A'}
Age: ${user.age || 'N/A'} years
Sex: ${user.sex || 'N/A'}
Height: ${user.height || 'N/A'} cm
Weight: ${user.weight || 'N/A'} kg
BMI: ${user.bmi || 'N/A'}

🏆 Health Points: ${user.points || 0}
🔥 Current Streak: ${user.currentStreak || 0} days
🎯 Health Goals: ${user.goals?.join(', ') || 'None'}

💡 Tip: Keep interacting with me daily to earn more points and improve your streaks! 🌿`;
  }

  private onboardingIntro(): string {
    return `Hey there! 👋 I’m **Hitha AI**, your friendly wellness companion 🤖

I’ll send you personalised nudges based on your goals and you can ask me any health question — like a friendly coach 💛

I’ll also learn from your messages and logs daily to give smarter advice over time. Don’t worry — everything you share is private 🔒

Before we begin, may I know your name? 🌸
(Complete onboarding to earn **+50 health points** 🎁)`;
  }

  private appendStreak(message: string, streakMessage: string): string {
    return streakMessage ? `${message}\n\n${streakMessage}` : message;
  }

  async sendMessage(to: string, message: string) {
    // TODO: integrate Twilio/WhatsApp API
    return message;
  }
}
