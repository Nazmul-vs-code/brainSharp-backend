import { getOrCreateUserProfile } from "../services/userProfileService.js";

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