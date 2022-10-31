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
    .get("/threads", userIsAuthenticated, getGmailInbox("gmail1"))
    .get("/messages/:messageId/attachments/:attachmentId", userIsAuthenticated, getMessageAttachment("gmail1"))
    .patch("/threads/:threadId/modify", userIsAuthenticated, modifyThread("gmail1"))
    .get("/messages", userIsAuthenticated, getUnreadEmailsFromGmail("gmail1"))
    .post("/messages", userIsAuthenticated, sendEmail("gmail1"))
    .patch("/messages/:messageId/markAsRead", userIsAuthenticated, markMessageAsRead("gmail1"))

module.exports = router;