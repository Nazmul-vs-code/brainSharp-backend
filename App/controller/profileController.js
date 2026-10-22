import { getOrCreateUserProfile } from "../services/userProfileService.js";
import { QuestData } from "../models/QuestData.js";

const getUtcDate = (date) => date.toISOString().slice(0, 10);

export const getProfile = async (req, res, next) => {
    const { userId } = req.params;
    if (!userId?.trim()) {
        return res.status(400).json({ error: "userId is required." });
    }

    try {
        const profile = await getOrCreateUserProfile(userId);
        if (!profile) {
            return res.status(404).json({ error: "User not found." });
        }

        const sessions = await QuestData.findAll({
            where: { userId: profile.userId },
            attributes: ["createdAt"],
            order: [["createdAt", "DESC"]],
        });
        const completionDates = [
            ...new Set(sessions.map(({ createdAt }) => getUtcDate(new Date(createdAt)))),
        ];
        const today = getUtcDate(new Date());
        const yesterdayDate = new Date(`${today}T00:00:00.000Z`);
        yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
        const yesterday = getUtcDate(yesterdayDate);
        const mostRecentDate = completionDates[0];

        let streakCount = 0;
        if (mostRecentDate === today || mostRecentDate === yesterday) {
            const expectedDate = new Date(`${mostRecentDate}T00:00:00.000Z`);
            for (const completionDate of completionDates) {
                if (completionDate !== getUtcDate(expectedDate)) {
                    break;
                }
                streakCount += 1;
                expectedDate.setUTCDate(expectedDate.getUTCDate() - 1);
            }
        }

        profile.streakCount = streakCount;
        await profile.save();

        const completedDays = Math.min(profile.streakCount, 30);
        return res.status(200).json({
            profile: {
                userId: profile.userId,
                xp: profile.xp,
                level: profile.level,
                streakCount: profile.streakCount,
                lastActiveDate: profile.lastActiveDate,
                challengeBadge: {
                    title: "Productive Enough",
                    daysCompleted: completedDays,
                    goalDays: 30,
                    progress: Math.round((completedDays / 30) * 100),
                    earned: profile.streakCount >= 30,
                },
            },
        });
    } catch (error) {
        return next(error);
    }
};