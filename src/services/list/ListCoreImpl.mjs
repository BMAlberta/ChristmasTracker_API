import { EmbeddedListModel } from '../../models/embeddedList.mjs';
import { logger, LogMessage } from '../../config/winston.mjs';
import { sanitizeListAttributes, sanitizeItemAttributes } from '../../util/sanitizeItems.mjs'
import Joi from '@hapi/joi';

//Get list details including users
export async function getListDetails(req, userId) {
    let projection = {}
    let listId = req.params.id
    let verbose = req.verbose
    if (verbose === "false") {
        projection['items'] = 0
    }
    try {
        const result = await EmbeddedListModel.findById(listId, projection)
        let listDetail = result.toObject()
        if (listDetail != null) {
            sanitizeListAttributes(listDetail, userId)
            logger.info("%o", new LogMessage("ListCoreImpl", "Get list details", "Successfully retrieved list details.", {"listInfo": listId}))
            return listDetail
        } else {
            logger.warn("%o", new LogMessage("ListCoreImpl", "Get list details", "Unable to find list details for provided ID.", {"listInfo": listId}))
            throw Error('No list matching that ID can be found.')
        }
    } catch (err) {
        logger.warn("%o", new LogMessage("ListCoreImpl", "Get list details", "Unable to retrieve list details.", {"listInfo": listId}))
        throw err
    }
}

// Get list for owner
export async function getOwnedLists(userId, req) {
    try {
        const result = await EmbeddedListModel.find({ 'owner': userId }, {
            'name': 1,
            'creationDate': 1,
            'lastUpdateDate': 1,
            'status': 1,
            'members': 1
        })
        logger.info("%o", new LogMessage("ListCoreImpl", "getOwnedLists", "Successfully retrieved list details.", {"userInfo": userId}, req))
            return result
    } catch (err) {
        logger.warn("%o", new LogMessage("ListCoreImpl", "getOwnedLists", "Unable to retrieve list details.", {"userInfo": userId}, req))
            throw err
    }
}

//Create a new list
export async function createList(userId, req) {
    let reqBody = req.body
// Validate input
    let input = newListValidation(reqBody)

    if (input.error) {
        throw Error('Input validation failed')
    }
    const list = new EmbeddedListModel({
        name: input.value.listName, owner: userId, members: [userId]
    })
    try {
        const newList = await list.save()
        logger.info("%o", new LogMessage("ListCoreImpl", "createList", "Successfully created list.", {"listInfo": newList._id}, req))
        return newList
    } catch (err) {
        logger.warn("%o", new LogMessage("ListCoreImpl", "createList", "Unable to create list.", {
            "listInfo": list, "error": err.message
        }, req))
        throw err
    }
}

//Update a list
export async function updateList(req, userId) {

    let listId = req.params.id
    let reqBody = req.body
    let input = updateListValidation(reqBody)

    if (input.error) {
        throw Error('Input validation failed.')
    }

    try {
        const fetchResult = await EmbeddedListModel.findById(listId, {'items': 0})
        if (userId !== fetchResult.owner) {
            logger.warn("%o", new LogMessage("ListCoreImpl", "updateList", "Requester is not list owner", {"listInfo": listId}, req))
            throw Error('Requester is not list owner.')
        }
        fetchResult.name = reqBody.listName
        fetchResult.lastUpdateDate = Date.now()
        return await fetchResult.save()
    } catch (err) {
        logger.warn("%o", new LogMessage("ListCoreImpl", "updateList", "Unable to update list.", {
            "listInfo": listId, "error": err.message
        }, req))
        throw err
    }
}

//Delete a list
export async function deleteList(req, userId) {
    let listId = req.params.id
    try {
        const fetchResult = await EmbeddedListModel.findById(listId, {'owner': 1})
        if (userId !== fetchResult.owner) {
            logger.info("%o", new LogMessage("ListCoreImpl", "deleteList", "Requester is not list owner", {"listInfo": listId}, req))
            return false
        }
        await fetchResult.deleteOne()
        logger.info("%o", new LogMessage("ListCoreImpl", "deleteList", "Successfully deleted list.", {"listInfo": listId}, req))

        return true
    } catch (err) {
        logger.warn("%o", new LogMessage("ListCoreImpl", "deleteList", "Unable to delete list.", {
            "listInfo": list, "error": err.message
        }, req))
        throw err
    }
}
export async function validateListStatus(req, res, next) {
    try {
        const fetchResult = await EmbeddedListModel.findById(req.body.listId, {"status": 1})
        if (fetchResult.status === "active") {
            logger.info("%o", new LogMessage("Validate List Status", "validateListStatus", "List active.", {
                "listInfo": req.body.listId
            }, req))
            next()
        } else {
            logger.warn("%o", new LogMessage("Validate List Status", "validateListStatus", "List inactive.", {
                "listInfo": req.body.listId
            }, req))
            return res.status(500).json({
                message: "List not active"
            })
        }
    } catch (err) {
        return res.status(500).json({
            message: "List not active"
        }, req)
    }
}

function newListValidation(data) {
    const schema = Joi.object({
        listName: Joi.string().required()
    })
    return schema.validate(data);
}

function updateListValidation(data) {
    const schema = Joi.object({
        listName: Joi.string().required()
    })
    return schema.validate(data);
}


export default {createList, updateList, deleteList, getListDetails, getOwnedLists, validateListStatus, sanitizeItemAttributes, sanitizeListAttributes};