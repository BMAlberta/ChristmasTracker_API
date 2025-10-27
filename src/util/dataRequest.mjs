import { getDbConnection } from "../config/db.mjs";

export const ProcedureType = Object.freeze({
    ACTIVE_MEMBER_LISTS: "getActiveMemberLists",
    JOINED_LISTS: "getJoinedLists",
    LOGIN_INFO: "CALL tracker.getLoginInfo(?)",
    MEMBER_LIST_OVERVIEWS: "CALL tracker.getMemberListOverviews(?)",
    PURCHASE_SUMMARY_BY_LIST: "CALL tracker.getPurchaseSummaryByListForUser(?)",
    USER_DETAILS: "CALL tracker.getUserDetails(?)",
    USER_ID: "getUserId",
    UPDATE_USER_RETURN_INFO: "updateAndReturnUserInfo",
    UPDATE_LOGIN_INFO: "CALL tracker.updateLastLoginDetails(?,?,?)",
    UPDATE_USER_INFO: "updateUserInfo",
    OWNED_LISTS: "CALL tracker.getOwnedLists(?)",
    UPDATE_PASSWORD: "CALL tracker.updatePassword(?,?)",
    PASSWORD_INFO: "CALL tracker.getPasswordInfo(?)",
    CREATE_USER: "CALL tracker.createUser(?,?,?,?)",
    CHECK_USER: "CALL tracker.checkForUserByEmail(?)",
    DELETE_USER: "CALL tracker.deleteUserById(?)",
    LIST_DETAILS_WITH_ITEMS: "CALL tracker.getListDetailsWithItems(?)",
    CREATE_LIST: "CALL tracker.createList(?,?)",
    GET_LIST_METADATA: "CALL tracker.getListMetadata(?)",
    UPDATE_LIST: "CALL tracker.updateList(?,?)",
    DELETE_LIST: "CALL tracker.deleteList(?)",
    //name, desc, link, price, quantity, owner, list
    ADD_ITEM_TO_LIST: "CALL tracker.addItemToList(?,?,?,?,?,?,?,?)",
    ADD_OFFLIST_ITEM_TO_LIST: "CALL tracker.addOffListItem(?,?,?,?,?,?,?,?)",
    GET_ITEM_METADATA: "CALL tracker.getItemMetadata(?,?)",
    UPDATE_ITEM: "CALL tracker.updateItemAndReturnList(?,?,?,?,?,?,?)",
    DELETE_ITEM: "CALL tracker.deleteItemAndReturnList(?,?)",
    PURCHASE_ITEM: "CALL tracker.markItemPurchased(?,?,?,?)",
    RETRACT_PURCHASE: "CALL tracker.retractItemPurchase(?,?,?)",
    GET_LIST_DETAILS_WITH_ITEMS: "CALL tracker.getMemberListDetailsWithItems(?)"
});

export async function makeFormattedDataRequest(procedureName, data) {
    let connection;
    try {
        connection = await getDbConnection();
        let result = await connection.query(procedureName, data);
        return result[0];
    } catch (err) {
        console.log(err)
    } finally {
        if (connection) await connection.end()
    }
}

export async function findOne(procedureName, data) {
    try {
        let result = await makeFormattedDataRequest(procedureName, data);
        if (result.length === 0) {
            throw Error('No result found.');
        }
        return result[0];
    } catch (err) {
        console.log(err)
    }
}

export async function findMany(procedureName, data) {
    try {
        let result = await makeFormattedDataRequest(procedureName, data);
        if (result.length === 0) {
            throw Error('No result found.');
        }
        return result;
    } catch (err) {
        console.log(err)
    }
}

export async function updateOne(procedureName, data) {
    try {
        const result = await makeFormattedDataRequest(procedureName, data);

        if (result.length === 0) {
            throw Error('No result found.');
        }

        return result.length === 0 ? null : result[0];
    } catch (err) {
        console.log(err)
    }
}

export async function createOne(procedureName, data) {
    try {
        let result = await makeFormattedDataRequest(procedureName, data);
        if (result.length === 0) {
            throw Error('No result found.');
        }
        return result[0];
    } catch (err) {
        console.log(err)
    }
}

export async function deleteOne(procedureName, data) {
    try {
        const result = await makeFormattedDataRequest(procedureName, data);
        return result.length === 0 ? null : result[0];
    } catch (err) {
        console.log(err)
    }
}