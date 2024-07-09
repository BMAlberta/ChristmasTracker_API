import mongoose from 'mongoose';

const embeddedItemSchema = new mongoose.Schema({
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
        required: false
    }
})

const embeddedListSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        default: ""
    },
    owner: {
        type: String,
        required: true,
        default: ""
    },
    members: {
        type: Array,
        required: false,
        default: []
    },
    creationDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    lastUpdateDate: {
        type: Date,
        required: true,
        default: Date.now
    },

    items: {
        type: [embeddedItemSchema],
        required: false,
        default: []
    },
    status: {
        type: String,
        required: true,
        default: "active"
    }
})
export const EmbeddedListModel = mongoose.model('EmbeddedList', embeddedListSchema)
export const EmbeddedItemModel = mongoose.model('EmbeddedItem', embeddedItemSchema)
