const express = require('express')
const router = express.Router()
const Item = require('../models/item')
const util = require('../middleware/validate-token')
const { logger, LogMessage } = require('../config/winston');

// Get items for all users
router.get('/', util.getUser, async (req, res) => {
    try {
        const query = Item.find({ 'createdBy': { $ne: res.id } })
        items = await query.select()
        logger.info("%o", new LogMessage("Items", "Get eligible items", "Successfully retrieved items.", { "userInfo": res.id }))
        res.json({ items })
    } catch (err) {
        logger.info("%o", new LogMessage("Items", "Get eligible items", "Unable to retrieve items.", { "userInfo": res.id, "error": err.message }))
        res.status(500).json({ message: err.message })
    }
})

// Get all items
router.get('/all', util.getUser, async (req, res) => {
    try {
        const items = await Item.find()
        logger.info("%o", new LogMessage("Items", "Get all items.", "Successfully retrieved items."))
        res.json(items)
    } catch (err) {
        logger.info("%o", new LogMessage("Items", "Get all items.", "Unable to retrieve items.", {"error": err.message }))
        res.status(500).json({ message: err.message })
    }
})

// Get one item
router.get('/:id', getItem, (req, res) => {
    res.json(res.item)
})

// Get all items for single user
router.get('/user/:id', async (req, res) => {
    try {
        const query = Item.find({ 'createdBy': req.params.id })
        items = await query.select()
        logger.info("%o", new LogMessage("Items", "Get items created by user.", "Successfully retrieved items.", {"userInfo": req.params.id }))
        res.json(items)
    } catch (err) {
        logger.info("%o", new LogMessage("Items", "Get items created by user.", "Unable to retrieve items.", {"userInfo": req.params.id, "error": err.message }))
        return res.status(500).json({ message: err.message })
    }
})

// Create an item
router.post('/', util.getUser, async (req, res) => {
    const item = new Item({
        name: req.body.name,
        description: req.body.description,
        link: req.body.link,
        price: req.body.price,
        quantity: req.body.quantity,
        category: req.body.category,
        createdBy: res.id
    })

    try {
        const newItem = await item.save()
        logger.info("%o", new LogMessage("Items", "Create item.", "Successfully created item.", {"itemInfo": newItem._id }))
        res.status(201).json(newItem)
    } catch (err) {
        logger.info("%o", new LogMessage("Items", "Create item.", "Unable to create item.", {"itemInfo": item, "error": err.message }))
        res.status(400).json({ message: err.message })
    }
})

// Update an item
router.patch('/:id', getItem, async (req, res) => {
    if (req.body.name != null) {
        res.item.name = req.body.name
    }

    if (req.body.description != null) {
        res.item.description = req.body.description
    }

    if (req.body.link != null) {
        res.item.link = req.body.link
    }

    if (req.body.price != null) {
        res.item.price = req.body.price
    }

    if (req.body.quantity != null) {
        res.item.quantity = req.body.quantity
    }

    if (req.body.category != null) {
        res.item.category = req.body.category
    }

    try {
        res.item.lastEditDate = Date.now()
        const updatedItem = await res.item.save()
        res.json(updatedItem)
    } catch (err) {
        logger.info("%o", new LogMessage("Items", "Update item.", "Unable to update item.", {"itemInfo": res.item._id, "error": err.message }))
        res.status(400).json({ message: err.message })
    }
})

// Delete an item
router.delete('/:id', getItem, async (req, res) => {
    try {
        await res.item.remove()
        logger.info("%o", new LogMessage("Items", "Delete item.", "Successfully deleted item.", {"itemInfo": res.item._id }))
        res.json({ message: 'Deleted the item' })
    } catch (err) {
        logger.info("%o", new LogMessage("Items", "Delete item.", "Unable to delete item.", {"itemInfo": res.item._id, "error": err.message }))
        return res.status(500).json({ message: err.message })
    }
})


async function getItem(req, res, next) {
    try {
        item = await Item.findById(req.params.id)
        if (item == null) {
            logger.info("%o", new LogMessage("Items", "Get item.", "Unable to retrieve item.", {"itemInfo": req.params.id }))
            return res.status(404).json({
                message: 'Unable to find a item with that id'} )
        }
    } catch (err) {
        logger.info("%o", new LogMessage("Items", "Get item.", "Failed to retrieve item.", {"itemInfo": req.params.id, "error": err.message }))
        return res.status(500).json({ message: err.message })
    }

    res.item = item
    logger.info("%o", new LogMessage("Items", "Get item.", "Successfully retrieved item.", {"itemInfo": req.params.id }))
    next()
}

module.exports = router