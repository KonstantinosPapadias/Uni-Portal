const express = require("express");
const passport = require("passport");
const { userIsAuthenticated } = require("../../../controllers/authenticationController");

const router = express.Router();

router
    .post("/", passport.authenticate("local", {
        successRedirect: "/api/auth/signin/success",
        failureRedirect: "/api/auth/signin/failure",
        failureMessage: true
    }))
    .get("/success", userIsAuthenticated, (req, res, next) => {
        res.json({message: "success"})
    })
    .get("/failure", (req, res, next) => {
        const failureMessage = req.session.messages[0];
        req.session.messages.pop();
        res.status(400).json({message: failureMessage});
    });

module.exports = router;