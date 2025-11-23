import { logger, LogMessage } from '../config/winston.mjs';
import Joi from '@hapi/joi';
import {findOne, updateOne, deleteOne, ProcedureType} from "../util/dataRequest.mjs";

// Error Domain: 5

// Error Sub Code: 1
async function getUserOverview(userId, req) {
    try {
        const fetchResult = await findOne(ProcedureType.USER_DETAILS, [userId]);
        logger.info("%o", new LogMessage("UserProfileImpl", "getUserOverview", "Successfully retrieved user.",{"userInfo": userId}, req))
        return fetchResult
    } catch (err) {
        logger.info("%o", new LogMessage("UserProfileImpl", "getUserOverview", "Failed to retrieved user.", {"error": err}, req))
        throw Error('Failed to fetch user overview.')
    }
}

// Error Sub Code: 2
async function updateUser(requesterId, req) {
    let reqBody = req.body
    let input = updateUserValidation(reqBody)

    if (input.error) {
        logger.warn("%o", new LogMessage("ListDetailImpl", "updateUser", "Input validation failed", {"error": input.error}, req))
        throw Error('Input validation failed. ' + input.error)
    }

    if (requesterId !== reqBody.userId) {
        logger.warn("%o", new LogMessage("UserProfileImpl", "updateUser", "Only user can update themselves.", {"userInfo": reqBody.userId}, req))
        throw Error('User must update their own account.')
    }

    try {
        let userData = [reqBody.userId, reqBody.firstName, reqBody.lastName]
        let updatedUser = await updateOne(ProcedureType.UPDATE_USER_INFO, userData);

        logger.info("%o", new LogMessage("UserProfileImpl", "updateUser", "Successfully updated user info.", {"userInfo": reqBody.userId}, req))
        return updatedUser
    } catch (err) {
        logger.warn("%o", new LogMessage("UserProfileImpl", "updateUser", "Unable to update user.", {"error": err}, req))
        throw Error('Unable to update user.')
    }
}

// Error Sub Code: 3
async function deleteUser(requesterId, userId) {
    if (requesterId !== userId) {
        logger.warn("%o", new LogMessage("UserProfileImpl", "deleteUser", "Only user can delete themselves.", {"userInfo": userId}, req))
        throw Error('User must delete their own account.')
    }
    try {
        await deleteOne(ProcedureType.DELETE_USER, [userId])
        logger.info("%o", new LogMessage("UserProfileImpl", "deleteUser", "Successfully deleted user", {"userInfo": userId}, req))

    } catch (err) {
        logger.warn("%o", new LogMessage("UserProfileImpl", "deleteUser", "Unable to delete user.", {"error": err}, req))
        throw Error('Unable to delete user.')
    }
}

function updateUserValidation(data) {
    const schema = Joi.object({
        userId: Joi.string().required(),
        firstName: Joi.string().required(),
        lastName: Joi.string().required()
    })
    return schema.validate(data)
}

export default {getUserOverview, updateUser, deleteUser};
