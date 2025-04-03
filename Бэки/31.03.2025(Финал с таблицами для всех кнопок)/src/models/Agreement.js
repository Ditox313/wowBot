const mongoose = require('mongoose');

const agreementSchema = new mongoose.Schema({
    tgId: Number,
    username: String,
    createdAt: String,
    type: String,
    address: String,
    isPhoto: String,
    textBanner: String,
    chatLink: String,
});

const Agreement = mongoose.model('Agreement', agreementSchema);

module.exports = Agreement;