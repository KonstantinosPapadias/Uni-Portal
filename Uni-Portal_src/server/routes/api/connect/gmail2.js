const express = require("express");
const passport = require("passport");
const {userIsAuthenticated} = require("../../../controllers/authenticationController");

const router = express.Router();
const googleScopes = [
    "https://mail.google.com/",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile"
];
const authorizationParams = {
    scope: googleScopes,
    accessType: "offline",
    prompt: "consent"
}

router
    .get("/", userIsAuthenticated, passport.authorize("gmail2", authorizationParams))
    .get("/callback", userIsAuthenticated, 
                        passport.authorize("gmail2", authorizationParams), 
                        (req, res) => res.redirect("http://localhost:3000"))

module.exports = router;