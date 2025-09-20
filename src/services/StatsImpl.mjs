import { logger, LogMessage } from '../config/winston.mjs';
import {findMany, ProcedureType} from "../util/dataRequest.mjs";
async function getPurchaseOverviews(userId, req) {
    try {

        let aggregation = await getPurchaseOverviewsNew(userId)
        logger.info("%o", new LogMessage("StatsImpl", "getPurchaseOverviews", "Successfully calculated spending overviews.", {"userInfo": userId}, req))
        return aggregation
        
    } catch (err) {
        logger.warn("%o", new LogMessage("StatsImpl", "getPurchaseOverviews", "Unable to calculate spending overviews", {"error": err}, req))
        throw err
    }
}


async function getPurchaseOverviewsNew(userId) {
    try {
        let fetchResult = await findMany(ProcedureType.PURCHASE_SUMMARY_BY_LIST, [userId])
        logger.info("%o", new LogMessage("StatsImpl", "getPurchaseOverviews", "Successfully calculated spending overviews.", {"userInfo": userId}))
        return fetchResult
    } catch (err) {
        logger.warn("%o", new LogMessage("StatsImpl", "getPurchaseOverviews", "Unable calculate spending overviews", {"error": err}))
        throw err
    }
}

export default {getPurchaseOverviews};