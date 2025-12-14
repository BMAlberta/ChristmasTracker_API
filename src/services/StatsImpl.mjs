import { logger, LogMessage } from '../config/winston.mjs';
import {findMany, ProcedureType} from "../util/dataRequest.mjs";
// Error Domain Code: 4

// Error Sub Code: 1
async function getPurchaseOverviews(userId, req) {
    try {

        let aggregation = await getPurchaseOverviewsNew(userId, req)
        logger.info("%o", new LogMessage("StatsImpl", "getPurchaseOverviews", "Successfully calculated spending overviews.", {"userInfo": userId}, req))
        return aggregation
        
    } catch (err) {
        logger.warn("%o", new LogMessage("StatsImpl", "getPurchaseOverviews", "Unable to calculate spending overviews", {"error": err}, req))
        throw err
    }
}

// Error Sub Code: 2
async function getPurchaseOverviewsNew(userId, req) {
    try {
        let fetchResult = await findMany(ProcedureType.PURCHASE_SUMMARY_BY_LIST, [userId])
        formatStatsModel(fetchResult);
        logger.info("%o", new LogMessage("StatsImpl", "getPurchaseOverviews", "Successfully calculated spending overviews.", {"userInfo": userId}, req))
        return fetchResult
    } catch (err) {
        logger.warn("%o", new LogMessage("StatsImpl", "getPurchaseOverviews", "Unable calculate spending overviews", {"error": err}, req))
        throw err
    }
}

function formatStatsModel(model) {
    if (Array.isArray(model)) {
        model.forEach(stat => {
            stat.purchaseYear = String(stat.purchaseYear)
            stat.itemPurchased = Number(stat.itemPurchased)
        })
    }
}

export default {getPurchaseOverviews};