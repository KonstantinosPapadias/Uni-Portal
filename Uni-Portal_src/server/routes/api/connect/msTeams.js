const express = require("express");
const passport = require("passport");
const {userIsAuthenticated} = require("../../../controllers/authenticationController");

const router = express.Router();

router
    .get("/", userIsAuthenticated, passport.authorize("msTeams"))
    .get("/callback", userIsAuthenticated, 
                        passport.authorize("msTeams"), 
                        (req, res) => res.redirect("http://localhost:3000"))

module.exports = router;