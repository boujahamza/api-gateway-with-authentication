require("dotenv").config();
require("./config/database").connect();
const bcrypt = require("bcryptjs/dist/bcrypt");
const express = require("express");
const jwt = require('jsonwebtoken');

const app = express();

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
                expiresIn: "2h",
            }
        );

        user.token = token;

        res.status(201).json(user);
    } catch (err) {
        console.log(err);
    }
});

app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if(!(email && password)){
            res.status(400).send("All inputs are required");
        }

        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            const token = jwt.sign(
                { user_id: user.id, email },
                process.env.TOKEN_KEY,
                {
                    expiresIn: "2h",
                }
            );

            user.token = token;

            res.status(200).json(user);
        }
        res.status(400).send("Invalid Credentials");
    } catch (err) {
        console.log(err);
    }
});

const auth = require("./middleware/auth");

app.get("/welcome", auth, (req, res) => {
    res.status(200).send("Welcome!!");
})

module.exports = app;