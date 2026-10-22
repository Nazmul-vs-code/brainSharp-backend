import { col, fn, QueryTypes } from "sequelize";
import Connection from "../config/connection.js";
import { QuestData } from "../models/QuestData.js";
import { UserProfile } from "../models/UserProfile.js";

const CATEGORIES = ["mental", "physical", "puzzle"];

const getAllUsers = async () => {
    const users = await Connection.query(
        'SELECT "id", "name", "image", "email" FROM "user"',
        {
            type: QueryTypes.SELECT,
        }
    );

    return users;
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
        const users = await getAllUsers();

        if (category && category !== "global") {
            const categoryStats = await QuestData.findAll({
                attributes: [
                    "userId",
                    [fn("SUM", col("xpEarned")), "totalCategoryXp"],
                    [fn("SUM", col("durationSpentMinutes")), "totalTimeSpent"],
                ],
                where: { category },
                group: ["userId"],
                raw: true,
            });
            const statsByUserId = new Map(categoryStats.map((entry) => [
                entry.userId,
                {
                    totalCategoryXp: Number(entry.totalCategoryXp),
                    totalTimeSpent: Number(entry.totalTimeSpent),
                },
            ]));
            const leaderboard = users.map((user) => {
                const stats = statsByUserId.get(user.id);
                return {
                    userId: user.id,
                    name: getDisplayName(user.id, user),
                    image: user.image ?? null,
                    totalCategoryXp: stats?.totalCategoryXp ?? 0,
                    totalTimeSpent: stats?.totalTimeSpent ?? 0,
                };
            }).sort((first, second) => second.totalCategoryXp - first.totalCategoryXp);

            return res.status(200).json({
                status: true,
                category,
                leaderboard,
            });
        }

        const profiles = await UserProfile.findAll({
            attributes: ["userId", "xp", "level", "streakCount"],
        });
        const profilesByUserId = new Map(profiles.map((profile) => [
            profile.userId,
            profile,
        ]));
        const leaderboard = users.map((user) => {
            const profile = profilesByUserId.get(user.id);
            return {
                userId: user.id,
                name: getDisplayName(user.id, user),
                image: user.image ?? null,
                email: user.email ?? null,
                xp: profile?.xp ?? 0,
                level: profile?.level ?? 1,
                streakCount: profile?.streakCount ?? 0,
            };
        }).sort((first, second) => second.xp - first.xp);

        return res.status(200).json({
            status: true,
            category: "global",
            leaderboard,
        });
    } catch (error) {
        return next(error);
    }
};
