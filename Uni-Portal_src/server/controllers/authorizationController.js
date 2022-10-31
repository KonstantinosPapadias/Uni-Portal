const User = require("../models/User");
const {encrypt} = require("./encryptionController");

async function authorizeAppForGmail1(req, accessToken, refreshToken, profile, cb) {
    try {
        const user = await User.findOne({username: req.user.username});
        user.googleAccount1.accessToken = encrypt(accessToken);
        user.googleAccount1.refreshToken = encrypt(refreshToken);
        user.googleAccount1.profile = profile;
        await user.save();
        return cb(null, user);
    } catch (err) {
        return cb(err);
    }
}

async function authorizeAppForGmail2(req, accessToken, refreshToken, profile, cb) {
    try {
        const user = await User.findOne({username: req.user.username});
        user.googleAccount2.accessToken = encrypt(accessToken);
        user.googleAccount2.refreshToken = encrypt(refreshToken);
        user.googleAccount2.profile = profile;
        await user.save();
        return cb(null, user);
    } catch (err) {
        return cb(err);
    }
}

async function authorizeAppForMsTeams(req, accessToken, refreshToken, profile, cb) {
    try {
        const user = await User.findOne({username: req.user.username});
        user.microsoftAccount.accessToken = encrypt(accessToken);
        user.microsoftAccount.refreshToken = encrypt(refreshToken);
        user.microsoftAccount.profile = profile;
        await user.save();
        return cb(null, user);
    } catch (err) {
        return cb(err);
    }
}

module.exports = {
    authorizeAppForGmail1,
    authorizeAppForGmail2,
    authorizeAppForMsTeams
};