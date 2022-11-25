const express = require("express")
const cors = require("cors")
const jwt = require("jsonwebtoken")
const dotenv = require("dotenv")
const {connectMongoDb}  = require("./server/MongoConnect")


const app = express()

app.use(cors())
dotenv.config()
app.use(express.json())

const PORT  = process.env.PORT || 5000

        // mongodb connection
    connectMongoDb()

    app.listen(PORT,() => {
        console.log(`server listen on port ${PORT}`);
    })



