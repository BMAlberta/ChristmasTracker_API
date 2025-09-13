import { getDbConnection } from "../config/db.mjs";

export const ProcedureType = Object.freeze({
    ACTIVE_MEMBER_LISTS: "getActiveMemberLists",
    JOINED_LISTS: "getJoinedLists",
    LOGIN_INFO: "CALL tracker.getLoginInfo(?)",
    MEMBER_LIST_OVERVIEWS: "getMemberListsOverviews",
    PURCHASE_SUMMARY_BY_LIST: "CALL tracker.getPurchaseSummaryByListForUser(?)",
    USER_DETAILS: "CALL tracker.getUserDetails(?)",
    USER_ID: "getUserId",
    UPDATE_USER_RETURN_INFO: "updateAndReturnUserInfo",
    UPDATE_LOGIN_INFO: "CALL tracker.updateLastLoginDetails(?,?,?)",
    UPDATE_USER_INFO: "updateUserInfo",
    OWNED_LISTS: "getOwnedLists",
    UPDATE_PASSWORD: "CALL tracker.updatePassword(?,?)",
    PASSWORD_INFO: "CALL tracker.getPasswordInfo(?)",
    CREATE_USER: "CALL tracker.createUser(?,?,?,?)",
    CHECK_USER: "CALL tracker.checkForUserByEmail(?)",
    DELETE_USER: "CALL tracker.deleteUserById(?)"
});

// function formatDataRequest(procedureName) {
//     return `CALL tracker.${procedureName}(?)`
// }


export async function makeFormattedDataRequest(procedureName, data) {
    try {
        let connection = await getDbConnection();
        let result = await connection.query(procedureName, data);
        return result[0];
    } catch (err) {
        console.log(err)
    }
}

export async function findOne(procedureName, data) {
    try {
        let result = await makeFormattedDataRequest(procedureName, data);
        if (result.length == 0) {
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
        if (result.length == 0) {
            throw Error('No result found.');
        }
        return result;
    } catch (err) {
        console.log(err)
    }
}

export async function updateOne(procedureName, data) {
    try {
        let result = await makeFormattedDataRequest(procedureName, data);
        return
    } catch (err) {
        console.log(err)
    }
}

export async function createOne(procedureName, data) {
    try {
        let result = await makeFormattedDataRequest(procedureName, data);
        if (result.length == 0) {
            throw Error('No result found.');
        }
        return result[0];
    } catch (err) {
        console.log(err)
    }
}

export async function deleteOne(procedureName, data) {
    try {
        let result = await makeFormattedDataRequest(procedureName, data);
        return
    } catch (err) {
        console.log(err)
    }
}