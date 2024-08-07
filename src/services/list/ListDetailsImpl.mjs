import { logger, LogMessage } from '../../config/winston.mjs';
import { EmbeddedListModel, EmbeddedItemModel } from '../../models/embeddedList.mjs';
import Joi from '@hapi/joi';


async function addItemToList(userId, reqBody) {
    let input = newItemValidation((reqBody))
    if (input.error) {
        throw Error('Input validation failed. ' + input.error)
    }
    const newItem = new EmbeddedItemModel({
        name: reqBody.name,
        description: reqBody.description,
        link: reqBody.link,
        price: reqBody.price,
        quantity: reqBody.quantity,
        createdBy: userId
    })

    try {
        const fetchResult = await EmbeddedListModel.findById(reqBody.listId)

        let listDetail = fetchResult.toObject()
        if (listDetail != null) {
            if (userId !== listDetail.owner) {
                logger.info("%o", new LogMessage("ListDetailImpl", "addItemToList", "Only list owner can add items.", {
                    "listInfo": reqBody.listId, "userInfo": userId
                }))
                throw Error('Requester must be the owner')
            }

            let updatedList = await EmbeddedListModel.findByIdAndUpdate(reqBody.listId, {
                $addToSet: {items: newItem}, lastUpdateDate: Date.now()
            }, {
                new: true
            })

            logger.info("%o", new LogMessage("ListDetailImpl", "addItemToList", "Successfully added item to list", {
                "listInfo": reqBody.listId, "userInfo": userId
            }))
            return updatedList
        }
    } catch (err) {
        logger.info("%o", new LogMessage("ListDetailImpl", "addItemToList", "Unable to add item to list.", {"error": err}))
        throw err
    }
}

async function getOverviewsForList(userId) {
    try {

        let fetchResult = await EmbeddedListModel.aggregate([
            // {
            //     '$match': {
            //         'members': {
            //             '$in': [
            //                 userId
            //             ]
            //         }
            //     }
            // },
            {
                '$match': {
                    'owner': {
                        '$ne': userId
                    }
                }
            }, {
                '$match': {
                    'status': {
                        '$eq': 'active'
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
                '$unwind': {
                    'path': '$members'
                }
            }, {
                '$addFields': {
                    'convertedMemberId': {
                        '$toObjectId': '$members'
                    }
                }
            }, {
                '$lookup': {
                    'from': 'users',
                    'localField': 'convertedMemberId',
                    'foreignField': '_id',
                    'as': 'memberDetails'
                }
            }, {
                '$unwind': {
                    'path': '$memberDetails'
                }
            }, {
                '$group': {
                    '_id': '$_id',
                    'memberInfo': {
                        '$addToSet': '$memberDetails'
                    },
                    'listInfo': {
                        '$first': '$$ROOT'
                    }
                }
            }, {
                '$unwind': {
                    'path': '$listInfo.items'
                }
            }, {
                '$group': {
                    '_id': '$_id',
                    'totalItems': {
                        '$sum': 1
                    },
                    'purchasedItems': {
                        '$sum': {
                            '$cond': [
                                '$listInfo.items.purchased', 1, 0
                            ]
                        }
                    },
                    'listInfo': {
                        '$first': '$listInfo'
                    },
                    'memberInfo': {
                        '$first': '$memberInfo'
                    }
                }
            }, {
                '$unwind': {
                    'path': '$listInfo.ownerDetails'
                }
            }, {
                '$project': {
                    'totalItems': 1,
                    'purchasedItems': 1,
                    '_id': 1,
                    'listName': '$listInfo.name',
                    'lastUpdateDate': '$listInfo.lastUpdateDate',
                    'listStatus': '$listInfo.status',
                    'ownerInfo.rawId': '$listInfo.owner',
                    'ownerInfo.firstName': '$listInfo.ownerDetails.firstName',
                    'ownerInfo.lastName': '$listInfo.ownerDetails.lastName',
                    'memberDetails': {
                        '$map': {
                            'input': '$memberInfo',
                            'as': 'member',
                            'in': {
                                'firstName': '$$member.firstName',
                                'lastName': '$$member.lastName',
                                'id': '$$member._id'
                            }
                        }
                    }
                }
            }
        ])
        logger.info("%o", new LogMessage("ListDetailImpl", "getOverviewsForList", "Successfully fetched overviews.", {"userInfo": userId}))
        return fetchResult
    } catch (err) {
        logger.info("%o", new LogMessage("ListDetailImpl", "getOverviewsForList", "Unable to get overviews.", {"error": err}))
        throw err
    }
}


async function updateItem(userId, reqBody) {
    let input = updateItemValidation((reqBody))
    if (input.error) {
        throw Error('Input validation failed. ' + input.error)
    }

    try {
        const fetchResult = await EmbeddedListModel.findById(reqBody.listId)
        let listDetail = fetchResult.toObject()
        if (listDetail != null) {
            if (userId !== listDetail.owner) {
                logger.info("%o", new LogMessage("ListDetailImpl", "updateItem", "Only list owners can update the list.", {
                    "listInfo": reqBody.listId, "itemInfo": reqBody.itemId, "userInfo": userId
                }))
                throw Error('Requester must be the owner.')
            }

            let updatedList = await EmbeddedListModel.findOneAndUpdate({
                '_id': reqBody.listId, 'items._id': reqBody.itemId
            }, {
                'items.$.name': reqBody.name,
                'items.$.description': reqBody.description,
                'items.$.link': reqBody.link,
                'items.$.price': reqBody.price,
                'items.$.quantity': reqBody.price,
                'items.$.lastEditDate': Date.now()
            }, {
                new: true
            })
            logger.info("%o", new LogMessage("ListDetailImpl", "updateItem", "Successfully updated item.", {
                "listInfo": reqBody.listId, "itemInfo": reqBody.itemId, "userInfo": userId
            }))
            return updatedList
        }
    } catch (err) {
        logger.info("%o", new LogMessage("ListDetailImpl", "updateItem", "Unable to update item.", {
            "listInfo": reqBody.listId, "itemInfo": reqBody.itemId, "userInfo": userId
        }))
        throw err
    }

}

async function deleteItemFromList(listId, userId, itemId) {
    try {
        const fetchResult = await EmbeddedListModel.findOne({
            '_id': listId, 'items._id': itemId
        }, {
            "owner": 1, "items": {$elemMatch: {"_id": itemId}}
        })
        let itemDetail = fetchResult.toObject()
        if (userId !== itemDetail.owner) {
            logger.info("%o", new LogMessage("ListDetailsImpl", "deleteItemFromList", "Only item owners can delete items.", {
                "listInfo": listId, "itemInfo": itemId, "userInfo": userId
            }))
            throw Error('Requester must be the owner.')
        }

        let updatedList = await EmbeddedListModel.findByIdAndUpdate(listId, {
            $pull: {items: {_id: itemId}}, lastUpdateDate: Date.now()
        }, {
            new: true
        })

        logger.info("%o", new LogMessage("ListDetailsImpl", "deleteItemFromList", "Successfully deleted item from list.", {
            "listInfo": listId, "itemInfo": itemId, "userInfo": userId
        }))
        // return {"status": "success"}
        return updatedList
    } catch (err) {
        logger.info("%o", new LogMessage("ListDetailsImpl", "deleteItemFromList", "Unable to delete item from list.", {
            "listInfo": listId, "itemInfo": itemId, "userInfo": userId, "error": err.message
        }))
        throw err
    }
}


function newItemValidation(data) {
    const schema = Joi.object({
        name: Joi.string().required(),
        description: Joi.string().required(),
        link: Joi.string().required(),
        price: Joi.number().required(),
        quantity: Joi.number().integer().required(),
        listId: Joi.string().required()
    })
    return schema.validate(data)
}

function updateItemValidation(data) {
    const schema = Joi.object({
        name: Joi.string().required(),
        description: Joi.string().required(),
        link: Joi.string().required(),
        price: Joi.number().required(),
        quantity: Joi.number().integer().required(),
        listId: Joi.string().required(),
        itemId: Joi.string().required()
    })
    return schema.validate(data)
}


export default {addItemToList, getOverviewsForList, updateItem, deleteItemFromList};
