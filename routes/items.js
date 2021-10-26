const express = require('express')
const router = express.Router()
const { DataResponse, ErrorResponse } = require("../models/payload")
const Item = require('../models/item')
const util = require('../middleware/validate-token')
const { logger, LogMessage } = require('../config/winston');

// Get items for all users (excluding the current user)
router.get('/unowned', util.getUser, async (_, res) => {
    try {
        const query = Item.find({ 'createdBy': { $ne: res.id } })
        items = await query.select()
        logger.info("%o", new LogMessage("Items", "Get eligible items", "Successfully retrieved items.", { "userInfo": res.id }))
        res.json(new DataResponse({ items }));
    } catch (err) {
        logger.info("%o", new LogMessage("Items", "Get eligible items", "Unable to retrieve items.", { "userInfo": res.id, "error": err.message }))
        res.status(500).json(new ErrorResponse(err.message));
    }
})

router.get('/owned', util.getUser, async (_, res) => {
    try {
        const query = Item.find({ 'createdBy': { $eq: res.id } })
        items = await query.select()
        logger.info("%o", new LogMessage("Items", "Get eligible items", "Successfully retrieved items.", { "userInfo": res.id }))
        res.json(new DataResponse({ items }));
    } catch (err) {
        logger.info("%o", new LogMessage("Items", "Get eligible items", "Unable to retrieve items.", { "userInfo": res.id, "error": err.message }))
        res.status(500).json(new ErrorResponse(err.message));
    }
})

router.get('/groupedByUser', util.getUser, async (_, res) => {
  try {
    let listOverviews = await Item.aggregate([
  {
    '$addFields': {
      'convertedUserId': {
        '$toObjectId': '$createdBy'
      }
    }
  }, {
    '$match': {
      'createdBy': {
        '$ne': '60d691edaeac5d4ca05550cc'
      }
    }
  }, {
    '$group': {
      '_id': '$convertedUserId',
      'totalItems': {
        '$sum': 1
      },
      'purchasedItems': {
        '$sum': {
          '$cond': [
            '$purchased', 1, 0
          ]
        }
      }
    }
  }, {
    '$lookup': {
      'from': 'users',
      'localField': '_id',
      'foreignField': '_id',
      'as': 'user'
    }
  }, {
    '$unwind': {
      'path': '$user'
    }
  }, {
    '$set': {
      'user.rawId': {
        '$toString': '$_id'
      }
    }
  }, {
    '$project': {
      'totalItems': 1,
      'purchasedItems': 1,
      'user.firstName': 1,
      'user.lastName': 1,
      'user.rawId': 1
    }
  }
])
  logger.info("%o", new LogMessage("Items", "Get user list overview", "Successfully retrieved overviews.", { "userInfo": res.id }))
    res.json(new DataResponse({ listOverviews }));
  } catch (err) {
    logger.info("%o", new LogMessage("Items", "Get user list overview", "Unable to retrieve overviews.", { "userInfo": res.id, "error": err.message }))
    res.status(500).json(new ErrorResponse(err.message));
  }
})


// Get all items (including current user)
router.get('/list', util.getUser, async (_, res) => {
    try {
        const items = await Item.find().lean()

        canRetractPurchase(items, res.id)
        logger.info("%o", new LogMessage("Items", "Get all items.", "Successfully retrieved items."))
        res.json(new DataResponse({ items }));
    } catch (err) {
        logger.info("%o", new LogMessage("Items", "Get all items.", "Unable to retrieve items.", {"error": err.message }))
        res.status(500).json(new ErrorResponse(err.message));
    }
})

// Get all items for single user
router.get('/user/:id', util.getUser, async (req, res) => {
    try {
        const query = Item.find({ 'createdBy': { $eq: req.params.id } })
        items = await query.select().lean()
        canRetractPurchase(items, res.id)
        logger.info("%o", new LogMessage("Items", "Get items created by user.", "Successfully retrieved items.", {"userInfo": req.params.id }))
        res.json(new DataResponse({ items }));
    } catch (err) {
        logger.info("%o", new LogMessage("Items", "Get items created by user.", "Unable to retrieve items.", {"userInfo": req.params.id, "error": err.message }))
        res.status(500).json(new ErrorResponse(err.message));
    }
})

  function canRetractPurchase(items, user) {
    console.log(user)
  items.forEach(item => item['retractablePurchase'] = (item.purchasedBy == user));
}

// Get one item
router.get('/:id', getItem, (_, res) => {
    const item = res.item
    if (item != null) {
        res.json(new DataResponse({ item }));
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
        createdBy: res.id
    })

    try {
        const newItem = await item.save()
        logger.info("%o", new LogMessage("Items", "Create item.", "Successfully created item.", {"itemInfo": newItem._id }))
        res.status(201).json(new DataResponse({ newItem }));
    } catch (err) {
        logger.info("%o", new LogMessage("Items", "Create item.", "Unable to create item.", {"itemInfo": item, "error": err.message }))
        res.status(500).json(new ErrorResponse(err.message));
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
        res.json(new DataResponse({ updatedItem }));
    } catch (err) {
        logger.info("%o", new LogMessage("Items", "Update item.", "Unable to update item.", {"itemInfo": res.item._id, "error": err.message }))
        res.status(400).json({ message: err.message })
    }
})

// Delete an item
router.delete('/:id', async (req, res) => {
    try {
        const item = await Item.findByIdAndRemove(req.params.id)
        logger.info("%o", new LogMessage("Items", "Delete item.", "Successfully deleted item.", {"itemInfo": req.params.id }))
        // res.json({ message: 'Deleted the item' })
        res.json(new DataResponse({ item }));
    } catch (err) {
        logger.info("%o", new LogMessage("Items", "Delete item.", "Unable to delete item.", {"itemInfo": req.params.id, "error": err.message }))
        res.status(500).json(new ErrorResponse(err.message));
    }
})


async function getItem(req, res, next) {
    try {
        item = await Item.findById(req.params.id)
        if (item == null) {
            logger.info("%o", new LogMessage("Items", "Get item.", "Unable to retrieve item.", {"itemInfo": req.params.id }))
            res.status(500).json(new ErrorResponse("Unable to find an item with that id."))
            next()
        } else {
          res.item = item
          logger.info("%o", new LogMessage("Items", "Get item.", "Successfully retrieved item.", {"itemInfo": item.id }))
          next()
        }
    } catch (err) {
        logger.info("%o", new LogMessage("Items", "Get item.", "Failed to retrieve item.", {"itemInfo": req.params.id, "error": err.message }))
        res.status(500).json(new ErrorResponse(err.message));
    }
}

module.exports = router
