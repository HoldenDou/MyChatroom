var express = require("express")
var app = express();
var credentials = require("./credentials");

var pseudo_db = {
    "Dou": "123456",
    "Jiang": "+1s"
}

// set up handlebars view engine
var handlebars = require('express-handlebars')
	.create({
				defaultLayout: 'main'
 			});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.use(require("cookie-parser")(credentials.cookieSecret));
app.use(require("express-session")());
app.use(require("body-parser")());
app.use(express.static(__dirname + "/public"));

app.use(function (req, res, next) {
    if(req.session.flash) {
        res.locals.flash = req.session.flash;
    }
    delete req.session.flash;
    next();
})

app.get("/", function (req, res) {
    res.render("login");
})

app.post("/", function (req, res) {
    console.log(req.body);
    var username = req.body.username;
    var password = req.body.password;
    if (username in pseudo_db && pseudo_db[username] == password) { // Success
        req.session.username = username;
        req.session.password = password;
        return res.redirect(303, "/home");
    } else {
        req.session.flash = {
            type: "danger",
            intro: "Incorrect Username or Password.",
            message: "<h1>Please Try Again</h1>"
        }
        return res.redirect(303, "/");
    }
})

app.use(function (err, req, res, next) {
    console.log("Uncaught Error");
    console.log(err.toString());
    res.render("500");
})

app.use(function (req, res, next) {
    console.log("Not Found");
    res.render("404");
})

app.listen(3000, function () {
    console.log("Server Starts");
})
