import { QueryTypes } from "sequelize";
import Connection from "../config/connection.js";
import { UserProfile } from "../models/UserProfile.js";

export const getOrCreateUserProfile = async (userId, options = {}) => {
    const users = await Connection.query(
        'SELECT "id" FROM "user" WHERE "id" = $userId LIMIT 1',
        {
            bind: { userId },
            type: QueryTypes.SELECT,
            transaction: options.transaction,
        }
    );
    if (users.length === 0) {
        return null;
    }

    const [profile] = await UserProfile.findOrCreate({
        where: { userId },
        defaults: { userId },
        ...options,
    });
    return profile;
};
