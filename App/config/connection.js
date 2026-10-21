import dotenv from 'dotenv'
dotenv.config()

import { Sequelize } from "sequelize"

let Connection = new Sequelize(
    process.env.DATABASE_URL,
    // process.env.Db_Username,
    // process.env.Db_Password,
    {
        // host: process.env.DB_HOST,
        // port:  Number(process.env.DB_PORT) || 5432,
        dialect: "postgres",
        logging: false
    }
)

export let connectDb = async () => {
    await Connection.authenticate()
        .then(() => console.log("DB connected!"))
        .catch((err) => {
            console.log("Error:", err.message);
        });
};


export default Connection;