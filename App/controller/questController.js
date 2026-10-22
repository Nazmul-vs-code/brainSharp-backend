import Connection from "../config/connection.js";
import { ensureDefaultQuests, Quest } from "../models/Quest.js";
import { QuestData } from "../models/QuestData.js";
import { UserQuestProgress } from "../models/UserQuestProgress.js";
import { getOrCreateUserProfile } from "../services/userProfileService.js";

const getToday = () => new Date().toISOString().slice(0, 10);

export const getQuests = async (req, res, next) => {
    try {
        await ensureDefaultQuests();
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

        await ensureDefaultQuests();
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
    const { userId, questId, durationSpentMinutes = 10 } = req.body ?? {};
    if (
        typeof userId !== "string"
        || !userId.trim()
        || !Number.isInteger(Number(questId))
        || Number(questId) < 1
        || !Number.isInteger(durationSpentMinutes)
        || durationSpentMinutes < 1
    ) {
        return res.status(400).json({
            error: "userId, a positive questId, and a positive integer durationSpentMinutes are required.",
        });
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

        const quest = await Quest.findByPk(Number(questId), { transaction });
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
        progress.status = "completed";
        progress.completedDate = today;
        await progress.save({ transaction });

        const bonusXp = Math.max(0, durationSpentMinutes - 10) * 2;
        const xpEarned = quest.xpReward + bonusXp;
        const session = await QuestData.create({
            userId: profile.userId,
            questId: quest.id,
            category: quest.category,
            durationSpentMinutes,
            xpEarned,
        }, { transaction });

        profile.xp += xpEarned;
        profile.level = Math.floor(profile.xp / 20) + 1;
        profile.streakCount += 1;
        profile.lastActiveDate = today;
        await profile.save({ transaction });
        await transaction.commit();

        return res.status(200).json({
            message: "Quest completed.",
            session: {
                id: session.id,
                questId: session.questId,
                category: session.category,
                durationSpentMinutes: session.durationSpentMinutes,
                baseXp: quest.xpReward,
                bonusXp,
                xpEarned: session.xpEarned,
            },
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
            try {
                await transaction.rollback();
            } catch (rollbackError) {
                return next(new AggregateError([error, rollbackError], "Quest completion and rollback failed."));
            }
        }
        return next(error);
    }
};