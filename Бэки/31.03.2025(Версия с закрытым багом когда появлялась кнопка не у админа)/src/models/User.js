const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    tgId: Number,
    is_bot: Boolean,
    first_name: String,
    username: String,
    language_code: String,
});

const User = mongoose.model('User', userSchema);

module.exports = User;