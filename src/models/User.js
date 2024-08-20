const mongoose = require('mongoose');
const Schema = mongoose.Schema


const UserSchema = new Schema({
    tgId: {
        type: String,
        required: true,
    },
    first_name: {
        type: String,
        required: true, 
    },
    username: {
        type: String,
        required: true, 
    }
})


mongoose.model('users', UserSchema)