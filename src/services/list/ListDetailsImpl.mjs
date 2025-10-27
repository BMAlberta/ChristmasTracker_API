import { logger, LogMessage } from '../../config/winston.mjs';
import {sanitizeListAttributes, sanitizeOverviewListAttributes} from '../../util/sanitizeItems.mjs'
import Joi from '@hapi/joi';
import {findMany, findOne, createOne, deleteOne, ProcedureType, updateOne} from "../../util/dataRequest.mjs";

// Error Domain: 7


async function addNewItemToList(userId, req) {
    let reqBody = req.body
    try {
        const fetchResult = await findOne(ProcedureType.GET_LIST_METADATA, [reqBody.listId]);
        if (fetchResult != null) {
            if (userId === fetchResult.owner) {
                return addItemToOwnedList(userId, req)
            } 
            else if (fetchResult.members.includes(userId)) {
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

    try {
        let updatedList = await createOne(ProcedureType.ADD_ITEM_TO_LIST,[reqBody.name, reqBody.description, reqBody.link, reqBody.price, reqBody.quantity, userId, reqBody.listId, reqBody.imageUrl]);
        logger.info("%o", new LogMessage("ListDetailImpl", "addItemToOwnedList", "Successfully added item to list", {
            "listInfo": reqBody.listId, "userInfo": userId
        }, req))

        sanitizeListAttributes(updatedList, userId)
        return updatedList

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

    try {
        let updatedList = await createOne(ProcedureType.ADD_OFFLIST_ITEM_TO_LIST,[reqBody.name, reqBody.description, reqBody.link, reqBody.price, reqBody.quantity, userId, reqBody.listId, reqBody.imageUrl]);
        sanitizeListAttributes(updatedList, userId)
        logger.info("%o", new LogMessage("ListDetailImpl", "addOffListItem", "Successfully added item to list", {
            "listInfo": reqBody.listId, "userInfo": userId
        }, req))
        return updatedList
    } catch (err) {
        logger.warn("%o", new LogMessage("ListDetailImpl", "addOffListItem", "Unable to add item to list.", {"error": err}, req))
        throw err
    }
}


async function getListDetailsWithItems(userId, req) {
    try {

        let fetchResult = await findMany(ProcedureType.GET_LIST_DETAILS_WITH_ITEMS, [userId])
        sanitizeOverviewListAttributes(fetchResult, userId)
        logger.info("%o", new LogMessage("ListDetailImpl", "getListDetailsWithItems", "Successfully fetched overviews.", {"userInfo": userId}, req))
        return fetchResult
    } catch (err) {
        logger.warn("%o", new LogMessage("ListDetailImpl", "getListDetailsWithItems", "Unable to get overviews.", {"error": err}, req))
        throw err
    }
}

async function getOverviewsForList(userId, req) {
    try {

        let fetchResult = await findMany(ProcedureType.MEMBER_LIST_OVERVIEWS, [userId])
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

        const fetchResult = await findOne(ProcedureType.GET_ITEM_METADATA, [reqBody.itemId, reqBody.listId])

        if (fetchResult != null) {
            if (userId !== fetchResult.owner) {
                logger.warn("%o", new LogMessage("ListDetailImpl", "updateItem", "Only list or item owners can update an item.", {
                    "listInfo": reqBody.listId, "itemInfo": reqBody.itemId, "userInfo": userId
                }, req))
                throw Error('Requester must be the owner/creator.')
            }

            let updatedList = await updateOne(ProcedureType.UPDATE_ITEM,[reqBody.itemId, reqBody.listId, reqBody.name, reqBody.description, reqBody.link, reqBody.price, reqBody.quantity])
            logger.info("%o", new LogMessage("ListDetailImpl", "updateItem", "Successfully updated item.", {
                "listInfo": reqBody.listId, "itemInfo": reqBody.itemId, "userInfo": userId
            }, req))
            sanitizeListAttributes(updatedList, userId)
            return updatedList
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
        const fetchResult = await findOne(ProcedureType.GET_ITEM_METADATA, [itemId, listId])
        if (fetchResult == null) {
            logger.warn("%o", new LogMessage("ListDetailsImpl", "deleteItemFromList", "Unable to find the item.", {
                "listInfo": listId, "itemInfo": itemId, "userInfo": userId
            }, req))
            throw Error('Cannot find item.')
        }
        if (userId !== fetchResult.owner) {
            logger.warn("%o", new LogMessage("ListDetailsImpl", "deleteItemFromList", "Only item owners can delete items.", {
                "listInfo": listId, "itemInfo": itemId, "userInfo": userId
            }, req))
            throw Error('Requester must be the owner.')
        }

        if (fetchResult.hasPurchases) {
            logger.warn("%o", new LogMessage("ListDetailsImpl", "deleteItemFromList", "Items with purchases cannot be deleted.", {
                "listInfo": listId, "itemInfo": itemId, "userInfo": userId
            }, req))
            throw Error('Items with purchases cannot be deleted.')
        }

        let updatedList = await deleteOne(ProcedureType.DELETE_ITEM, [itemId, listId])
        logger.info("%o", new LogMessage("ListDetailsImpl", "deleteItemFromList", "Successfully deleted item from list.", {
            "listInfo": listId, "itemInfo": itemId, "userInfo": userId
        }, req))
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
        listId: Joi.string().required(),
        imageUrl: Joi.string().required()
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
        listId: Joi.string().required(),
        imageUrl: Joi.string().required()
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


export default {addNewItemToList, getOverviewsForList, updateItem, deleteItemFromList, getListDetailsWithItems};
