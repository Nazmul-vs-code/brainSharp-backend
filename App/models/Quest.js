import { DataTypes } from "sequelize";
import Connection from "../config/connection.js";

export const Quest = Connection.define(
    "Quest",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        category: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isIn: [["mental", "physical", "puzzle"]],
            },
        },
        durationMinutes: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
            },
        },
        xpReward: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 0,
            },
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
    },
    {
        tableName: "quests",
        timestamps: true,
    }
);

export const DEFAULT_QUESTS = [
    {
        title: "Meditate for 10 minutes",
        category: "mental",
        durationMinutes: 10,
        xpReward: 10,
        description: "Take a few quiet minutes to focus on your breathing.",
    },
    {
        title: "Move your body",
        category: "physical",
        durationMinutes: 10,
        xpReward: 10,
        description: "Complete a short exercise or stretching session.",
    },
    {
        title: "Solve a puzzle",
        category: "puzzle",
        durationMinutes: 10,
        xpReward: 10,
        description: "Give your mind a workout with a short puzzle.",
    },
];

export async function ensureDefaultQuests() {
    await Quest.bulkCreate(DEFAULT_QUESTS, { ignoreDuplicates: true });
}