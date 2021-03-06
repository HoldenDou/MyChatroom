var mongoose = require("mongoose");

var chatHistorySchema = mongoose.Schema({
    lastUpdated: Number, // Date()
    chats: [{
        sender: String,
        timestamp: Number,
        content: String
    }]
})

var ChatHistory = mongoose.model("ChatHistory", chatHistorySchema);
module.exports = ChatHistory;
