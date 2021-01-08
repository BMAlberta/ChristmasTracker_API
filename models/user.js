const mongoose = require('mongoose')
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        min: 12,
        unique: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    pwd: {
        type: String,
        required: true,
        min: 6,
        default: "NO_PWD_SET"
    },
    role: {
        type: Number,
        required: false,
        default: 3
    },
    creationDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    lastLogInDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    lastLogInLocation: {
        type: String,
        required: false,
        default: "No-IP"
    }
})

// userSchema.index({
//     email: 1
// },
//     {
//         unique: true
//     }
// )
module.exports = mongoose.model('User', userSchema)