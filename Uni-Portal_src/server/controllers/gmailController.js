const axios = require("axios");
const nodemailer = require("nodemailer");
const parseMessage = require("gmail-api-parse-message");
const replyParser = require("node-email-reply-parser");
const {encrypt, decrypt} = require("./encryptionController");
const Mutex = require('async-mutex').Mutex;
const mutex = new Mutex();

function getGmailInbox(gmailAccount) {
    return async (req, res) => {
        if (!gmailAccountIsConnected(req.user, gmailAccount))
            return res.json({
                account: "",
                accountDisplayName: "",
                unreadThreads: [],
                starredThreads: []
            });
        try {
            const unreadThreadsPromise = getThreads(req.user, gmailAccount, "unread");
            const starredThreadsPromise = getThreads(req.user, gmailAccount, "starred");
            const threads = await Promise.all([unreadThreadsPromise, starredThreadsPromise]);
            return res.json({
                account: getEmailAccountName(req.user, gmailAccount),
                accountDisplayName: getGoogleAccount(req.user, gmailAccount).profile.displayName,
                unreadThreads: threads[0].map(thread => {
                    thread.account = gmailAccount;
                    thread.accountDisplayName = getGoogleAccount(req.user, gmailAccount).profile.displayName;
                    thread.labelIds = ["UNREAD"];
                    thread.members = getThreadMembers(
                                        thread,
                                        getEmailAccountDisplayName(req.user, gmailAccount));
                    return thread;
                }),
                starredThreads: threads[1].map(thread => {
                    thread.account = gmailAccount;
                    thread.accountDisplayName = getGoogleAccount(req.user, gmailAccount).profile.displayName;
                    thread.labelIds = ["STARRED"];
                    thread.members = getThreadMembers(
                                        thread,
                                        getEmailAccountDisplayName(req.user, gmailAccount));
                    return thread;
                })
            });
        } catch (err) {
            console.log(err)
            console.log(`Couldnt get threads from ${gmailAccount}.`);
            res.status(500).json({message: err.message});
        }
    }
}

async function getThreads(user, gmailAccount, threadType) {
    try {
        const threadIds = await getThreadIds(user, gmailAccount, threadType);
        let threadPromises = [];
        for (let threadId of threadIds)
            threadPromises.push(getThreadById(user, gmailAccount, threadId));
        const threads = await Promise.all(threadPromises);
        return threads;
    } catch (err) {
        console.log(err)
        console.log(`Couldnt get ${threadType} threads.`);
        throw new Error(err.message);
    }
}

async function getThreadIds(user, gmailAccount, threadType) {
    const request = {
        method: "get",
        url: `https://gmail.googleapis.com/gmail/v1/users/${getEmailAccountName(user, gmailAccount)}/threads?q=is:${threadType}&fields=threads(id)`,
        headers: {
            "Authorization": `Bearer ${getAccessToken(user, gmailAccount)}`,
            "Accept": "application/json",
        }
    };
    try {
        const response = await sendGoogleRequest(user, gmailAccount, request);
        if (response.data.threads === undefined)
            return [];
        return response.data.threads.map(thread => thread.id); 
    } catch (err) {
        if (err.response === undefined)
            console.log(err);
        console.log(`Couldnt get ${threadType} thread ids.`);
        throw new Error(`Unauthorized request, user must re-authorize ${gmailAccount}.`);
    }
}

async function getThreadById(user, gmailAccount, threadId) {
    const request = {
        method: "get",
        url: `https://gmail.googleapis.com/gmail/v1/users/${getEmailAccountName(user, gmailAccount)}/threads/${threadId}?fields=id,messages(id,labelIds,snippet,internalDate,payload)`,
        headers: {
            "Authorization": `Bearer ${getAccessToken(user, gmailAccount)}`,
            "Accept": "application/json",
        }
    };
    try {
        const response = await sendGoogleRequest(user, gmailAccount, request);
        const thread = response.data;
        for (let i = 0; i < thread.messages.length; i++)
            thread.messages[i] = getEmailFromGmailResponse(thread.messages[i], gmailAccount);
        return thread;
    } catch (err) {
        console.log("Couldnt get thread by id.");
        throw new Error(`Unauthorized request, user must re-authorize ${gmailAccount}.`);
    }
}

function getThreadMembers(thread, userDisplayName) {
    let members = [];
    for (let message of thread.messages) {
        let currentMessageSender = extractMessageSenderName(message);
        if (currentMessageSender === userDisplayName)
            currentMessageSender = "me";
        if (!members.includes(currentMessageSender))
            members.push(currentMessageSender);
    }
    return members;
}

function extractMessageSenderName(message) {
    let senderName = message.headers["from"];
    if (senderName.startsWith("<"))
        return senderName.split("<")[1].split("@")[0];
    senderName = senderName.split("<")[0].trim();
    if (senderName.includes("\""))
        return senderName.split("\"")[1].trim();
    return senderName;
}

function getUnreadEmailsFromGmail(gmailAccount) {
    return async (req, res, next) => {
        if (!gmailAccountIsConnected(req.user, gmailAccount))
            return res.json({unreadEmails: []});
        try {
            const unreadEmails = await getUnreadEmails(req.user, gmailAccount);
            res.json({
                account: getEmailAccountName(req.user, gmailAccount),
                unreadEmails: unreadEmails
            });
        } catch (err) {
            console.log(`Couldnt get unread emails from ${gmailAccount}.`);
            res.status(500).json({message: err.message});
        }
    };
}

function gmailAccountIsConnected(user, gmailAccount) {
    const googleAccount = getGoogleAccount(user, gmailAccount);
    if (googleAccount.accessToken === "")
        return false;
    return true;
}

function getGoogleAccount(user, gmailAccount) {
    if (gmailAccount === "gmail1")
        return user.googleAccount1;
    else
        return user.googleAccount2;
}

async function getUnreadEmails(user, gmailAccount) {
    try {
        const unreadEmailIds = await getUnreadEmailIds(user, gmailAccount);
        let unreadEmailPromises = [];
        for (let emailId of unreadEmailIds)
            unreadEmailPromises.push(getEmailById(user, gmailAccount, emailId));
        const unreadEmails = await Promise.all(unreadEmailPromises);
        return unreadEmails;
    } catch (err) {
        console.log("Couldnt get unread emails.");
        throw new Error(err.message);
    }
}

async function getUnreadEmailIds(user, gmailAccount) {
    const request = {
        method: "get",
        url: `https://gmail.googleapis.com/gmail/v1/users/${getEmailAccountName(user, gmailAccount)}/messages?q=is:unread`,
        headers: {
            "Authorization": `Bearer ${getAccessToken(user, gmailAccount)}`,
            "Accept": "application/json"
        }
    };
    try {
        const response = await sendGoogleRequest(user, gmailAccount, request);
        if (response.data.messages === undefined)
            return [];
        return response.data.messages.map(email => email.id); 
    } catch (err) {
        if (err.response === undefined)
            console.log(err)
        console.log("Couldnt get unread email ids.");
        throw new Error(`Unauthorized request, user must re-authorize ${gmailAccount}.`);
    }
}

function getEmailAccountName(user, gmailAccount) {
    return getGoogleAccount(user, gmailAccount).profile.emails[0].value;
}

function getEmailAccountDisplayName(user, gmailAccount) {
    return getGoogleAccount(user, gmailAccount).profile.displayName;
}

function getAccessToken(user, gmailAccount) {
    return decrypt(getGoogleAccount(user, gmailAccount).accessToken);
}

async function sendGoogleRequest(user, gmailAccount, request) {
    let response;
    try {
        response = await axios(request);
    } catch (err) {
        await mutex.runExclusive(async () => {
            await refreshAccessToken(user, gmailAccount);
        });
        request.headers["Authorization"] = `Bearer ${getAccessToken(user, gmailAccount)}`;
        response = await axios(request);
    }
    return response;
}

async function refreshAccessToken(user, gmailAccount) {
    const request = {
        method: "post",
        url: "https://oauth2.googleapis.com/token",
        data: {
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            refresh_token: getRefreshToken(user, gmailAccount),
            grant_type: "refresh_token"
        }
    };
    try {
        const response = await axios(request);
        const newAccessToken = response.data.access_token;
        await saveNewAccessToken(user, gmailAccount, newAccessToken);
        //return newAccessToken;
    } catch (err) {
        if (err.response === undefined)
            console.log(err)
        else
            console.log(err.response.data)
        console.log("Couldnt refresh access token.");
    }
}

function getRefreshToken(user, gmailAccount) {
    return decrypt(getGoogleAccount(user, gmailAccount).refreshToken);
}

async function saveNewAccessToken(user, gmailAccount, newAccessToken) {
    if (gmailAccount === "gmail1")
        user.googleAccount1.accessToken = encrypt(newAccessToken);
    else if (gmailAccount === "gmail2")
        user.googleAccount2.accessToken = encrypt(newAccessToken);
    await user.save();
}

async function getEmailById(user, gmailAccount, id) {
    const request = {
        method: "get",
        url: `https://gmail.googleapis.com/gmail/v1/users/${getEmailAccountName(user, gmailAccount)}/messages/${id}`,
        headers: {
            "Authorization": `Bearer ${getAccessToken(user, gmailAccount)}`,
            "Accept": "application/json"
        }
    };
    try {
        const response = await sendGoogleRequest(user, gmailAccount, request);
        const email = getEmailFromGmailResponse(response.data, gmailAccount);
        return await getEmailWithAttachments(user, gmailAccount, email); 
    } catch (err) {
        console.log(err.response.data)
        console.log("Couldnt get email by id.");
        throw new Error(`Unauthorized request, user must re-authorize ${gmailAccount}.`);
    }
}

function getEmailFromGmailResponse(message, gmailAccount) {
    const email = parseMessage(message);
    email.gmailAccount = gmailAccount;
    email.textPlain = replyParser(email.textPlain).getVisibleText({aggressive: true});
    if (email.attachments !== undefined)
        email.attachments.forEach(attachment => attachment.messageId = message.id);
    return email;
}

async function getEmailWithAttachments(user, gmailAccount, email) {
    if (!email.attachments)
        return email;
    let attachmentPromises = [];
    for (let i = 0; i < email.attachments.length; i++)
        attachmentPromises.push(getEmailAttachment(user, gmailAccount, email, i));
    const attachments = await Promise.all(attachmentPromises);
    for (let i = 0; i < email.attachments.length; i++)
        email.attachments[i].body = attachments[i];
    return email;
}

async function getEmailAttachment(user, gmailAccount, email, attachmentIndex) {
    try {
        const response = await sendGoogleRequest(user, gmailAccount, {
            method: "get",
            url: `https://gmail.googleapis.com/gmail/v1/users/${getEmailAccountName(user, gmailAccount)}/messages/${email.id}/attachments/${email.attachments[attachmentIndex].attachmentId}?fields=attachmentId,data`,
            headers: {
                "Authorization": `Bearer ${getAccessToken(user, gmailAccount)}`,
                "Accept": "application/json"
            }
        });
        return response.data;
    } catch (err) {
        console.log(`Could not get attachment -> '${email.attachments[attachmentIndex].filename}'.`);
    }
}

function sendEmail(gmailAccount) {
    return async (req, res, next) => {
        try {
            const {email} = req.body;
            const transporter = nodemailer.createTransport({
                service: "Gmail",
                auth: {
                    type: "OAuth2",
                    user: getEmailAccountName(req.user, gmailAccount),
                    clientId: process.env.GOOGLE_CLIENT_ID,
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                    refreshToken: getRefreshToken(req.user, gmailAccount),
                    accessToken: getAccessToken(req.user, gmailAccount)
                }
            });
            const response = await transporter.sendMail(email);
            res.json({response: response});
        } catch (err) {
            console.log(`Couldn't send email from ${gmailAccount}.`);
            res.status(500).json({error: err});
        }   
    }
}

function markMessageAsRead(gmailAccount) {
    return async (req, res, next) => {
        try {
            const { messageId } = req.params;
            const request = {
                method: "post",
                url: `https://gmail.googleapis.com/gmail/v1/users/${getEmailAccountName(req.user, gmailAccount)}/messages/${messageId}/modify`,
                headers: {
                    "Authorization": `Bearer ${getAccessToken(req.user, gmailAccount)}`,
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                data: JSON.stringify({
                    addLabelIds: [],
                    removeLabelIds: ["UNREAD"]
                })
            };
            const response = await sendGoogleRequest(req.user, gmailAccount, request);
            res.json({success: true});
        } catch (err) {
            console.log(`Couldn't mark message from ${gmailAccount} as read.`);
            res.status(500).json({error: err});
        }   
    }
}

function modifyThread(gmailAccount) {
    return async (req, res, next) => {
        try {
            const { threadId } = req.params;
            const request = {
                method: "post",
                url: `https://gmail.googleapis.com/gmail/v1/users/${getEmailAccountName(req.user, gmailAccount)}/threads/${threadId}/modify`,
                headers: {
                    "Authorization": `Bearer ${getAccessToken(req.user, gmailAccount)}`,
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                data: req.body
            };
            const response = await sendGoogleRequest(req.user, gmailAccount, request);
            res.json({success: true});
        } catch (err) {
            console.log(err.response.data)
            console.log(`Couldn't modify thread from ${gmailAccount}.`);
            res.status(500).json({error: err});
        }   
    }
}

function getMessageAttachment(gmailAccount) {
    return async (req, res) => {
        try {
            const {
                messageId,
                attachmentId
            } = req.params;
            const response = await sendGoogleRequest(req.user, gmailAccount, {
                method: "get",
                url: `https://gmail.googleapis.com/gmail/v1/users/${getEmailAccountName(req.user, gmailAccount)}/messages/${messageId}/attachments/${attachmentId}?fields=attachmentId,data`,
                headers: {
                    "Authorization": `Bearer ${getAccessToken(req.user, gmailAccount)}`,
                    "Accept": "application/json"
                }
            });
            res.json(response.data);
        } catch (err) {
            console.log(`Could not download attachment`);
            res.status(500).json({error: err});
        }
    }
}

module.exports = { 
    getGmailInbox,
    modifyThread,
    getMessageAttachment,
    getUnreadEmailsFromGmail,
    sendEmail,
    markMessageAsRead
};