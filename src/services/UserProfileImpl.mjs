import UserModel from '../models/user.mjs';
import { logger, LogMessage } from '../config/winston.mjs';
import Joi from '@hapi/joi';
import util from '../middleware/session.mjs';

async function getUserOverview(userId) {
    try {
        const fetchResult = await UserModel.findById(userId, {
            'email': 1,
            'firstName': 1,
            'lastName': 1,
            'creationDate': 1,
            'lastLogInDate': 1,
            'lastLogInLocation': 1,
            'lastPasswordChange': 1,
        })
        logger.info("%o", new LogMessage("UserProfileImpl", "getUserOverview", "Successfully retrieved user."))
        return fetchResult
    } catch (err) {
        logger.info("%o", new LogMessage("UserProfileImpl", "getUserOverview", "Failed to retrieved user.", {"error": err}))
        throw Error('Failed to fetch user overview.')
    }
}

async function updateUser(requesterId, reqBody) {

    let input = updateUserValidation(reqBody)

    if (input.error) {
        throw Error('Input validation failed.')
    }

    if (requesterId !== reqBody.userId) {
        logger.info("%o", new LogMessage("UserProfileImpl", "updateUser", "Only user can update themselves."))
        throw Error('User must update their own account.')
    }

    try {
        let updatedUser = await UserModel.findByIdAndUpdate(reqBody.userId, {
            firstName: reqBody.firstName, lastName: reqBody.lastName, email: reqBody.email
        }, {
            new: true
        })
        logger.info("%o", new LogMessage("UserProfileImpl", "updateUser", "Successfully updated user info.", {"userInfo": reqBody.userId}))
        return updatedUser
    } catch (err) {
        logger.info("%o", new LogMessage("UserProfileImpl", "updateUser", "Unable to update user.", {"error": err}))
        throw Error('Unable to update user.')
    }
}

async function deleteUser(requesterId, userId) {
    if (requesterId !== userId) {
        logger.info("%o", new LogMessage("UserProfileImpl", "deleteUser", "Only user can delete themselves."))
        throw Error('User must delete their own account.')
    }
    try {
        await UserModel.findByIdAndDelete(userId)
        logger.info("%o", new LogMessage("UserProfileImpl", "deleteUser", "Successfully deleted user", {"userInfo": userId}))

    } catch (err) {
        logger.info("%o", new LogMessage("UserProfileImpl", "deleteUser", "Unable to delete user.", {"error": err}))
        throw Error('Unable to delete user.')
    }
}

function updateUserValidation(data) {
    const schema = Joi.object({
        userId: Joi.string().required(),
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        email: Joi.string().required()
    })
    return schema.validate(data)
}

export default {getUserOverview, updateUser, deleteUser};
