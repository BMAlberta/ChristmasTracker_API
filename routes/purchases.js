const express = require('express')
const router = express.Router()
const { DataResponse, ErrorResponse } = require("../models/payload")
const Item = require('../models/item')
const util = require('../middleware/validate-token')
const { logger, LogMessage } = require('../config/winston');

// Mark item as purchased
router.post('/', util.getUser, async (req, res) => {
    try {
        const updatedItem = await Item.findByIdAndUpdate({ _id: req.body.itemId }, { purchased: "true", purchasedDate: Date.now(), purchasedBy: res.id }, { new: true })
        logger.info("%o", new LogMessage("Purchases", "Mark purchased.", "Successfully marked item as purchased.", { "itemInfo": req.body.itemId }))
        res.json(new DataResponse({updatedItem}));
    } catch (err) {
        logger.info("%o", new LogMessage("Purchases", "Mark purchased.", "Item cannot marked as purchased.", { "itemInfo": req.body.itemId, "error": err.message }))
        res.status(400).json(new ErrorResponse( err.message));
    }
})

// Mark item as not purchased
router.post('/retract', util.getUser, async (req, res) => {
    try {
        const updatedItem = await Item.findByIdAndUpdate({ _id: req.body.itemId }, { purchased: "false", lastEditDate: Date.now() }, { new: true })
        logger.info("%o", new LogMessage("Purchases", "Retract purchased.", "Successfully retracted purchase.", { "itemInfo": req.body.itemId }))
        res.json(new DataResponse({updatedItem}));
    } catch (err) {
        logger.info("%o", new LogMessage("Purchases", "Retract purchased.", "Item purchase cannot be marked as retracted.", { "itemInfo": req.body.itemId, "error": err.message }))
        res.status(400).json(new ErrorResponse( err.message));
    }
})

module.exports = router
