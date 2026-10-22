import { GoogleGenAI } from "@google/genai";
import { UserProfile } from "../models/UserProfile.js";
import { QuestData } from "../models/QuestData.js";

// Initialize the Gemini client using the environment variable
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const generatePersonalizedCoaching = async (userId, userMessage = "") => {
  try {
    // ----------------------------------------------------
    // 1. RETRIEVAL (R): Fetch user context from Neon
    // ----------------------------------------------------
    const profile = await UserProfile.findOne({ where: { userId } });
    
    // Get user's last 5 completed quest sessions
    const recentSessions = await QuestData.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
      limit: 5,
    });

    const userLevel = profile?.level || 1;
    const userXp = profile?.xp || 0;
    const streak = profile?.streakCount || 0;

    // Format recent activity into readable context string
    const sessionHistorySummary = recentSessions.length > 0
      ? recentSessions.map(s => `- Category: ${s.category}, Time Spent: ${s.durationSpentMinutes} mins, XP Earned: ${s.xpEarned}`).join("\n")
      : "No quest sessions recorded yet.";

    // ----------------------------------------------------
    // 2. AUGMENTED PROMPT: Construct context-rich prompt
    // ----------------------------------------------------
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
4. Keep your response grounded in their actual data.
`;

    const fullPrompt = userMessage
      ? `${systemPrompt}\nUser Question/Input: "${userMessage}"`
      : `${systemPrompt}\nProvide a daily cognitive focus brief for this user.`;

    // ----------------------------------------------------
    // 3. GENERATION (G): Send prompt to Gemini API
    // ----------------------------------------------------
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
    });

    return response.text;

  } catch (error) {
    console.error("RAG Service Error:", error);
    throw error;
  }
};