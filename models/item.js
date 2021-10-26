const mongoose = require('mongoose')
const itemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    },
    link: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: false,
        default: 3
    },
    quantity: {
        type: Number,
        required: true,
        default: 1
    },
    createdBy: {
        type: String,
        required: true,
        default: "No ID"
    },
    purchased: {
        type: Boolean,
        required: false,
        default: false
    },
    purchasedBy: {
        type: String,
        required: false
    },
    creationDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    lastEditDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    purchaseDate: {
        type: Date,
        required: false,
        default: Date.now
    }
})

module.exports = mongoose.model('Item', itemSchema)
