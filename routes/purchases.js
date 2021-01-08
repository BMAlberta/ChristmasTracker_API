const express = require('express')
const router = express.Router()
const Item = require('../models/item')
const { logger, LogMessage } = require('../config/winston');

// Mark item as purchased
router.post('/', async (req, res) => {
    try {
        const updatedItem = await Item.findByIdAndUpdate({ _id: req.body.itemId }, { purchased: "true", lastEditDate: Date.now() }, { new: true })
        logger.info("%o", new LogMessage("Purchases", "Mark purchased.", "Successfully marked item as purchased.", { "itemInfo": req.body.itemId }))
        res.status(200).json(updatedItem)
    } catch (err) {
        logger.info("%o", new LogMessage("Purchases", "Mark purchased.", "Item cannot marked as purchased.", { "itemInfo": req.body.itemId, "error": err.message }))
        res.status(400).json({ message: err.message })
    }
})

module.exports = router