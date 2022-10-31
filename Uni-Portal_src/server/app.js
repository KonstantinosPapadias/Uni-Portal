require('dotenv').config();

const express = require("express");
const mongoose = require("mongoose");
const User = require("./models/User");
const compression = require("compression");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const MicrosoftStrategy = require("passport-microsoft").Strategy;
const {authenticateUser} = require('./controllers/authenticationController');
const {
  authorizeAppForGmail1,
  authorizeAppForGmail2,
  authorizeAppForMsTeams
} = require('./controllers/authorizationController');
const authenticatedRouter = require("./routes/api/auth/authenticated");
const signinRouter = require("./routes/api/auth/signin");
const signupRouter = require("./routes/api/auth/signup");
const signoutRouter = require("./routes/api/auth/signout");
const connectMsTeamsRouter = require("./routes/api/connect/msTeams");
const connectGmail1Router = require("./routes/api/connect/gmail1");
const connectGmail2Router = require("./routes/api/connect/gmail2");
const gmail1Router = require("./routes/api/gmail1");
const gmail2Router = require("./routes/api/gmail2");
const msTeamsRouter = require("./routes/api/msTeams");

const app = express();

// response compression for performance
app.use(compression());

// database
mongoose.connect(process.env.DATABASE_URL);
mongoose.connection
  .on("error", (error) => console.log(error))

// http request body parsing
app
  .use(express.urlencoded({extended: true}))
  .use(express.json({limit: "25mb"}));

// cors
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

// passport and session
app
  .use(session(
    {
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false
    }
  ))
  .use(passport.initialize())
  .use(passport.session());

passport
  .use(new LocalStrategy(authenticateUser))
  .use("gmail1", new GoogleStrategy(
      {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.GMAIL1_CALLBACK_URL,
          passReqToCallback: true
      },
      authorizeAppForGmail1
  ))
  .use("gmail2", new GoogleStrategy(
      {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.GMAIL2_CALLBACK_URL,
          passReqToCallback: true
      },
      authorizeAppForGmail2
  ))
  .use("msTeams", new MicrosoftStrategy(
      {
          clientID: process.env.MICROSOFT_CLIENT_ID,
          clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
          callbackURL: process.env.MS_TEAMS_CALLBACK_URL,
          scope: [
              "offline_access", 
              "user.read", 
              "Chat.ReadWrite", 
              "Files.ReadWrite.All",
              "User.ReadBasic.All"
          ],
          passReqToCallback: true
      },
      authorizeAppForMsTeams
  ))
passport.serializeUser((user, done) => done(null, user.id))
passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => done(err, user))
});

// API endpoints mapping to routers
app
  .use("/api/auth/authenticated", authenticatedRouter)
  .use("/api/auth/signin", signinRouter)
  .use("/api/auth/signout", signoutRouter)
  .use("/api/auth/signup", signupRouter)
  .use("/api/connect/msTeams/", connectMsTeamsRouter)
  .use("/api/connect/gmail1/", connectGmail1Router)
  .use("/api/connect/gmail2/", connectGmail2Router)
  .use("/api/gmail1", gmail1Router)
  .use("/api/gmail2", gmail2Router)
  .use("/api/msTeams", msTeamsRouter)

module.exports = app;