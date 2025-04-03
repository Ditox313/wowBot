const mongoose = require('mongoose');

const consultingSchema = new mongoose.Schema({
    tgId: Number,
    username: String,
    createdAt: String,
    type: String,
    chatLink: String
});

const Consulting = mongoose.model('Consulting', consultingSchema);

module.exports = Consulting;