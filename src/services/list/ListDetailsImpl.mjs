import { logger, LogMessage } from '../../config/winston.mjs';
import { EmbeddedListModel, EmbeddedItemModel } from '../../models/embeddedList.mjs';
import { sanitizeListAttributes, sanitizeItemAttributes } from '../../util/sanitizeItems.mjs'
import Joi from '@hapi/joi';
import { ObjectId } from 'mongodb';




async function addNewItemToList(userId, req) {
    let reqBody = req.body
    try {
        const fetchResult = await EmbeddedListModel.findById(reqBody.listId)

        let listDetail = fetchResult.toObject()
        if (listDetail != null) {
            if (userId == listDetail.owner) {
                return addItemToOwnedList(userId, req)
            } 
            else if (listDetail.members.includes(userId)) {
                return addNewItemToUnownedList(userId, req)
            }
            else {
                logger.warn("%o", new LogMessage("ListDetailImpl", "addNewItemToList", "Must either a list owner or a list member to add items.", {
                    "listInfo": reqBody.listId, "userInfo": userId
                }, req))
                throw Error('Must be a member.')
            }
        }
    } catch (err) {
        logger.warn("%o", new LogMessage("ListDetailImpl", "addItemToList", "Unable to add item to list.", {"error": err}, req))
        throw err
    }

}

async function addItemToOwnedList(userId, req) {
    let reqBody = req.body
    let input = newItemValidation((reqBody))
    if (input.error) {
        logger.warn("%o", new LogMessage("ListDetailImpl", "addNewItemToOwnedList", "Input validation failed", {"error": input.error}, req))
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
        let updatedList = await EmbeddedListModel.findByIdAndUpdate(reqBody.listId, {
            $addToSet: {items: newItem}, lastUpdateDate: Date.now()
        }, {
            new: true
        })

        logger.info("%o", new LogMessage("ListDetailImpl", "addItemToOwnedList", "Successfully added item to list", {
            "listInfo": reqBody.listId, "userInfo": userId
        }, req))

        const result = updatedList.toObject()
        sanitizeListAttributes(result, userId)
        return result

    } catch (err) {
        logger.warn("%o", new LogMessage("ListDetailImpl", "addItemToOwnedList", "Unable to add item to list.", {"error": err}, req))
        throw err
    }
}

async function addNewItemToUnownedList(userId, req) {
    let reqBody = req.body

    let input = newOffListItemValidation((reqBody))
    if (input.error) {
        logger.warn("%o", new LogMessage("ListDetailImpl", "addNewItemToUnownedList", "Input validation failed", {"error": input.error}, req))
        throw Error('Input validation failed. ' + input.error)
    }

    const purchaseInfo = {
        purchaserId: userId,
        quantityPurchased: reqBody.quantity,
    }

    const newItem = new EmbeddedItemModel({
        name: reqBody.name,
        description: reqBody.description,
        link: reqBody.link,
        price: reqBody.price,
        quantity: reqBody.quantity,
        createdBy: userId,
        offListItem: true,
        purchaseDetails: {
            purchasers: [purchaseInfo]
        }
    })
    

    try {
        let updatedList = await EmbeddedListModel.findByIdAndUpdate(reqBody.listId, {
            $addToSet: {items: newItem}, lastUpdateDate: Date.now()
        }, {
            new: true
        })
        const result = updatedList.toObject()
        sanitizeListAttributes(result, userId)
        logger.info("%o", new LogMessage("ListDetailImpl", "addOffListItem", "Successfully added item to list", {
            "listInfo": reqBody.listId, "userInfo": userId
        }, req))
        return result
    } catch (err) {
        logger.warn("%o", new LogMessage("ListDetailImpl", "addOffListItem", "Unable to add item to list.", {"error": err}, req))
        throw err
    }
}

async function getOverviewsForList(userId, req) {
    try {

        let fetchResult = await EmbeddedListModel.aggregate([
            {
                '$match': {
                    'members': {
                        '$in': [
                            userId
                        ]
                    }
                }
            },
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
                '$unwind': {
                    'path': '$listInfo.items.purchaseDetails.purchasers',
                    'preserveNullAndEmptyArrays': true
                }
            }, {
                '$group': {
                    '_id': '$_id',
                    'totalItems': {
                        '$sum': 1
                    },
                    'purchasedItems': {
                        '$sum': {
                          '$cond': ['$listInfo.items.purchaseDetails.purchasers.quantityPurchased', 1, 0]
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
        logger.info("%o", new LogMessage("ListDetailImpl", "getOverviewsForList", "Successfully fetched overviews.", {"userInfo": userId}, req))
        return fetchResult
    } catch (err) {
        logger.warn("%o", new LogMessage("ListDetailImpl", "getOverviewsForList", "Unable to get overviews.", {"error": err}, req))
        throw err
    }
}

async function updateItem(userId, req) {
    let reqBody = req.body
    let input = updateItemValidation((reqBody))
    if (input.error) {
        logger.warn("%o", new LogMessage("ListDetailImpl", "updateItem", "Input validation failed", {"error": input.error}, req))
        throw Error('Input validation failed. ' + input.error)
    }

    try {
        const fetchResult = await EmbeddedListModel.findById(reqBody.listId)
        let listDetail = fetchResult.toObject()

        if (listDetail != null) {
            var convertedItemId = new ObjectId(reqBody.itemId)
            var item = listDetail.items.find(obj => {
            return String(obj._id) === reqBody.itemId
            })
            if (userId !== item.createdBy) {
                logger.warn("%o", new LogMessage("ListDetailImpl", "updateItem", "Only list or item owners can update an item.", {
                    "listInfo": reqBody.listId, "itemInfo": reqBody.itemId, "userInfo": userId
                }, req))
                throw Error('Requester must be the owner/creator.')
            }

            let updatedList = await EmbeddedListModel.findOneAndUpdate({
                '_id': reqBody.listId, 'items._id': reqBody.itemId
            }, {
                'items.$.name': reqBody.name,
                'items.$.description': reqBody.description,
                'items.$.link': reqBody.link,
                'items.$.price': reqBody.price,
                'items.$.quantity': reqBody.quantity,
                'items.$.lastEditDate': Date.now()
            }, {
                new: true
            })
            logger.info("%o", new LogMessage("ListDetailImpl", "updateItem", "Successfully updated item.", {
                "listInfo": reqBody.listId, "itemInfo": reqBody.itemId, "userInfo": userId
            }, req))
            const result = updatedList.toObject()
            sanitizeListAttributes(result, userId)
            return result
        }
    } catch (err) {
        logger.warn("%o", new LogMessage("ListDetailImpl", "updateItem", "Unable to update item.", {
            "listInfo": reqBody.listId, "itemInfo": reqBody.itemId, "userInfo": userId, "error": err
        }, req))
        throw err
    }

}

async function deleteItemFromList(req, userId) {
    let listId = req.params.id
    let itemId = req.query.itemId
    try {
        const fetchResult = await EmbeddedListModel.findOne({
            '_id': listId, 'items._id': itemId
        }, {
            "owner": 1, "items": {$elemMatch: {"_id": itemId}}
        })
        let listDetail = fetchResult.toObject()
        let itemDetail = listDetail.items[0]
        if (itemDetail == null) {
            logger.warn("%o", new LogMessage("ListDetailsImpl", "deleteItemFromList", "Unable to find the item.", {
                "listInfo": listId, "itemInfo": itemId, "userInfo": userId
            }, req))
            throw Error('Cannot find item.')
        }
        if (userId !== itemDetail.createdBy) {
            logger.warn("%o", new LogMessage("ListDetailsImpl", "deleteItemFromList", "Only item owners can delete items.", {
                "listInfo": listId, "itemInfo": itemId, "userInfo": userId
            }, req))
            throw Error('Requester must be the owner.')
        }

        let updatedList = await EmbeddedListModel.findByIdAndUpdate(listId, {
            $pull: {items: {_id: itemId}}, lastUpdateDate: Date.now()
        }, {
            new: true
        })

        logger.info("%o", new LogMessage("ListDetailsImpl", "deleteItemFromList", "Successfully deleted item from list.", {
            "listInfo": listId, "itemInfo": itemId, "userInfo": userId
        }, req))
        // return {"status": "success"}
        return updatedList
    } catch (err) {
        logger.warn("%o", new LogMessage("ListDetailsImpl", "deleteItemFromList", "Unable to delete item from list.", {
            "listInfo": listId, "itemInfo": itemId, "userInfo": userId, "error": err.message
        }, req))
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

function newOffListItemValidation(data) {
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


export default {addNewItemToList, getOverviewsForList, updateItem, deleteItemFromList};
