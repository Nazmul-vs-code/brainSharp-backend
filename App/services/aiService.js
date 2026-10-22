import { GoogleGenAI } from "@google/genai";
import { UserProfile } from "../models/UserProfile.js";
import { QuestData } from "../models/QuestData.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const generatePersonalizedCoaching = async (userId, userMessage = "") => {
  try {
    // 1. RETRIEVAL (R): Fetch user's real stats from Neon
    const profile = await UserProfile.findOne({ where: { userId } });
    
    const recentSessions = await QuestData.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
      limit: 5,
    });

    const userLevel = profile?.level || 1;
    const userXp = profile?.xp || 0;
    const streak = profile?.streakCount || 0;

    const sessionHistorySummary = recentSessions.length > 0
      ? recentSessions.map(s => `- Category: ${s.category}, Time Spent: ${s.durationSpentMinutes} mins, XP Earned: ${s.xpEarned}`).join("\n")
      : "No quest sessions recorded yet.";

    // 2. AUGMENTED PROMPT: Construct context-rich prompt
    const systemPrompt = `
You are BrainSharp AI, an elite cognitive habit coach and wellness mentor.
You are giving personalized coaching to user ID: ${userId}.

USER REAL-TIME RETRIEVED DATA:
- Current Level: ${userLevel}
- Total XP: ${userXp}
- Consecutive Day Streak: ${streak} Days
- Recent Quest Activity Logs:
${sessionHistorySummary}

INSTRUCTIONS:
1. Speak directly and encouragingly to the user.
2. Refer naturally to their recent activity stats (streak, categories, durations) to prove you know their exact journey.
3. Provide actionable, concise, and highly motivating feedback for their next habit session.
`;

    const fullPrompt = userMessage
      ? `${systemPrompt}\nUser Question/Input: "${userMessage}"`
      : `${systemPrompt}\nProvide a daily cognitive focus brief for this user.`;

    // 3. GENERATION (G): Direct call using stable gemini-3.8-flash model
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: fullPrompt,
    });

    return response.text;

  } catch (error) { 
    console.error("RAG Service Error:", error);
    throw error;
  }
};