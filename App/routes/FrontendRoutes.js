import { Router } from "express";
import { UserRoutes } from "./UserRoute.js";

export let FrontendRoutes = Router()

FrontendRoutes.use('/web', UserRoutes)