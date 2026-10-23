import { Router } from "express";
import { completeQuest, getQuestProgress, getQuests, getTodayQuests } from "../controller/questController.js";
import { getAICoaching } from "../controller/aiController.js";
import { getLeaderboard } from "../controller/leaderboardController.js";
import { getProfile } from "../controller/profileController.js";

export let FrontendRoutes = Router()

FrontendRoutes.get("/quests", getQuests);

FrontendRoutes.get("/quest/progress", getQuestProgress);

FrontendRoutes.get("/quests/today/:userId", getTodayQuests);

FrontendRoutes.post("/quests/complete", completeQuest);
FrontendRoutes.get("/leaderboard", getLeaderboard);
FrontendRoutes.get("/profile/:userId", getProfile);

// 2. Add the RAG AI Coach endpoint
FrontendRoutes.post("/ai/coach", getAICoaching);