import { EmbeddedListModel } from '../../models/embeddedList.mjs';
import { logger, LogMessage } from '../../config/winston.mjs';
import Joi from '@hapi/joi';

async function purchaseItem(userId, reqBody) {
    let input = purchaseDataValidation(reqBody)

    if (input.error) {
        throw Error('Input validation failed.')
    }

    try {
        const fetchResult = await EmbeddedListModel.findById(reqBody.listId)
        let listDetail = fetchResult.toObject()
        if (listDetail != null) {
            if (userId === listDetail.owner) {
                logger.info("%o", new LogMessage("ListPurchasesImpl", "purchaseItem", "List owner cannot mark item as purchased.", {
                    "listInfo": reqBody.listId, "itemInfo": reqBody.itemId
                }))
                throw Error('Requestor cannot be the owner.')
            }

            let updatedList = await EmbeddedListModel.findOneAndUpdate({
                '_id': reqBody.listId, 'items._id': reqBody.itemId
            }, {
                'items.$.purchased': true, 'items.$.purchaseDate': Date.now(), 'items.$.purchasedBy': userId
            }, {
                new: true
            })

            logger.info("%o", new LogMessage("ListPurchasesImpl", "purchaseItem", "Successfully marked item as purchased.", {
                "listInfo": reqBody.listId, "itemInfo": reqBody.itemId
            }))
            return updatedList
        }
    } catch (err) {
        logger.info("%o", new LogMessage("ListPurchasesImpl", "purchaseItem", "Unable to mark item as purchased.", {
            "listInfo": reqBody.listId, "itemInfo": reqBody.itemId
        }))
        throw err
    }
}

async function retractItemPurchase(userId, reqBody) {
    let input = purchaseDataValidation(reqBody)

    if (input.error) {
        throw Error('Input validation failed.')
    }

    try {
        const fetchResult = await EmbeddedListModel.findOne({
            '_id': reqBody.listId, 'items._id': reqBody.itemId
        }, {
            "owner": 1, "items": {$elemMatch: {"_id": reqBody.itemId}}
        })
        let listDetail = fetchResult.toObject()
        if (listDetail != null) {
            if (userId === listDetail.owner) {
                logger.info("%o", new LogMessage("ListPurchasesImpl", "retractItemPurchase", "List owner cannot retract a purchase.", {
                    "listInfo": reqBody.listId, "itemInfo": reqBody.itemId, "userInfo": userId
                }))
                throw Error('Requester cannot be the owner.')
            }

            let purchaser = listDetail.items[0].purchasedBy
            if (userId !== purchaser && purchaser != null) {
                logger.info("%o", new LogMessage("ListPurchasesImpl", "retractItemPurchase", "Only purchaser can retract a purchase.", {
                    "listInfo": reqBody.listId,
                    "itemInfo": reqBody.itemId,
                    "listIndo": reqBody.listId,
                    "userInfo": userId
                }))
                throw Error('Requester must be the purchaser.')
            }

            let updatedList = await EmbeddedListModel.findOneAndUpdate({
                '_id': reqBody.listId, 'items._id': reqBody.itemId
            }, {
                'items.$.purchased': false, 'items.$.purchaseDate': Date.now(), $unset: {'items.$.purchasedBy': 1}
            }, {
                new: true
            })

            logger.info("%o", new LogMessage("ListPurchasesImpl", "retractItemPurchase", "Successfully retracted purchase.", {
                "listInfo": reqBody.listId, "itemInfo": reqBody.itemId, "userInfo": userId
            }))
            return updatedList
        }
    } catch (err) {
        logger.info("%o", new LogMessage("ListPurchasesImpl", "retractItemPurchase", "Unable to retract purchase", {"error": err}))
        throw err
    }
}

function purchaseDataValidation(data) {
    const schema = Joi.object({
        listId: Joi.string().min(24).max(24).required(), itemId: Joi.string().min(24).max(24).required()
    })
    return schema.validate(data);
}


export default {purchaseItem, retractItemPurchase};