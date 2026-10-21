import { DataTypes } from "sequelize";
import Connection from "../config/connection.js";

export let User = Connection.define("User",
    {
        id : {
            type : DataTypes.INTEGER,
            autoIncrement : true,
            primaryKey : true
        },

        UserName : {
            type : DataTypes.STRING,
            allowNull : false,

        },

        UserEmail : {
            type : DataTypes.STRING, 
            unique : true,
            allowNull : false,
        }, 
        PhoneNumber : {
            type : DataTypes.STRING,
            allowNull : false,
        }, 
        Message : {
            type : DataTypes.TEXT, // because a message can be bigger then 255 words so let's use TEXT which lets use more
            allowNull : false,
        }
    }, 
    {
        tableName : "users",
        timestamps : true
    }
)