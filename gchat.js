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
// Setup ChatHistory
var ChatHistory = require("./models/chat_history.js");
ChatHistory.find(function (err, found) {
	if (found.length) {
		return;
	}
	new ChatHistory({
		lastUpdated: Date.now(),
		chats: [
			{
				sender: "Admin",
				timestamp: Number(Date.now()),
				content: "Welcome"
			}
		]
	}).save();
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

app.get("/chatroom", function (req, res) {
	if (!req.session.username) {
		req.session.flash = {
			type: "warning",
			intro: "Session Timeout",
			message: "<h1>Please Login Again</h1>"
		}
		return res.redirect(303, "/");
	}
	if(!req.query.lastUpdated) {
		ChatHistory.find(function (err, history) {
			history = history[0];
			res.render("chatroom", {
				lastUpdated: Number(Date.now()), // Server time
				username: req.session.username,
				chats: history.chats
			});
		})
	} else { // poll
		ChatHistory.find(function (err, history) {
			history = history[0];
			if(Number(history.chats[history.chats.length-1].timestamp) <= Number(req.query.lastUpdated)) {
				return res.send("[]");
			}
			// var newChats = history.chats.filter(function (chat) {
			// 	return Number(chat.timestamp) > Number(req.query.lastUpdated);
			// });
			var newChats = [];
			for(let i=history.chats.length-1; Number(history.chats[i].timestamp) > Number(req.query.lastUpdated); --i) {
				newChats.push(history.chats[i]);
			}
			res.send(JSON.stringify(newChats.reverse()));
		})
	}
});

app.post("/chatroom", function (req, res) {
	console.log(req.body);
	req.body.timestamp = Number(Date.now()); // Server time
	ChatHistory.update({}, {$push: {chats: req.body}}, {upsert: true}, function () {
		res.send(null);
	}, function (err) {
		console.log(err.toString());
	})
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
