import UserModel from '../models/user.mjs';
import { logger, LogMessage } from '../config/winston.mjs';
import Joi from '@hapi/joi';

async function getUserOverview(req) {
    let userId = req.params.id
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
        logger.info("%o", new LogMessage("UserProfileImpl", "getUserOverview", "Failed to retrieved user.", {"error": err}, req))
        throw Error('Failed to fetch user overview.')
    }
}

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
        let updatedUser = await UserModel.findByIdAndUpdate(reqBody.userId, {
            firstName: reqBody.firstName, lastName: reqBody.lastName, email: reqBody.email
        }, {
            new: true
        })
        logger.info("%o", new LogMessage("UserProfileImpl", "updateUser", "Successfully updated user info.", {"userInfo": reqBody.userId}, req))
        return updatedUser
    } catch (err) {
        logger.warn("%o", new LogMessage("UserProfileImpl", "updateUser", "Unable to update user.", {"error": err}, req))
        throw Error('Unable to update user.')
    }
}

async function deleteUser(requesterId, userId) {
    if (requesterId !== userId) {
        logger.warn("%o", new LogMessage("UserProfileImpl", "deleteUser", "Only user can delete themselves.", {"userInfo": reqBody.userId}, req))
        throw Error('User must delete their own account.')
    }
    try {
        await UserModel.findByIdAndDelete(userId)
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
        lastName: Joi.string().required(),
        email: Joi.string().required()
    })
    return schema.validate(data)
}

export default {getUserOverview, updateUser, deleteUser};
