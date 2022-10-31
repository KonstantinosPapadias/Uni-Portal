const express = require("express");
const {userIsAuthenticated} = require("../../controllers/authenticationController");
const {
    getGmailInbox,
    modifyThread,
    getMessageAttachment,
    getUnreadEmailsFromGmail, 
    sendEmail,
    markMessageAsRead
} = require("../../controllers/gmailController");

const router = express.Router();

router
    .get("/threads", userIsAuthenticated, getGmailInbox("gmail2"))
    .get("/messages/:messageId/attachments/:attachmentId", userIsAuthenticated, getMessageAttachment("gmail2"))
    .patch("/threads/:threadId/modify", userIsAuthenticated, modifyThread("gmail2"))
    .get("/messages", userIsAuthenticated, getUnreadEmailsFromGmail("gmail2"))
    .post("/messages", userIsAuthenticated, sendEmail("gmail2"))
    .patch("/messages/:messageId/markAsRead", userIsAuthenticated, markMessageAsRead("gmail2"))

module.exports = router;