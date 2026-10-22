import { col, fn } from "sequelize";
import { QuestData } from "../models/QuestData.js";
import { UserProfile } from "../models/UserProfile.js";

const CATEGORIES = ["mental", "physical", "puzzle"];

export const getLeaderboard = async (req, res, next) => {
    const { category } = req.query;
    if (category !== undefined && !CATEGORIES.includes(category)) {
        return res.status(400).json({
            error: `category must be one of: ${CATEGORIES.join(", ")}.`,
        });
    }

    try {
        if (category) {
            const leaderboard = await QuestData.findAll({
                attributes: [
                    "userId",
                    [fn("SUM", col("xpEarned")), "totalXpEarned"],
                    [fn("SUM", col("durationSpentMinutes")), "totalDurationSpentMinutes"],
                ],
                where: { category },
                group: ["userId"],
                order: [[fn("SUM", col("xpEarned")), "DESC"]],
                limit: 10,
                raw: true,
            });

            return res.status(200).json({
                category,
                leaderboard: leaderboard.map((entry) => ({
                    ...entry,
                    totalXpEarned: Number(entry.totalXpEarned),
                    totalDurationSpentMinutes: Number(entry.totalDurationSpentMinutes),
                })),
            });
        }

        const leaderboard = await UserProfile.findAll({
            attributes: ["userId", "xp", "level", "streakCount"],
            order: [["xp", "DESC"]],
            limit: 10,
        });

        return res.status(200).json({
            leaderboard: leaderboard.map((profile) => profile.toJSON()),
        });
    } catch (error) {
        return next(error);
    }
};
