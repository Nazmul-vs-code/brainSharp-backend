import { generatePersonalizedCoaching } from "../services/aiService";

export const getAICoaching = async (req, res) => {
  try {
    const { userId, message } = req.body;

    if (!userId) {
      return res.status(400).json({ status: false, message: "userId is required." });
    }

    const aiAdvice = await generatePersonalizedCoaching(userId, message);

    return res.status(200).json({
      status: true,
      data: {
        coachingAdvice: aiAdvice,
      },
    });
  } catch (err) {
    console.error("AI Coach Controller Error:", err);
    return res.status(500).json({
      status: false,
      message: "Failed to generate AI advice.",
      error: err.message,
    });
  }
};