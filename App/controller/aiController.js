import { generatePersonalizedCoaching } from "../services/aiService.js";

export const getAICoaching = async (req, res) => {
  try {
    const { userId, message } = req.body ?? {};

    if (typeof userId !== "string" || !userId.trim()) {
      return res.status(400).json({ status: false, message: "userId is required." });
    }

    if (message !== undefined && (typeof message !== "string" || message.length > 2000)) {
      return res.status(400).json({
        status: false,
        message: "message must be a string no longer than 2000 characters.",
      });
    }

    const aiAdvice = await generatePersonalizedCoaching(userId.trim(), message);

    return res.status(200).json({
      status: true,
      data: {
        coachingAdvice: aiAdvice,
      },
    });
  } catch (err) {
    console.error("AI Coach Controller Error:", err);
    const timedOut = err instanceof Error
      && (err.name === "AbortError" || err.name === "TimeoutError" || err.status === 504);
    return res.status(timedOut ? 504 : 500).json({
      status: false,
      message: timedOut
        ? "AI coaching timed out. Please try again."
        : "Failed to generate AI advice.",
    });
  }
};