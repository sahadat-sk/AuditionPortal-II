/*
  Fucking Tested!!
*/
const { sequelize } = require("../models");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();
const {
    models: { users },
} = sequelize;
module.exports = (app, passport) => {
    require("../passport/passportjwt")(passport);
    require("../passport/passportgoogle")(passport);
    require("../passport/passportgithub")(passport);

    app.post("/auth/signup", async (req, res) => {
        const { username, email, password, role, phone } = req.body;
        if (role === "su") {
            return res.status(403).json({ success: false });
        } else {
            try {
                const duplicate = await users.findOne({
                    where: { email: email },
                });
                if (duplicate) {
                    throw new Error("User already exsists");
                }

                let hashedPassword = await bcrypt.hash(password, 10);
                 await users.create({
                    username,
                    email,
                    password: hashedPassword,
                    role,
                    phone,
                });

                res.status(201).json({success:true,message:"User registered successfully"})
            } catch (err) {
                res.status(400).json({ success: false, message: err.message });
            }
        }
    });

    app.post("/auth/login", async (req, res) => {
        const { email, password } = req.body;
        // console.log(`Yay! we have email & password ${email} & ${password}`);
        users.getUserByEmail(email).then((data) => {
            try {
                users.comparePassword(
                    password,
                    data.password,
                    async (err, ans) => {
                        if (err) {
                            console.log(err);
                            return res.status(500).json(err);
                        }
                        if (ans) {
                            const payload = {
                                uuid: data.uuid,
                                username: data.username,
                                email: data.email,
                                role: data.role,
                                phone: data.phone,
                                roll: data.roll,
                                clearance: data.clearance,
                            };
                            console.log(JSON.stringify(payload));
                            let token = jwt.sign(payload, process.env.SECRET, {
                                expiresIn: 600000,
                            });
                            if (data.role === "m" || data.role === "su") {
                                // res.cookie("jwt", token);
                                res.json({
                                    success: true,
                                    token: "Bearer " + token,
                                    admin: data.username,
                                });
                            } else {
                                // res.cookie("jwt", token);
                                res.status(201).json({
                                    success: true,
                                    token: "Bearer " + token,
                                    user: "exists already",
                                });
                            }
                        } else {
                            return res.json({
                                success: false,
                                message: "Password does not match",
                            });
                        }
                    }
                );
            } catch (err) {
                console.log(err);
                return res.status(500).json(err);
            }
        });
    });

    app.get("/auth/logout", (req, res) => {
        req.session = null;
        req.logout();
        res.status(200).clearCookie("connect.sid", {
            path: "/",
        });
        res.status(200).clearCookie("jwt", {
            path: "/",
        });
        res.send("Logged out successfully");
    });

    app.get(
        "/auth/google",
        passport.authenticate("google", {
            scope: ["email", "profile"],
        })
    );

    app.get(
        "/auth/google/callback",
        passport.authenticate("google"),
        async (req, res) => {
            const payload = {
                uuid: req.user.uuid,
                username: req.user.username,
                email: req.user.email,
                role: req.user.role,
                phone: req.user.phone,
                roll: req.user.roll,
                clearance: req.user.clearance,
            };
            var token = jwt.sign(payload, process.env.SECRET, {
                expiresIn: 600000,
            });
            // res.cookie("jwt", token);
            if (req.user.mode === "google")
                res.redirect(`${process.env.FRONTEND}?token=${token}`);
            else res.redirect(`${process.env.FRONTEND}?error=email`);
            // res.status(201).json({
            //     success: true,
            //     token: "Bearer " + token,
            //     user: "exists already"
            // });
        }
    );
    app.get("/auth/github", passport.authenticate("github"));

    app.get(
        "/auth/github/callback",
        passport.authenticate("github"),
        async (req, res) => {
            const payload = {
                uuid: req.user.uuid,
                username: req.user.username,
                email: req.user.email,
                role: req.user.role,
                phone: req.user.phone,
                roll: req.user.roll,
                clearance: req.user.clearance,
            };
            var token = jwt.sign(payload, process.env.SECRET, {
                expiresIn: 600000,
            });
            // res.cookie("jwt", token);
            if (req.user.mode === "github")
                res.redirect(`${process.env.FRONTEND}?token=${token}`);
            else res.redirect(`${process.env.FRONTEND}?error=email`);
            //   res.status(201).json({
            //     success: true,
            //     token: "Bearer " + token,
            //     user: "exists already",
            //   });
        }
    );
};
