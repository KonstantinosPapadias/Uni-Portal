const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const userSchema = new Schema({
    username: {type: String, required: true},
    password: {type: String, required: true},
    googleAccount1: {
        accessToken: {type: String},
        refreshToken: {type: String},
        profile: {type: Object}
    },
    googleAccount2: {
        accessToken: {type: String},
        refreshToken: {type: String},
        profile: {type: Object}
    },
    microsoftAccount: {
        accessToken: {type: String},
        refreshToken: {type: String},
        profile: {type: Object}
    }
}, {minimize: false});
const User = mongoose.model("User", userSchema);

module.exports = User;