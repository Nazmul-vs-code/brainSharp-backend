import { col, fn, QueryTypes } from "sequelize";
import Connection from "../config/connection.js";
import { QuestData } from "../models/QuestData.js";
import { UserProfile } from "../models/UserProfile.js";

const CATEGORIES = ["mental", "physical", "puzzle"];

const getUsersById = async (userIds) => {
    if (userIds.length === 0) {
        return new Map();
    }

    const users = await Connection.query(
        'SELECT "id", "name", "image", "email" FROM "user" WHERE "id" IN (:userIds)',
        {
            replacements: { userIds },
            type: QueryTypes.SELECT,
        }
    );

    return new Map(users.map((user) => [user.id, user]));
};

const getDisplayName = (userId, user) => (
    user?.name || `Explorer_${String(userId).substring(0, 5)}`
);

export const getLeaderboard = async (req, res, next) => {
    const { category } = req.query;
    if (
        category !== undefined
        && category !== "global"
        && !CATEGORIES.includes(category)
    ) {
        return res.status(400).json({
            error: `category must be one of: ${CATEGORIES.join(", ")}, global.`,
        });
    }

    try {
        if (category && category !== "global") {
            const leaderboard = await QuestData.findAll({
                attributes: [
                    "userId",
                    [fn("SUM", col("xpEarned")), "totalCategoryXp"],
                    [fn("SUM", col("durationSpentMinutes")), "totalTimeSpent"],
                ],
                where: { category },
                group: ["userId"],
                order: [[fn("SUM", col("xpEarned")), "DESC"]],
                limit: 10,
                raw: true,
            });
            const usersById = await getUsersById(leaderboard.map(({ userId }) => userId));

            return res.status(200).json({
                status: true,
                category,
                leaderboard: leaderboard.map((entry) => {
                    const user = usersById.get(entry.userId);
                    return {
                        userId: entry.userId,
                        name: getDisplayName(entry.userId, user),
                        image: user?.image ?? null,
                        totalCategoryXp: Number(entry.totalCategoryXp),
                        totalTimeSpent: Number(entry.totalTimeSpent),
                    };
                }),
            });
        }

        const profiles = await UserProfile.findAll({
            attributes: ["userId", "xp", "level", "streakCount"],
            order: [["xp", "DESC"]],
            limit: 20,
        });
        const usersById = await getUsersById(profiles.map(({ userId }) => userId));

        return res.status(200).json({
            status: true,
            category: "global",
            leaderboard: profiles.map((profile) => {
                const user = usersById.get(profile.userId);
                return {
                    userId: profile.userId,
                    name: getDisplayName(profile.userId, user),
                    image: user?.image ?? null,
                    email: user?.email ?? null,
                    xp: profile.xp,
                    level: profile.level,
                    streakCount: profile.streakCount,
                };
            }),
        });
    } catch (error) {
        return next(error);
    }
};
