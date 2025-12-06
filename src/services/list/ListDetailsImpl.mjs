import { logger, LogMessage } from '../../config/winston.mjs';
import {sanitizeListAttributes, sanitizeOverviewListAttributes} from '../../util/sanitizeItems.mjs'
import Joi from '@hapi/joi';
import {findMany, findOne, createOne, deleteOne, ProcedureType, updateOne} from "../../util/dataRequest.mjs";
import axios from "axios";
import * as cheerio from 'cheerio';

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
        let updatedList = await createOne(ProcedureType.ADD_ITEM_TO_LIST,[reqBody.name, reqBody.description, reqBody.link, reqBody.price, reqBody.quantity, reqBody.priority, reqBody.imageUrl, userId, reqBody.listId]);
        logger.info("%o", new LogMessage("ListDetailImpl", "addItemToOwnedList", "Successfully added item to list", {
            "listInfo": reqBody.listId, "userInfo": userId
        }, req))
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
        if (fetchResult !== undefined) {
            sanitizeOverviewListAttributes(fetchResult, userId)
        } else {
            fetchResult = []
        }

        logger.info("%o", new LogMessage("ListDetailImpl", "getListDetailsWithItems", "Successfully fetched overviews.", {"userInfo": userId}, req))
        return fetchResult
    } catch (err) {
        logger.warn("%o", new LogMessage("ListDetailImpl", "getListDetailsWithItems", "Unable to get overviews.", {"error": err.message}, req))
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
            let updatedList = await updateOne(ProcedureType.UPDATE_ITEM,[reqBody.itemId, reqBody.listId, reqBody.name, reqBody.description, reqBody.link, reqBody.price, reqBody.quantity, reqBody.priority, reqBody.imageUrl])
            logger.info("%o", new LogMessage("ListDetailImpl", "updateItem", "Successfully updated item.", {
                "listInfo": reqBody.listId, "itemInfo": reqBody.itemId, "userInfo": userId
            }, req))
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

async function fetchImageUrlForItem(req, userId) {
    const url = req.body.itemUrl;

    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent' : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
                'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'sec-fetch-dest':'document',
                'Content-Type':'text/html; charset=utf-8'
            }
        })
        const $ = cheerio.load(response.data);

        const allImages = $('img').toArray();
        const ogImage = $('meta[property="og:image"]').attr('content');
        const twitterImage = $('meta[name="twitter:image"]').attr('content');
        const firstImg = $('img').first().attr('src');

        const amazonFilteredImages = allImages.filter(div => div.attribs.id === 'landingImage');
        let amazonImage
        if (amazonFilteredImages.length > 0) {
            amazonImage = amazonFilteredImages[0].attribs.src
        }
        const imageUrl = amazonImage || ogImage || twitterImage || firstImg;
        return imageUrl

    } catch (err) {
        logger.warn("%o", new LogMessage("ListDetailsImpl", "fetchImageUrlForItem", "Unable to fetch image for item.", {
            "itemInfo": itemId, "userInfo": userId, "error": err.message
        }, req))
        throw err
    }


}

function newItemValidation(data) {
    const schema = Joi.object({
        name: Joi.string(),
        description: Joi.string().allow(''),
        link: Joi.string().required(),
        price: Joi.number().required(),
        quantity: Joi.number().integer().required(),
        priority: Joi.number().integer().required(),
        listId: Joi.string().required(),
        imageUrl: Joi.string().allow(null),
    })
    return schema.validate(data)
}

function newOffListItemValidation(data) {
    const schema = Joi.object({
        name: Joi.string().required(),
        description: Joi.string().allow(''),
        link: Joi.string().required(),
        price: Joi.number().required(),
        quantity: Joi.number().integer().required(),
        listId: Joi.string().required(),
        imageUrl: Joi.string().allow(null),
        priority: Joi.number().integer()
    })

    return schema.validate(data)
}

function updateItemValidation(data) {
    const schema = Joi.object({
        name: Joi.string().required(),
        description: Joi.string().allow(null),
        link: Joi.string().required(),
        price: Joi.number().required(),
        quantity: Joi.number().integer().required(),
        priority: Joi.number().integer().required(),
        listId: Joi.string().required(),
        itemId: Joi.string().required(),
        imageUrl: Joi.string().required()
    })
    return schema.validate(data)
}


export default {addNewItemToList, getOverviewsForList, updateItem, deleteItemFromList, getListDetailsWithItems, fetchImageUrlForItem};
