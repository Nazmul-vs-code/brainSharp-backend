import { Router } from "express";
import { CreateUser,  GetUsreById,  ViewUser } from "../controller/UserController.js";

export let UserRoutes = Router()

UserRoutes.post('/create', CreateUser);


UserRoutes.get('/view', ViewUser);


UserRoutes.get('/users/:id', GetUsreById);