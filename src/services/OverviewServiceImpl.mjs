import { logger, LogMessage } from '../config/winston.mjs';
import {findMany, ProcedureType} from "../util/dataRequest.mjs";
import UserProfileServiceImpl from "./UserProfileImpl.mjs"
import ListDetailsImpl from "./list/ListDetailsImpl.mjs";

async function aggregateData(userId, req) {
    try {

        let userMetadata = await UserProfileServiceImpl.getUserOverview(userId, req);
        let listOveviews = await ListDetailsImpl.getOverviewsForList(userId, req);

        let aggResult = {
            "userMetadata": userMetadata,
            "listOverviews": listOveviews,
            "activity": {}
        };

        logger.info("%o", new LogMessage("OverviewImpl", "aggregateData", "Successfully aggregated data.", {"userInfo": userId}))
        return aggResult
    } catch (err) {
        logger.warn("%o", new LogMessage("OverviewImpl", "aggregateData", "Unable to aggregate data", {"error": err}))
        throw err
    }
}

export default {aggregateData};