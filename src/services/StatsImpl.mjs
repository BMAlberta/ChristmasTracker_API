import { logger, LogMessage } from '../config/winston.mjs';
import { EmbeddedListModel } from '../models/embeddedList.mjs';

async function getPurchaseOverviews(userId) {
    try {

        let newAggregation = await getPurchaseOverviewsNew(userId)
        let legacyAggregation = await getPurchaseOverviewsLegacy(userId)
        newAggregation = newAggregation.concat(legacyAggregation)
        return newAggregation
        
    } catch (err) {
        logger.info("%o", new LogMessage("StatsImpl", "getPurchaseOverviews", "Unable calcuate spending overviews", {"error": err}))
        throw err
    }
}


async function getPurchaseOverviewsNew(userId) {
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
              '$unwind': {
                'path': '$items.purchaseDetails.purchasers'
              }
            }, {
                '$addFields': {
                    'purchaseYear': {
                        '$toString': {
                            '$year': '$items.purchaseDate'
                        }
                    }
                }
            }, {
              '$match': {
                'items.purchaseDetails.purchasers.purchaserId': {
                  '$eq': userId
                }
              }
            }, {
              '$addFields': {
                'quantityPurchased': '$items.purchaseDetails.purchasers.quantityPurchased'
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
                  '$sum': {
                    '$multiply': [
                      '$items.price', '$quantityPurchased'
                    ]
                  }
                }, 
                'purchasedItems': {
                  '$sum': '$quantityPurchased'
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
                'purchaseYear': '$listInfo.purchaseYear',
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

async function getPurchaseOverviewsLegacy(userId) {
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
                '$addFields': {
                    'purchaseYear': {
                        '$toString': {
                            '$year': '$items.purchaseDate'
                        }
                    }
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
                    'purchaseYear': '$listInfo.purchaseYear',
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


export default {getPurchaseOverviews};