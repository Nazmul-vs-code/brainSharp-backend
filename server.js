import express from "express"
import dotenv from 'dotenv'
import cors from "cors";
import Connection, { connectDb } from "./App/config/connection.js";
import { ensureDefaultQuests } from "./App/models/index.js";
import { FrontendRoutes } from "./App/routes/FrontendRoutes.js";
dotenv.config()

const app = express();

app.use(cors({
    origin: "*",
    credentials: false,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
}));

app.use(express.json());

const PORT = process.env.PORT || 5000;
app.use(express.urlencoded({ extended: true }));
app.use('/api', FrontendRoutes)  // Route is /api/web/create

app.get('/', async (req, res) => {
    res.send("Hello Wordl!!");
})

app.use((error, req, res, next) => {
    console.error(error);
    if (res.headersSent) {
        return next(error);
    }
    return res.status(500).json({ error: "Internal server error." });
});

const startServer = async () => {
    await connectDb();
    await Connection.sync({ alter: true });
    await ensureDefaultQuests();
    app.listen(PORT, () => {
        // console.log(`Server connected : http://localhost:${PORT}`);
    });
};

startServer().catch((error) => {
    console.error("Failed to start server:", error);
    process.exitCode = 1;
});