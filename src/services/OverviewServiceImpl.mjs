import { logger, LogMessage } from '../config/winston.mjs';
import {findMany, ProcedureType} from "../util/dataRequest.mjs";
import UserProfileServiceImpl from "./UserProfileImpl.mjs"
import ListDetailsImpl from "./list/ListDetailsImpl.mjs";


// Error Domain Code: 3

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

export default {aggregateData};