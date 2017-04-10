var express = require("express")
var app = express();
var credentials = require("./credentials");
// Mongodb Boilerplate
var mongoose = require("mongoose")
var opts = {
	server: {
		socketOptions: {keepAlive: 1}
	}
};
mongoose.connect(credentials.mongo, opts)
// Setup UserList
var UserList = require("./models/userlist.js");
UserList.find(function (err, found) {
    if (found.length) {
        return;
    }
    new UserList({
        username: "Guohao",
        password: "Dudu040803"
    }).save()
    new UserList({
        username: "Admin",
        password: "000000"
    }).save()
})
// set up handlebars view engine
var handlebars = require('express-handlebars')
	.create({
				defaultLayout: 'main'
 			});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

// Boilerplate middlewares
app.use(require("cookie-parser")(credentials.cookieSecret));
app.use(require("express-session")());
app.use(require("body-parser")());
app.use(express.static(__dirname + "/public"));

// Steup mailer
var nodemailer = require("nodemailer");
var mailTransport = nodemailer.createTransport({
	service: "Gmail",
	auth: {
		user: credentials.gmail.username,
		pass: credentials.gmail.password
	}
});

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
    UserList.find({username:username}, function (err, users) {
        console.log(users);
        if(!users.length) { // username not found
            req.session.flash = {
                type: "danger",
                intro: "Nonexistent Username",
                message: "<h1>Please Try Again</h1>"
            }
            res.redirect(303, "/");
        }
        else {
            let user = users[0];
            if (user.password == password) {
                req.session.username = username;
                req.session.password = password;
                return res.redirect(303, "/chatroom");
            } else {
                req.session.flash = {
                    type: "danger",
                    intro: "Incorrect Password",
                    message: "<h1>Please Try Again</h1>"
                }
                res.redirect(303, "/");
            }
        }
    })
})

app.get("/register", function (req, res) {
    res.render("signup");
});

app.post("/register", function (req, res) {
    var email = req.body.email;
    var username = req.body.username;
    var password = req.body.password;
    UserList.find({username: username}, function (err, existingUsers) {
        if (existingUsers.length != 0) {
            // username is already taken
            return res.render("signup", {
                nameExisting: true,
                password: password,
                email: email,
                username: username
            });
        } else {
            UserList.update(
                {username: username},
                {$set: {password: password}},
                {upsert: true}, function () {
                    mailTransport.sendMail({
                        from: '"Our Private Chatroom" <do-not-reply@chatroom.com>',
                        to: email,
                        subject: "Thank you for signing up!",
                        text: "Your username is: " + username + "\nYour password is: " + password
                    }, function (err) {
                        if (err) {
                            console.error("Failed.", err.toString());
                        }
                    });
                    req.session.username = username;
                    req.session.password = password;
                    res.redirect(303, "/chatroom");
                }
            )
        }
    })
});



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
