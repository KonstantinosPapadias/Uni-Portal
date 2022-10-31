const express = require("express");
const {registerUser} = require("../../../controllers/signupController");

const router = express.Router();

router
    .post("/", registerUser)

module.exports = router;