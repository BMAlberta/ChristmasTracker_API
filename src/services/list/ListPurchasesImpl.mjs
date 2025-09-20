import { logger, LogMessage } from '../../config/winston.mjs';
import { sanitizeListAttributes } from '../../util/sanitizeItems.mjs'
import Joi from '@hapi/joi';
import {findOne, updateOne, ProcedureType, deleteOne} from "../../util/dataRequest.mjs";

async function purchaseItem(userId, req) {
    let reqBody = req.body
    let input = purchaseDataValidation(reqBody)

    if (input.error) {
        logger.warn("%o", new LogMessage("ListDetailImpl", "purchaseItem", "Input validation failed", {"error": input.error}, req))
      throw Error('Input validation failed. ' + input.error)
    }

    try {
        const fetchResult = await findOne(ProcedureType.GET_LIST_METADATA, [reqBody.listId]);
        if (fetchResult != null) {
            if (userId === fetchResult.owner) {
                logger.warn("%o", new LogMessage("ListPurchasesImpl", "purchaseItem", "List owner cannot mark item as purchased.", {
                    "listInfo": reqBody.listId, "itemInfo": reqBody.itemId
                }, req))
                throw Error('Requestor cannot be the owner.')
            }

            let updatedList = await updateOne(ProcedureType.PURCHASE_ITEM, [reqBody.itemId, reqBody.listId, reqBody.quantityPurchased, userId])
            sanitizeListAttributes(updatedList, userId)
            logger.info("%o", new LogMessage("ListPurchasesImpl", "purchaseItem", "Successfully marked item as purchased.", {
                "listInfo": reqBody.listId, "itemInfo": reqBody.itemId
            }, req))
            return updatedList
        }
    } catch (err) {
        logger.warn("%o", new LogMessage("ListPurchasesImpl", "purchaseItem", "Unable to mark item as purchased.", {
            "listInfo": reqBody.listId, "itemInfo": reqBody.itemId
        }, req))
        throw err
    }
}

async function retractItemPurchase(userId, req) {
    let reqBody = req.body
    let input = purchaseDataValidation(reqBody)

    if (input.error) {
        logger.warn("%o", new LogMessage("ListDetailImpl", "retractItemPurchase", "Input validation failed", {"error": input.error}, req))
      throw Error('Input validation failed. ' + input.error)
    }

    try {
        const fetchResult = await findOne(ProcedureType.GET_LIST_METADATA, [reqBody.listId]);
        if (fetchResult != null) {
            if (userId === fetchResult.owner) {
                logger.warn("%o", new LogMessage("ListPurchasesImpl", "retractItemPurchase", "List owner cannot retract a purchase.", {
                    "listInfo": reqBody.listId, "itemInfo": reqBody.itemId, "userInfo": userId
                }, req))
                throw Error('Requester cannot be the owner.')
            }

            // let purchaserDetails = listDetail.items[0].purchaseDetails.purchasers
            // if (purchaserDetails.length == 0) {
            //     logger.warn("%o", new LogMessage("ListPurchasesImpl", "retractItemPurchase", "No purchasers to retract.", {
            //         "listInfo": reqBody.listId,
            //         "itemInfo": reqBody.itemId,
            //         "userInfo": userId
            //     }, req))
            //     throw Error('No purchases to retract.')
            // }

            // let purchasers = purchaserDetails.map(details => details.purchaserId)
            // if (!purchasers.includes(userId)) {
            //     logger.warn("%o", new LogMessage("ListPurchasesImpl", "retractItemPurchase", "Only purchaser can retract a purchase.", {
            //         "listInfo": reqBody.listId,
            //         "itemInfo": reqBody.itemId,
            //         "userInfo": userId
            //     }, req))
            //     throw Error('Requester must be the purchaser.')
            // }

            
            let updatedList = await deleteOne(ProcedureType.RETRACT_PURCHASE, [reqBody.itemId, reqBody.listId, userId])
            logger.info("%o", new LogMessage("ListPurchasesImpl", "retractItemPurchase", "Successfully retracted purchase.", {
                "listInfo": reqBody.listId, "itemInfo": reqBody.itemId, "userInfo": userId
            }, req))
            sanitizeListAttributes(updatedList, userId)
            return updatedList
        }
    } catch (err) {
        logger.warn("%o", new LogMessage("ListPurchasesImpl", "retractItemPurchase", "Unable to retract purchase", {"error": err}, req))
        throw err
    }
}

function purchaseDataValidation(data) {
    const schema = Joi.object({
        listId: Joi.string().min(36).max(36).required(),
        itemId: Joi.string().min(36).max(36).required(),
        quantityPurchased: Joi.number().integer()
    })
    return schema.validate(data);
}


export default {purchaseItem, retractItemPurchase};