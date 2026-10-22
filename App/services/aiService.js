import { GoogleGenAI } from "@google/genai";
import { UserProfile } from "../models/UserProfile.js";
import { QuestData } from "../models/QuestData.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Helper function with automatic retry for 503 high demand errors
async function generateWithRetry(prompt, retries = 3, delay = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
      });
      return response.text;
    } catch (error) {
      console.warn(`Attempt ${attempt} failed due to server load. Retrying in ${delay * attempt}ms...`);
      if (attempt === retries) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, delay * attempt));
    }
  }
}

export const generatePersonalizedCoaching = async (userId, userMessage = "") => {
  // Declare variables outside try/catch scope so fallback can access them safely
  let profile = null;
  let recentSessions = [];

  try {
    profile = await UserProfile.findOne({ where: { userId } });
    
    recentSessions = await QuestData.findAll({
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

    const aiAdvice = await generateWithRetry(fullPrompt);
    return aiAdvice;

  } catch (error) {
    console.error("RAG Service Error (All retries exhausted):", error.message);
    
    // Fallback response now has safe access to `profile`
    return `⚠️ **AI Coach Notice:** Google's servers are experiencing temporary high traffic (503). \n\nHowever, looking at your live data: You are at **Level ${profile?.level || 1}** with a **${profile?.streakCount || 0}-day streak**! Keep up the incredible momentum and jump into your next quest session!`;
  }
};