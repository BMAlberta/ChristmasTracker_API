import { EmbeddedListModel } from '../../models/embeddedList.mjs';
import { logger, LogMessage } from '../../config/winston.mjs';
import { sanitizeListAttributes } from '../../util/sanitizeItems.mjs'
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
            
        const purchaseInfo = {
            purchaserId: userId,
            quantityPurchased: reqBody.quantityPurchased,
            datePurchased: Date.now()
        }

        let updatedList = await EmbeddedListModel.findOneAndUpdate({
                '_id': reqBody.listId, 'items._id': reqBody.itemId
            }, {
                $addToSet: {'items.$.purchaseDetails.purchasers': purchaseInfo}, 'items.$.purchaseDate': Date.now()
            }, {
                new: true
            })
            logger.info("%o", new LogMessage("ListPurchasesImpl", "purchaseItem", "Successfully marked item as purchased.", {
                "listInfo": reqBody.listId, "itemInfo": reqBody.itemId
            }))
            const result = updatedList.toObject()
            sanitizeListAttributes(result, userId)
            return result
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

            let purchaserDetails = listDetail.items[0].purchaseDetails.purchasers
            if (purchaserDetails.length == 0) {
                logger.info("%o", new LogMessage("ListPurchasesImpl", "retractItemPurchase", "No purchasers to retract.", {
                    "listInfo": reqBody.listId,
                    "itemInfo": reqBody.itemId,
                    "userInfo": userId
                }))
                throw Error('No purchases to retract.')
            }

            let purchasers = purchaserDetails.map(details => details.purchaserId)
            if (!purchasers.includes(userId)) {
                logger.info("%o", new LogMessage("ListPurchasesImpl", "retractItemPurchase", "Only purchaser can retract a purchase.", {
                    "listInfo": reqBody.listId,
                    "itemInfo": reqBody.itemId,
                    "userInfo": userId
                }))
                throw Error('Requester must be the purchaser.')
            }

            
            let updatedList = await EmbeddedListModel.findOneAndUpdate({
                '_id': reqBody.listId, 'items._id': reqBody.itemId
            }, {
                    $pull: { 'items.$.purchaseDetails.purchasers': { purchaserId: userId } } 
            }, {
                new: true
            })

            logger.info("%o", new LogMessage("ListPurchasesImpl", "retractItemPurchase", "Successfully retracted purchase.", {
                "listInfo": reqBody.listId, "itemInfo": reqBody.itemId, "userInfo": userId
            }))
            const result = updatedList.toObject()
            sanitizeListAttributes(result, userId)
            return result
        }
    } catch (err) {
        logger.info("%o", new LogMessage("ListPurchasesImpl", "retractItemPurchase", "Unable to retract purchase", {"error": err}))
        throw err
    }
}

function purchaseDataValidation(data) {
    const schema = Joi.object({
        listId: Joi.string().min(24).max(24).required(), 
        itemId: Joi.string().min(24).max(24).required(),
        quantityPurchased: Joi.number().integer()
    })
    return schema.validate(data);
}


export default {purchaseItem, retractItemPurchase};