import { logger, LogMessage } from '../config/winston.mjs';
import {findMany, ProcedureType} from "../util/dataRequest.mjs";
import {DataResponse} from "../models/payload.mjs";



// Error Domain Code: 6

// Error Sub-Domain Code: 1
async function aggregateData(userId, req) {
    try {

        let userMetadata = await UserProfileServiceImpl.getUserOverview(userId, req);
        // let listOverviews = await ListDetailsImpl.getOverviewsForList(userId, req);
        let listOverviews = await ListDetailsImpl.getListDetailsWithItems(userId, req);

        let aggResult = {
            "userMetadata": userMetadata,
            "listOverviews": listOverviews,
            "activity": []
        };

        logger.info("%o", new LogMessage("OverviewImpl", "aggregateData", "Successfully aggregated data.", {"userInfo": userId}, req))
        return aggResult
    } catch (err) {
        logger.warn("%o", new LogMessage("OverviewImpl", "aggregateData", "Unable to aggregate data", {"error": err}, req))
        throw err
    }
}

async function getActivity(userId, req) {
    try {
        let purchaseStats = await findMany(ProcedureType.GET_PURCHASE_STATS_BY_USER, [userId])
        logger.info("%o", new LogMessage("ActivityListImpl", "getActivity", "Successfully fetched activity.", {"userInfo": userId}, req))
        return purchaseStats
    } catch (err) {
        logger.warn("%o", new LogMessage("ActivityListImpl", "getActivity", "Unable to fetch stats", {"error": err}, req))
        throw err
    }

}

async function saveActivity(userId, req) {

}


export default {getActivity, saveActivity};