import { Injectable } from '@nestjs/common';
import { HealthService } from '../health/health.service';
import { UserService } from '../user/user.service';
import { User } from 'src/user/user.schema';
import {
  calculateAge,
  calculateBMI,
  parseDOB,
  daysBetweenDates,
} from '../utils';

@Injectable()
export class WhatsappService {
  constructor(
    private healthService: HealthService,
    private userService: UserService,
  ) {}

  async handleIncoming(body: any) {
    const from = body.From;
    const text = body.Body?.trim();

    if (!text || !from) return;

    let user = await this.userService.findByPhone(from);

    if (!user) {
      user = await this.userService.createOrUpdate(from, {
        onboardingStep: 0,
        onboardingComplete: false,
      });
    }

    const onboardingStep = user.onboardingStep ?? 0;
    const onboardingComplete = user.onboardingComplete ?? false;

    // Fixed greeting if user sends "hi" and onboarding is complete
    if (text.toLowerCase() === 'hi' && onboardingComplete) {
      const greeting = `Hi ${user.name || 'there'}! 👋  
It’s so nice to see you again. You can ask me anything — recipes, healthy tips or even a little motivation 😊  
BTW the more you interact, the more **health points** you earn (you currently have **${user.points || 0} pts**).  
What would you like help with today?`;

      return await this.sendMessage(from, greeting);
    }

    // Onboarding flow
    if (!onboardingComplete && onboardingStep < 10) {
      return await this.handleOnboarding(from, text, user, onboardingStep);
    }

    // Streak update
    const streakMessage = await this.updateStreak(user);

    // TODO: Move to scheduled cron
    await this.userService.aggregateUserBehaviour();

    // Recipe intent
    if (text.toLowerCase().includes('recipe')) {
      const response = await this.healthService.suggestRecipe(text, user);
      let reply = response.message || "Sorry, couldn't get a recipe right now.";
      if (streakMessage) reply += `\n\n${streakMessage}`;
      return await this.sendMessage(from, reply);
    }

    // Log activity
    if (text.toLowerCase().includes('log')) {
      const tip = await this.healthService.logDailyActivity(user, text);
      return await this.sendMessage(from, tip);
    }

    // AI chat fallback
    const aiReply = await this.healthService.chatWithAI(text, user);
    let finalReply = aiReply || '';
    if (streakMessage) finalReply += `\n\n${streakMessage}`;
    return await this.sendMessage(from, finalReply);
  }

  private async handleOnboarding(
    from: string,
    text: string,
    user: User,
    step: number,
  ) {
    const updateData: Partial<User> = {};
    let reply = '';

    switch (step) {
      case 0:
        reply = `Hey there! 👋 I’m **Hitha AI**, your friendly wellness companion 🤖  
        I’ll send you personalised morning and evening nudges based on your goals — and you can ask me any health question, just like talking to a close friend 💛
        
        I’ll also keep learning from your messages and daily activity so I can give you smarter and more personalised advice over time.  
        Don’t worry — everything you share stays completely private and only you have access to it 🔒
        
        Before we begin, may I know your lovely name? 🌸  
        (Complete onboarding to earn **+50 health points** 🎁)`;
        
        updateData.onboardingStep = 1;
        break;

      case 1:
        updateData.name = text;
        updateData.onboardingStep = 2;
        reply = `Nice to meet you, ${text}! 🥰  
When’s your birthday? 🎂 (please use DD-MM-YYYY)`;
        break;

      case 2:
        const dob = parseDOB(text);
        if (!dob) {
          reply = `Oops 😅 that doesn’t look like a valid date.  
Please enter in **DD-MM-YYYY** format (e.g. 25-12-1990)`;
          break;
        }
        updateData.dob = dob.toISOString().slice(0, 10);
        updateData.age = calculateAge(dob);
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
Please type your top goal(s) — separated by commas if more than one.`;
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

        reply = `🎉 Woohoo — onboarding complete!  
You’ve earned **+50 health points** 🏆  
From now on I’ll send personalised **morning & evening nudges**, and you can ask me anything (recipes, tips, questions) anytime.  
Let’s crush your health goals 💪🌿`;
        break;
    }

    await this.userService.createOrUpdate(from, updateData);
    return await this.sendMessage(from, reply);
  }

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
      // very first interaction
      user.currentStreak = 1;
      user.points = (user.points || 0) + 5;
      message = `Welcome! You’ve started a new streak and earned **+5 points** 🙌 (Total: ${user.points} pts)`;
    }

    user.lastInteraction = now;
    await this.userService.createOrUpdate(user.phone, user);
    return message;
  }

  async sendMessage(to: string, message: string) {
    return message; // (Twilio call here)
  }
}
