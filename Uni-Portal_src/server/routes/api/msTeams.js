const express = require("express");
const {userIsAuthenticated} = require("../../controllers/authenticationController");
const { 
    getChats, 
    sendChatMessage, 
    uploadFileToOneDrive, 
    createNewChat 
} = require("../../controllers/msTeamsController");

const router = express.Router();

router
    .get("/chats", userIsAuthenticated, getChats)
    .post("/chats", userIsAuthenticated, createNewChat)
    .post("/chats/:chatId", userIsAuthenticated, sendChatMessage)
    .post("/drive", userIsAuthenticated, uploadFileToOneDrive)

module.exports = router;