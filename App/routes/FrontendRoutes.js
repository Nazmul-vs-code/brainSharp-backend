import { Router } from "express";
import { completeQuest, getQuests, getTodayQuests } from "../controller/questController.js";
import { getProfile } from "../controller/profileController.js";

export let FrontendRoutes = Router()

FrontendRoutes.get("/quests", getQuests);
FrontendRoutes.get("/quests/today/:userId", getTodayQuests);
FrontendRoutes.post("/quests/complete", completeQuest);
FrontendRoutes.get("/profile/:userId", getProfile);