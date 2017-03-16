const fs = require("fs");
const https = require("https");
const express = require("express");
const passport = require("passport");
const cookies = require("cookie-parser");
const bodies = require("body-parser");
const session = require("express-session");
const GoogleStrategy = require("passport-google-oauth2").Strategy;
const assign = Object.assign;
const clientIdent = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const tlsCert = process.env.TLS_CERT;
const tlsKey = process.env.TLS_KEY;
const users = new Map();

var app = express();

google = new GoogleStrategy({
    clientID: clientIdent,
    clientSecret: clientSecret,
    callbackURL: "https://passport.zingle.me/auth/verify"
}, (req, token, refreshToken, profile, done) => {
    var user = users.get(profile.id) || {ident: profile.id, oauth: profile};
    done(null, user);
});

passport.use(google);
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

app.set("json spaces", 2);

app.use(cookies());
app.use(bodies.urlencoded({extended: true}));
app.use(session({secret: "foo", resave: true, saveUninitialized: true}));
app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(__dirname + "/srv"));
app.use("/lib", express.static(__dirname + "/lib"));
app.use("/src", express.static(__dirname + "/src"));
app.use("/dist", express.static(__dirname + "/dist"));

app.get("/auth", passport.authenticate("google", {
    scope: ["profile", "email"]
}));

app.get("/auth/verify", passport.authenticate("google", {
    successRedirect: "/me",
    failureRedirect: "/"
}));

app.get("/me", (req, res) => {
    res.json(req.user);
    res.end();
});

https.createServer({
    key: fs.readFileSync(tlsKey),
    cert: fs.readFileSync(tlsCert)
}, app).listen(443);
