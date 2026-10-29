import { GoogleGenAI } from "@google/genai";
import { UserProfile } from "../models/UserProfile.js";
import { QuestData } from "../models/QuestData.js";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    timeout: 20_000,
    retryOptions: { attempts: 1 },
  },
});

export const generatePersonalizedCoaching = async (userId, userMessage = "") => {
  const [profile, recentSessions] = await Promise.all([
    UserProfile.findOne({ where: { userId } }),
    QuestData.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
      limit: 5,
    }),
  ]);

  const userLevel = profile?.level || 1;
  const userXp = profile?.xp || 0;
  const streak = profile?.streakCount || 0;

  const sessionHistorySummary = recentSessions.length > 0
    ? recentSessions.map(s => `- Category: ${s.category}, Time Spent: ${s.durationSpentMinutes} mins, XP Earned: ${s.xpEarned}`).join("\n")
    : "No quest sessions recorded yet.";

  const fullPrompt = `
You are BrainSharp AI, a concise and encouraging cognitive habit coach. Use the user's real stats and recent quests to give one practical next step. Keep your response under 100 words.

Stats: level ${userLevel}, ${userXp} XP, ${streak}-day streak.
Recent activity:
${sessionHistorySummary}

User: ${userMessage || "Give me a daily cognitive focus brief."}
`;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash-lite",
    contents: fullPrompt,
    config: {
      maxOutputTokens: 128,
    },
  });

  if (!response.text) {
    throw new Error("Gemini returned an empty coaching response.");
  }

  return response.text;
};