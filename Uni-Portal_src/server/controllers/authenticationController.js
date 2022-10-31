const bcrypt = require("bcrypt");
const User = require("../models/User");

function userIsAuthenticated(req, res, next) {
    if (!req.isAuthenticated())
        return res.redirect("http://localhost:3000/");   
    next();
}

async function authenticateUser(username, password, cb) {
    try {
        const user = await User.findOne({username: username});
        if (!user)
            return cb(null, false, {message: "This username is not registered."});
        const passwordMatches = await bcrypt.compare(password, user.password);
        if (!passwordMatches)
            return cb(null, false, {message: "Incorrect password, is that really you?"});
        return cb(null, user);
    } catch (err) {
        return cb(err);
    }
}

module.exports = {
    userIsAuthenticated,
    authenticateUser
};