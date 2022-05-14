require("dotenv").config();
require("./config/database").connect();
const bcrypt = require("bcryptjs/dist/bcrypt");
const express = require("express");
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();

//Cors rule
app.use(cors());


//Logging middleware
const logger = (req, res, next) => {
    console.log((new Date()).toISOString().split("T").join(" ").slice(0,-1) + " " + req.originalUrl + " " + req.ip);
    next();
}
app.use(logger);

// Request forwarding
const fileHandlerRoute = require("./routers/fileHandlerRouter");
app.use("/file", fileHandlerRoute);


//Duration of user session before expiration of token (must be in hours!)
let sessionLength = "1h"; 

app.use(express.json());

const User = require("./model/user");

app.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if(!(username && email && password)){
            res.status(400).send("All inputs are required");
        }

        const oldUser = await User.findOne({ email });


        if(oldUser) {
            return res.status(409).send("User already Exists");
        }

        encryptedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            username,
            email: email.toLowerCase(),
            password: encryptedPassword,
        });

        const token = jwt.sign(
            {user_id: user._id, email},
            process.env.TOKEN_KEY,
            {
                expiresIn: sessionLength,
            }
        );

        user.token = token;

        res.status(201).json({
            "user": user,
            "expiresIn": Number(sessionLength.slice(0,-1))*3600*1000,
        });
    } catch (err) {
        console.log(err);
    }
});

app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if(!(email && password)){
            res.status(400).send("All inputs are required");
            return
        }

        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            const token = jwt.sign(
                { user_id: user.id, email },
                process.env.TOKEN_KEY,
                {
                    expiresIn: sessionLength,
                }
            );

            user.token = token;
            

            res.status(200).json({
                "user": user,
                "expiresIn": Number(sessionLength.slice(0,-1))*3600*1000,
            });
        } else {
            console.log("Invalid Credentials");
            res.status(400).send("Invalid Credentials");
        }
    } catch (err) {
        console.log(err);
    }
});

const auth = require("./middleware/auth");

app.get("/welcome", auth, (req, res) => {
    res.status(200).send("Welcome!!"+JSON.stringify(req.user));
})

module.exports = app;