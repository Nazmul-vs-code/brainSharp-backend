import express from "express"
import dotenv from 'dotenv'
import Connection, { connectDb } from "./App/config/connection.js";
import "./App/models/User.js";
import "./App/models/AllMode.js";
import { FrontendRoutes } from "./App/routes/FrontendRoutes.js";
dotenv.config()

const app = express();

app.use(express.json());
// app.use(cors())

const PORT = process.env.PORT


app.use(express.urlencoded({ extended: true }));

app.use('/api', FrontendRoutes)  // Route is /api/web/create

app.get('/', async (req, res) => {
    res.send("Hello Wordl!!");
})

let syncDb = async () => {
    // COnnection to db
    await connectDb()

    // autometic table connections 
    Connection.sync({
        alter: true
    })


    // Create user 




    // Server Starts
    app.listen(PORT, () => {
        console.log(`Server connected : http://localhost:${PORT}`)
    })
}

syncDb()