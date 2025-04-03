const mongoose = require('mongoose');

const repairSchema = new mongoose.Schema({
    tgId: Number,
    username: String,
    createdAt: String,
    type: String,
    address: String,
    isPhoto: String,
    chatLink: String,
});

const Repair = mongoose.model('Repair', repairSchema);

module.exports = Repair;