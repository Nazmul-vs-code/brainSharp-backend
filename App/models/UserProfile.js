import { DataTypes } from "sequelize";
import Connection from "../config/connection.js";

export const UserProfile = Connection.define(
    "UserProfile",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.TEXT,
            allowNull: false,
            unique: true,
            references: {
                model: "user",
                key: "id",
            },
        },
        xp: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: {
                min: 0,
            },
        },
        level: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            validate: {
                min: 1,
            },
        },
        streakCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: {
                min: 0,
            },
        },
        lastActiveDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
    },
    {
        tableName: "user_profiles",
        timestamps: true,
    }
);
