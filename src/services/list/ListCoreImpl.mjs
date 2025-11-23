import {logger, LogMessage} from '../../config/winston.mjs';
import {sanitizeListAttributes, sanitizeItemAttributes} from '../../util/sanitizeItems.mjs'
import Joi from '@hapi/joi';
import {findMany, findOne, createOne, deleteOne, ProcedureType, updateOne} from "../../util/dataRequest.mjs";

// Error Domain: 6

//Get list details including users
export async function getListDetails(req, userId) {
    let projection = {}
    let listId = req.params.id
    let verbose = req.verbose
    if (verbose === "false") {
        projection['items'] = 0
    }
    try {
        const result = await findOne(ProcedureType.LIST_DETAILS_WITH_ITEMS, listId);

        if (result.listId) {
            sanitizeListAttributes(result, userId)
            logger.info("%o", new LogMessage("ListCoreImpl", "Get list details", "Successfully retrieved list details.", {"listInfo": result.listId}, req))
            return result
        } else {
            logger.warn("%o", new LogMessage("ListCoreImpl", "Get list details", "Unable to find list details for provided ID.", {"listInfo": listId}, req))
            throw Error('No list matching that ID can be found.')
        }
    } catch (err) {
        logger.warn("%o", new LogMessage("ListCoreImpl", "Get list details", "Unable to retrieve list details.", {"listInfo": listId}, req))
        throw err
    }
}

// Get list for owner
export async function getOwnedLists(userId, req) {
    try {
        const result = await findMany(ProcedureType.OWNED_LISTS, userId)
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

    try {
        const newList = await createOne(ProcedureType.CREATE_LIST, [input.value.listName, userId, input.value.listTheme])
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
        const fetchResult = await findOne(ProcedureType.GET_LIST_METADATA, [listId]);
        if (userId !== fetchResult.owner) {
            logger.warn("%o", new LogMessage("ListCoreImpl", "updateList", "Requester is not list owner", {"listInfo": listId}, req))
            throw Error('Requester is not list owner.')
        }
        return await updateOne(ProcedureType.UPDATE_LIST, [listId, reqBody.listName])
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
        const fetchResult = await findOne(ProcedureType.GET_LIST_METADATA, [listId]);
        if (userId !== fetchResult.owner) {
            logger.info("%o", new LogMessage("ListCoreImpl", "deleteList", "Requester is not list owner", {"listInfo": listId}, req))
            throw Error('Requester is not list owner')
        }

        let numberOfItems = Number(fetchResult.numberOfItems)
        if (numberOfItems === 0) {
            logger.info("%o", new LogMessage("ListCoreImpl", "deleteList", "List is not empty", {"listInfo": listId}, req))
            throw Error('List is not empty')
        }

        await deleteOne(ProcedureType.DELETE_LIST, [listId]);
        logger.info("%o", new LogMessage("ListCoreImpl", "deleteList", "Successfully deleted list.", {"listInfo": listId}, req))

        return true
    } catch (err) {
        logger.warn("%o", new LogMessage("ListCoreImpl", "deleteList", "Unable to delete list.", {
            "listInfo": listId, "error": err.message
        }, req))
        throw err
    }
}

export async function validateListStatus(req, res, next) {
    try {
        const listId = req.params.id ? req.params.id : req.body.listId
        const fetchResult = await findOne(ProcedureType.GET_LIST_METADATA, [listId])
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
        listName: Joi.string().required(),
        listTheme: Joi.string().required()
    })
    return schema.validate(data);
}

function updateListValidation(data) {
    const schema = Joi.object({
        listName: Joi.string().required()
    })
    return schema.validate(data);
}


export default {
    createList,
    updateList,
    deleteList,
    getListDetails,
    getOwnedLists,
    validateListStatus,
    sanitizeItemAttributes,
    sanitizeListAttributes
};