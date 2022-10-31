const express = require("express");
const { userIsAuthenticated } = require("../../../controllers/authenticationController");

const router = express.Router();

router
    .get("/", userIsAuthenticated, (req, res) => {
        req.logout();
        res.redirect("http://localhost:3000");
    });

module.exports = router;