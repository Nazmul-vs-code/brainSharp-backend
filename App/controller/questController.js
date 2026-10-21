import Connection from "../config/connection.js";
import { Quest } from "../models/Quest.js";
import { UserProfile } from "../models/UserProfile.js";
import { UserQuestProgress } from "../models/UserQuestProgress.js";
import { getOrCreateUserProfile } from "../services/userProfileService.js";

const getToday = () => new Date().toISOString().slice(0, 10);

const getYesterday = (today) => {
    const date = new Date(`${today}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() - 1);
    return date.toISOString().slice(0, 10);
};

export const getQuests = async (req, res, next) => {
    try {
        const quests = await Quest.findAll({ order: [["id", "ASC"]] });
        return res.status(200).json({ quests });
    } catch (error) {
        return next(error);
    }
};

export const getTodayQuests = async (req, res, next) => {
    const { userId } = req.params;
    if (!userId?.trim()) {
        return res.status(400).json({ error: "userId is required." });
    }

    try {
        const profile = await getOrCreateUserProfile(userId);
        if (!profile) {
            return res.status(404).json({ error: "User not found." });
        }

        const today = getToday();
        const quests = await Quest.findAll({ order: [["id", "ASC"]] });
        await UserQuestProgress.bulkCreate(
            quests.map((quest) => ({
                userId: profile.userId,
                questId: quest.id,
                assignedDate: today,
            })),
            { ignoreDuplicates: true }
        );

        const assignedQuests = await Quest.findAll({
            order: [["id", "ASC"]],
            include: [
                {
                    model: UserQuestProgress,
                    as: "userProgress",
                    where: { userId: profile.userId, assignedDate: today },
                    required: false,
                    attributes: ["id", "status", "assignedDate", "completedDate"],
                },
            ],
        });

        return res.status(200).json({
            date: today,
            quests: assignedQuests.map((quest) => {
                const data = quest.toJSON();
                data.progress = data.userProgress[0] ?? null;
                delete data.userProgress;
                return data;
            }),
        });
    } catch (error) {
        return next(error);
    }
};

export const completeQuest = async (req, res, next) => {
    const { userId, questId } = req.body ?? {};
    if (typeof userId !== "string" || !userId.trim()
        || !Number.isInteger(Number(questId)) || Number(questId) < 1) {
        return res.status(400).json({ error: "userId must be a non-empty string and questId a positive integer." });
    }

    const today = getToday();
    let transaction;
    try {
        transaction = await Connection.transaction();
        const profile = await getOrCreateUserProfile(userId, {
            transaction,
            lock: transaction.LOCK.UPDATE,
        });
        if (!profile) {
            await transaction.rollback();
            return res.status(404).json({ error: "User not found." });
        }

        const quest = await Quest.findByPk(questId, { transaction });
        if (!quest) {
            await transaction.rollback();
            return res.status(404).json({ error: "Quest not found." });
        }

        const [progress] = await UserQuestProgress.findOrCreate({
            where: { userId: profile.userId, questId: quest.id, assignedDate: today },
            defaults: { status: "pending" },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });
        if (progress.status === "completed") {
            await transaction.rollback();
            return res.status(409).json({ error: "Quest already completed today." });
        }

        progress.status = "completed";
        progress.completedDate = today;
        await progress.save({ transaction });

        const previousDate = profile.lastActiveDate;
        const previousStreak = profile.streakCount;
        if (previousDate !== today) {
            profile.streakCount = previousDate === getYesterday(today) ? previousStreak + 1 : 1;
            profile.lastActiveDate = today;
        }
        profile.xp += quest.xpReward;
        profile.level = Math.floor(profile.xp / 20) + 1;
        await profile.save({ transaction });
        await transaction.commit();

        return res.status(200).json({
            message: "Quest completed.",
            questProgress: progress,
            profile: {
                userId: profile.userId,
                xp: profile.xp,
                level: profile.level,
                streakCount: profile.streakCount,
                lastActiveDate: profile.lastActiveDate,
            },
        });
    } catch (error) {
        if (transaction && !transaction.finished) {
            await transaction.rollback();
        }
        return next(error);
    }
};