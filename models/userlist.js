var mongoose = require("mongoose");
var userListSchema = mongoose.Schema({
    username: String,
    password: String,
})
var UserList = mongoose.model("UserList", userListSchema);
module.exports = UserList;
