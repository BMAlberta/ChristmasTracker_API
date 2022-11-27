const {EmbeddedListModel} = require('../../models/embeddedList')
const {logger, LogMessage} = require('../../config/winston')
const Joi = require("@hapi/joi");

//Get list details including users
async function getListDetails(listId, userId, verbose) {
    let projection = {}
    if (verbose === "false") {
        projection['items'] = 0
    }
    try {
        const result = await EmbeddedListModel.findById(listId, projection)
        let listDetail = result.toObject()
        if (listDetail != null) {
            if (userId === listDetail.owner) {
                listDetail.items.forEach(item => delete (item.purchased))
            } else {
                listDetail.items.forEach(item => {
                    if(userId === item.purchasedBy && item.purchased) {
                        item.retractablePurchase = true
                    } else {
                        item.retractablePurchase = false
                    }
                })
            }
            logger.info("%o", new LogMessage("ListCoreImpl", "Get list details", "Successfully retrieved list details.", {"listInfo": listId}))
            return listDetail
        } else {
            logger.info("%o", new LogMessage("ListCoreImpl", "Get list details", "Unable to find list details for provided ID.", {"listInfo": listId}))
            throw Error('No list matching that ID can be found.')
        }
    } catch (err) {
        logger.info("%o", new LogMessage("ListCoreImpl", "Get list details", "Unable to retrieve list details.", {"listInfo": listId}))
        throw err
    }
}

// Get list for owner
async function getOwnedLists(userId) {
    try {
        const result = await EmbeddedListModel.find({ 'owner': userId }, {
            'name': 1,
            'creationDate': 1,
            'lastUpdateDate': 1,
            'members': 1
        })
        logger.info("%o", new LogMessage("ListCoreImpl", "getOwnedLists", "Successfully retrieved list details.", {"userInfo": userId}))
            return result
    } catch (err) {
        logger.info("%o", new LogMessage("ListCoreImpl", "getOwnedLists", "Unable to retrieve list details.", {"userInfo": userId}))
            throw err
    }
}

//Create a new list
async function createList(userId, reqBody) {
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
        logger.info("%o", new LogMessage("ListCoreImpl", "createList", "Successfully created list.", {"listInfo": newList._id}))
        return newList
    } catch (err) {
        logger.info("%o", new LogMessage("ListCoreImpl", "createList", "Unable to create list.", {
            "listInfo": list, "error": err.message
        }))
        throw err
    }
}

//Update a list
async function updateList(listId, userId, reqBody) {

    let input = updateListValidation(reqBody)

    if (input.error) {
        throw Error('Input validation failed.')
    }

    try {
        const fetchResult = await EmbeddedListModel.findById(listId, {'items': 0})
        if (userId !== fetchResult.owner) {
            logger.info("%o", new LogMessage("ListCoreImpl", "updateList", "Requester is not list owner", {"listInfo": listId}))
            throw Error('Requester is not list owner.')
        }
        fetchResult.name = reqBody.listName
        fetchResult.lastUpdateDate = Date.now()
        return await fetchResult.save()
    } catch (err) {
        logger.info("%o", new LogMessage("ListCoreImpl", "updateList", "Unable to update list.", {
            "listInfo": listId, "error": err.message
        }))
        throw err
    }
}

//Delete a list
async function deleteList(listId, userId) {
    try {
        const fetchResult = await EmbeddedListModel.findById(listId, {'owner': 1})
        if (userId !== fetchResult.owner) {
            logger.info("%o", new LogMessage("ListCoreImpl", "deleteList", "Requester is not list owner", {"listInfo": listId}))
            return false
        }
        await fetchResult.remove()
        logger.info("%o", new LogMessage("ListCoreImpl", "deleteList", "Successfully deleted list.", {"listInfo": listId}))

        return true
    } catch (err) {
        logger.info("%o", new LogMessage("ListCoreImpl", "deleteList", "Unable to delete list.", {
            "listInfo": list, "error": err.message
        }))
        throw err
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

module.exports = {createList, updateList, deleteList, getListDetails, getOwnedLists}