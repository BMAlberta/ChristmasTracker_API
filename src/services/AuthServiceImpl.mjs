import bcrypt from 'bcryptjs';
import NetworkUtils from '../util/request.mjs';
import { logger, LogMessage } from '../config/winston.mjs';
import Joi from '@hapi/joi';
import {findOne, updateOne, ProcedureType} from "../util/dataRequest.mjs";
import {TrackerError} from "../config/errors.mjs";

// Error Domain Code: 1

// Error Domain Sub-Code: 1
async function doLogin(req) {
    const session = req.session;
    let reqBody = req.body
    let requestMetaData = NetworkUtils.getCallerIP(req)
    let input = loginValidation(reqBody)

    if (input.error) {
        logger.warn("%o", new LogMessage("ListDetailImpl", "doLogin", "Input validation failed", {"error": input.error}, req))
        // throw Error('Input validation failed. ' + input.error)
        throw new TrackerError("1.2", "Login input validation failed")
    }

    // Find user by email
    let user = "";
    try {
        user = await findOne(ProcedureType.LOGIN_INFO, reqBody.email)
    } catch (err) {
        logger.warn("%o", new LogMessage("AuthServiceImpl", "doLogin", "Unable to query for users", { "user": reqBody.email, "ip": loginIp }, req))
        // throw Error("Query failed.")
        throw new TrackerError("1.3", "Failed to search for user.")
    }

    if (!user) {
        logger.info("%o", new LogMessage("AuthServiceImpl", "doLogin", "Unable to find user.", { "userId": reqBody.email }, req))
        // throw Error('User not found.')
        throw new TrackerError("1.4", "Unable to find user.")
    }


    // Validate password
    let validPassword = await bcrypt.compare(reqBody.password, user.pwd)
    if (!validPassword) {
        logger.warn("%o", new LogMessage("AuthServiceImpl", "doLogin", "Password validation failed", { "userId": reqBody.email }, req))
        // throw Error('Credential validation failed.')
        throw new TrackerError("1.5", "Credential validation failed.")
    }

    // Update login details
    try {
        let currentDate = new Date();
        await updateOne(ProcedureType.UPDATE_LOGIN_INFO, [user.userId, requestMetaData, currentDate])
    } catch (err) {
        logger.warn("%o", new LogMessage("AuthServiceImpl", "doLogin", "Unable to update login IP", { "user": user.userId, "ip": loginIp }, req))
    }

    session.details = {
        userId: user.userId,
        userAuthenticated: true
    }
    // Update session
    try {
        await session.save()
        logger.warn("%o", new LogMessage("AuthServiceImpl", "doLogin", "Login successful", { "user": user.userId, "session": session.details }, req))   

       return {
            userId: user.userId,
            firstName: user.firstName,
            lastName: user.lastName,
            pcr: !!user.passwordChangeRequired
        }
        // return user.userId
    } catch (err) {
        logger.warn("%o", new LogMessage("AuthServiceImpl", "doLogin", "Session generation failed", { "user": user.userId, "error": err }, req))
        throw new TrackerError("1.6", "Unable to generate session.")
    }
}
// Error Domain Sub-Code: 2
async function doLogout(req) {
    try {
        const session = req.session
        const localId = session.id
        await session.destroy()
        logger.debug("%o", new LogMessage("AuthServiceImpl", "doLogout", "Logout successful.", { "sessionId": localId}, req))

    } catch (err) {
        logger.warn("%o", new LogMessage("AuthServiceImpl", "doLogout", "Logout failed.", { "error": err}, req))
        // throw err
        throw new TrackerError("1.7", "Logout failed.")
    }
}
// Error Domain Sub-Code: 3
async function updatePassword(requester, req) {
    let reqBody = req.body
    let input = changePasswordValidation(reqBody)

    if (input.error) {
        logger.warn("%o", new LogMessage("ListDetailImpl", "updatePassword", "Input validation failed", {"error": input.error}, req))
        // throw Error('Input validation failed. ' + input.error)
        throw new TrackerError("1.8", "Password reset input validation failed.")
    }

    try {
        const validOldPassword = await bcrypt.compare(reqBody.oldPassword, user.pwd)
        const user = await findOne(ProcedureType.PASSWORD_INFO, requester)

        if (!validOldPassword) {
            logger.warn("%o", new LogMessage("AuthServiceImpl", "updatePassword", "Password validation failed.", { "userId": user.userId}, req))
            // throw Error('Password validation failed')
            throw new TrackerError("1.9", "Password validation failed.")
        }

        let saltedPassword = await generatePassword(reqBody.newPassword)
        // let saltedPassword = reqBody.newPassword

        await updateOne(ProcedureType.UPDATE_PASSWORD, [requester, saltedPassword])

        logger.debug("%o", new LogMessage("AuthServiceImpl", "updatePassword", "Update password successful.", { "userId": user.userId}, req))
        return user
    } catch (err) {
        logger.warn("%o", new LogMessage("AuthServiceImpl", "doLogout", "Change password failed.", { "error": err},req))
        // throw err
        throw new TrackerError("1.10", "Password update failed.")
    }
}

async function generatePassword(rawText) {
    const salt = await bcrypt.genSalt(12)
    return await bcrypt.hash(rawText, salt)
}

function loginValidation(data) {
    const schema = Joi.object({
        email: Joi.string().min(12).max(255).required(),
        password: Joi.string().min(6).max(1024).required(),
    });
    return schema.validate(data);
}

function changePasswordValidation(data) {
    const schema = Joi.object({
        oldPassword: Joi.string().required(),
        newPassword: Joi.string().min(6).max(1024).required(),
    });
    return schema.validate(data);
}

export default { doLogin, doLogout, updatePassword };