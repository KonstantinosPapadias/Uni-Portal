const bcrypt = require("bcrypt");
const User = require("../models/User");

async function registerUser(req, res, next) {
    try {
        const {username, password} = req.body;
        if (await usernameIsAlreadyUsed(username))
            return res.status(400).json({
                message: "This username is already used, please choose another username."
            })
        const newUser = await createNewUser(username, password);
        await newUser.save();
        req.login(newUser, (err) => res.json({message: "success"}));
    } catch (err) {
        res.status(500).json({message: "Could not register user, please try again later."});
    }
}

async function usernameIsAlreadyUsed(username) {
    const user = await User.findOne({username: username});
    if (user)
        return true;
    return false;
}

async function createNewUser(username, password) {
    const hashedPassword = await bcrypt.hash(password, saltRounds=10);
    return new User({
        username: username,
        password: hashedPassword,
        googleAccount1: {
            accessToken: "",
            refreshToken: "",
            email: {}
        },
        googleAccount2: {
            accessToken: "",
            refreshToken: "",
            email: {}
        },
        microsoftAccount: {
            accessToken: "",
            refreshToken: "",
            profile: {}
        }
    });
}

module.exports = {
    registerUser
};