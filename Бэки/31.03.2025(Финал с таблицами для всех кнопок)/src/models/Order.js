const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    tgId: Number,
    username: String,
    createdAt: String,
    type: String,
    isMaket: String,
    size: String,
    chatLink: String
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;