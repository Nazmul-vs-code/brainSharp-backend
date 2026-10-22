import { DataTypes } from "sequelize";
import Connection from "../config/connection.js";

export const QuestData = Connection.define("QuestData", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.STRING, // Links to Better Auth string user ID
    allowNull: false,
  },
  questId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING, // "mental", "physical", "puzzle"
    allowNull: false,
  },
  durationSpentMinutes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10,
  },
  xpEarned: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: "quest_data",
  timestamps: true,
});

export default QuestData;