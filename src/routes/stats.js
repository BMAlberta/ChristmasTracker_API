const express = require('express')
const router = express.Router()
const { DataResponse, ErrorResponse } = require("../models/payload")
const Item = require('../models/item')
const util = require('../middleware/validate-token')
const { logger, LogMessage } = require('../config/winston');


router.get('/purchases', util.getUser, async (_, res) => {
  try {
    let spentOverviews = await Item.aggregate([
  {
    '$addFields': {
      'convertedUserId': {
        '$toObjectId': '$createdBy'
      }
    }
  }, {
    '$match': {
      '$and': [
        {
          'purchased': {
            '$eq': true
          }
        }, {
          'purchasedBy': {
            '$eq': res.id
          }
        }
      ]
    }
  }, {
    '$group': {
      '_id': '$convertedUserId',
      'totalSpent': {
        '$sum': '$price'
      },
      'purchasedItems': {
        '$sum': 1
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
      'totalSpent': 1,
      'purchasedItems': 1,
      'user.firstName': 1,
      'user.lastName': 1,
      'user.rawId': 1
    }
  }
])
  logger.info("%o", new LogMessage("Stats", "Get purchase stats", "Successfully retrieved purchase stats.", { "userInfo": res.id }))
    res.json(new DataResponse({ spentOverviews }));
  } catch (err) {
    logger.info("%o", new LogMessage("Stats", "Get purchase stats", "Unable to retrieve purchase stats.", { "userInfo": res.id, "error": err.message }))
    res.status(500).json(new ErrorResponse(err.message));
  }
})

module.exports = router
