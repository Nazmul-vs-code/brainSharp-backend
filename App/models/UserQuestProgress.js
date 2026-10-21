import { DataTypes } from "sequelize";
import Connection from "../config/connection.js";
import { Quest } from "./Quest.js";

export const UserQuestProgress = Connection.define(
    "UserQuestProgress",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.TEXT,
            allowNull: false,
            references: {
                model: "user",
                key: "id",
            },
        },
        questId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: Quest,
                key: "id",
            },
        },
        assignedDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "pending",
            validate: {
                isIn: [["pending", "completed"]],
            },
        },
        completedDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
    },
    {
        tableName: "user_quest_progress",
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ["userId", "questId", "assignedDate"],
            },
        ],
    }
);

Quest.hasMany(UserQuestProgress, { foreignKey: "questId", as: "userProgress" });
UserQuestProgress.belongsTo(Quest, { foreignKey: "questId", as: "quest" });