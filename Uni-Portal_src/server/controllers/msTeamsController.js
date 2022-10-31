const axios = require("axios");
const qs = require("qs");
const {encrypt, decrypt} = require("./encryptionController");

async function getChats(req, res) {
    if (!microsoftAccountIsConnected(req.user))
        return res.json({
            account: "",
            displayName: "",
            chats: []
        });
    try {
        const chatsWithoutMessages = await getChatsWithoutMessages(req.user);
        let chatPromises = [];
        for (let chat of chatsWithoutMessages)
            chatPromises.push(getChatById(req.user, chat.id));
        const allChatsMessages = await Promise.all(chatPromises);
        res.json({
            account: getUserAccount(req.user),
            displayName: getUserDisplayName(req.user),
            chats: getChatsWithMembers(req.user, 
                                        chatsWithoutMessages, 
                                        allChatsMessages)
        });
    } catch (err) {
        console.log("Couldnt get chats from msTeams.");
        res.status(500).json({message: err.message});
    }
}

function microsoftAccountIsConnected(user) {
    if (user.microsoftAccount.accessToken === "")
        return false;
    return true;
}

async function getChatsWithoutMessages(user) {
    const request = {
        method: "get",
        url: `https://graph.microsoft.com/v1.0/users/${getUserId(user)}/chats?$expand=members`,
        headers: {
            "Authorization": `Bearer ${getAccessToken(user)}`
        }
    };
    try {
        const response = await sendMicrosoftRequest(user, request);
        return response.data.value;
    } catch (err) {
        console.log("Could not get MsTeams chats.");
        throw new Error(err.message);
    }
}

function getUserId(user) {
    return user.microsoftAccount.profile.id;
}

function getAccessToken(user) {
    return decrypt(user.microsoftAccount.accessToken);
}

async function getChatById(user, chatId) {
    const request = {
        method: "get",
        url: `https://graph.microsoft.com/v1.0/users/${getUserId(user)}/chats/${chatId}/messages`,
        headers: {
            "Authorization": `Bearer ${getAccessToken(user)}`
        }
    };
    try {
        const response = await sendMicrosoftRequest(user, request);
        return response.data.value;
    } catch (err) {
        console.log(err.response.data)
        console.log("Could not get chat by id.");
        // can't throw error because of null first chat
    }
}

async function sendMicrosoftRequest(user, request) {
    let response;
    try {
        response = await axios(request);
    } catch (err) {
        const newAccessToken = await refreshMicrosoftAccessToken(user);
        request.headers = {
            "Authorization": `Bearer ${newAccessToken}`
        }
        response = await axios(request);
    }
    return response;
}

async function refreshMicrosoftAccessToken(user) {
    const request = {
        method: "post",
        url: `https://login.microsoftonline.com/common/oauth2/v2.0/token`,
        headers: {
            "content-type": "application/x-www-form-urlencoded"
        },
        data: qs.stringify({
            "client_id": process.env.MICROSOFT_CLIENT_ID,
            "grant_type": "refresh_token",
            "scope": [
                "offline_access", "user.read", 
                "Chat.ReadWrite", "Files.ReadWrite.All",
                "User.ReadBasic.All"
            ],
            "refresh_token": getRefreshToken(user),
            "redirect_uri": process.env.MS_TEAMS_CALLBACK_URL,
            "client_secret": process.env.MICROSOFT_CLIENT_SECRET
        })
    };
    try {
        const response = await axios(request);
        const newAccessToken = response.data.access_token;
        const newRefreshToken = response.data.refresh_token;
        await saveNewAccessAndRefreshTokens(user, newAccessToken, newRefreshToken);
        return newAccessToken;
    } catch (err) {
        console.log(err.response.data);
        console.log("Could not refresh Microsoft access token.");
    }
}

function getRefreshToken(user) {
    return decrypt(user.microsoftAccount.refreshToken);
}

async function saveNewAccessAndRefreshTokens(user, newAccessToken, newRefreshToken) {
    user.microsoftAccount.accessToken = encrypt(newAccessToken);
    user.microsoftAccount.refreshToken = encrypt(newRefreshToken);
    await user.save();
}

function getUserDisplayName(user) {
    return user.microsoftAccount.profile.displayName;
}

function getUserAccount(user) {
    return user.microsoftAccount.profile.emails[0].value;
}

function getChatsWithMembers(user, chatsWithoutMessages, allChatsMessages) {
    let chatsWithMembers = [];
    let index = 0;
    for (let chat of chatsWithoutMessages) {
        const chatMembers = getChatMembers(user, chat);
        if (chatMembers.length) {
            chatsWithMembers.push({
                id: chat.id,
                members: chatMembers,
                messages: allChatsMessages[index]
            });
        }
        index++;
    }
    return chatsWithMembers;
}

function getChatMembers(user, chat) {
    let chatMembers = [];
    for (let member of chat.members) {
        if (memberIsNotUser(user, member))
            chatMembers.push({ 
                name: member.displayName,
                email: member.email
            });
    }
    return chatMembers;
}

function memberIsNotUser(user, member) {
    if (member.displayName !== user.microsoftAccount.profile.displayName)
        return true;
    return false;
}

async function sendChatMessage(req, res) {
    try {
        const { message } = req.body;
        const { chatId } = req.params;
        const response = await sendMicrosoftRequest(req.user, {
            method: "post",
            url: `https://graph.microsoft.com/v1.0/chats/${chatId}/messages`,
            headers: {
                "Authorization": `Bearer ${getAccessToken(req.user)}`,
            },
            data: message
        });
        res.json({message: response.data})
    } catch (err) {
        console.log("Couldn't send chat message!");
        res.status(500).json({error: err});
    }
}

async function uploadFileToOneDrive(req, res) {
    try {
        const { file } = req.body;
        const response1 = await sendMicrosoftRequest(req.user, {
            method: "put",
            url: `https://graph.microsoft.com/v1.0/me/drive/items/root:/${file.fileName}:/content`,
            headers: {
                "Authorization": `Bearer ${getAccessToken(req.user)}`
            },
            data: Buffer.from(file.base64FileData, "base64")
        });
        const itemId = response1.data.id;
        const response2 = await sendMicrosoftRequest(req.user, {
            method: "post",
            url: `https://graph.microsoft.com/v1.0/me/drive/items/${itemId}/invite`,
            headers: {
                "Authorization": `Bearer ${getAccessToken(req.user)}`,
                "Content-Type": "application/json"
            },
            data: {
                "requireSignIn": true,
                "sendInvitation": false,
                "roles": ["read"],
                "recipients": [
                    { 
                        "email": file.emailToGivePermissions 
                    }
                ]
            }
        });
        res.json({uploadedFile: response1.data});
    } catch (err) {
        console.log("Couldn't upload file to OneDrive!");
        res.status(500).json({error: err});
    }
}

async function createNewChat(req, res) {
    try {
        const { newChatUserEmailAddress } = req.body;
        const response1 = await sendMicrosoftRequest(req.user, {
            method: "get",
            url: `https://graph.microsoft.com/v1.0/users/${newChatUserEmailAddress}`,
            headers: {
              "Authorization": `Bearer ${getAccessToken(req.user)}`
            }
        });
        const newChat = {
            members: [{
              name: response1.data.displayName,
              email: response1.data.mail
            }],
            messages: []
        };
        const response2 = await sendMicrosoftRequest(req.user, {
            method: "post",
            url: "https://graph.microsoft.com/v1.0/chats",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${getAccessToken(req.user)}`
            },
            data: {
              "chatType": "oneOnOne",
              "members": [
                {
                  "@odata.type": "#microsoft.graph.aadUserConversationMember",
                  "roles": ["owner"],
                  "user@odata.bind": `https://graph.microsoft.com/v1.0/users('${getUserAccount(req.user)}')`
                },
                {
                  "@odata.type": "#microsoft.graph.aadUserConversationMember",
                  "roles": ["owner"],
                  "user@odata.bind": `https://graph.microsoft.com/v1.0/users('${newChatUserEmailAddress}')`
                }
              ]
            }
        });
        console.log(response2)
        newChat.id = response2.data.id
        res.json({newChat: newChat});
    } catch (err) {
        console.log(err.data)
        console.log("Couldn't create new Ms Teams chat!");
        res.status(500).json({error: err});
    }
}

module.exports = {
    getChats,
    sendChatMessage,
    uploadFileToOneDrive,
    createNewChat
};