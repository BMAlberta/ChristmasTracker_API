const {logger, LogMessage} = require('../config/winston')
const {EmbeddedListModel} = require('../models/embeddedList')

async function getPurchaseOverviews(userId) {
    try {

        let fetchResult = await EmbeddedListModel.aggregate([
            {
              '$match': {
                '$and': [
                  {
                    'members': {
                      '$in': [
                        userId
                      ]
                    }
                  }, {
                    'owner': {
                      '$ne': userId
                    }
                  }
                ]
              }
            }, {
              '$unwind': {
                'path': '$items'
              }
            }, {
              '$match': {
                'items.purchasedBy': {
                  '$eq': userId
                }
              }
            }, {
              '$addFields': {
                'convertedOwnerId': {
                  '$toObjectId': '$owner'
                }
              }
            }, {
              '$lookup': {
                'from': 'users', 
                'localField': 'convertedOwnerId', 
                'foreignField': '_id', 
                'as': 'ownerDetails'
              }
            }, {
              '$group': {
                '_id': '$_id', 
                'totalSpent': {
                  '$sum': '$items.price'
                }, 
                'purchasedItems': {
                  '$sum': 1
                }, 
                'listInfo': {
                  '$first': '$$ROOT'
                }
              }
            }, {
              '$unwind': {
                'path': '$listInfo.ownerDetails'
              }
            }, {
              '$project': {
                'totalSpent': 1, 
                'purchasedItems': 1, 
                '_id': 0, 
                'listId': '$_id', 
                'listName': '$listInfo.name', 
                'ownerInfo.rawId': '$listInfo.owner', 
                'ownerInfo.firstName': '$listInfo.ownerDetails.firstName', 
                'ownerInfo.lastName': '$listInfo.ownerDetails.lastName'
              }
            }
          ])

        logger.info("%o", new LogMessage("StatsImpl", "getPurchaseOverviews", "Successfully calculated spending overviews.", {"userInfo": userId}))
        return fetchResult
    } catch (err) {
        logger.info("%o", new LogMessage("StatsImpl", "getPurchaseOverviews", "Unable calcuate spending overviews", {"error": err}))
        throw err
    }
}


module.exports = {getPurchaseOverviews}