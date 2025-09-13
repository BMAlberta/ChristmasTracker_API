import bcrypt from 'bcryptjs';
import NetworkUtils from '../util/request.mjs';
import { logger, LogMessage } from '../config/winston.mjs';
import Joi from '@hapi/joi';
import { ValidationError } from '../config/errors.mjs';
import {findOne, updateOne, ProcedureType} from "../util/dataRequest.mjs";

async function doLogin(req) {
    var session = req.session
    let reqBody = req.body
    let requestMetaData = NetworkUtils.getCallerIP(req)
    let input = loginValidation(reqBody)

    if (input.error) {
        logger.warn("%o", new LogMessage("ListDetailImpl", "doLogin", "Input validation failed", {"error": input.error}, req))
        throw Error('Input validation failed. ' + input.error)
    }

    // Find user by email
    var user = ""
    try {
        user = await findOne(ProcedureType.LOGIN_INFO, reqBody.email)
    } catch (err) {
        logger.warn("%o", new LogMessage("AuthServiceImpl", "doLogin", "Unable to query for users", { "user": reqBody.email, "ip": loginIp }, req))
        throw Error("Query failed.")
    }

    if (!user) {
        logger.info("%o", new LogMessage("AuthServiceImpl", "doLogin", "Unable to find user.", { "userId": reqBody.email }, req))
        throw Error('User not found.')
    }

    // Validate password
    // let validPassword = await bcrypt.compare(reqBody.password, user.pwd)
    let validPassword = reqBody.password === user.pwd
    if (!validPassword) {
        logger.warn("%o", new LogMessage("AuthServiceImpl", "doLogin", "Password validation failed", { "userId": reqBody.email }, req))
        throw Error('Credential validation failed.')
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

        return user.userId
    } catch (err) {
        logger.warn("%o", new LogMessage("AuthSerivceImpl", "doLogin", "Session generation failed", { "user": user.userId, "error": err }, req))
        throw err
    }
}

async function doLogout(req) {
    try {
        const session = req.session
        const localId = session.id
        await session.destroy()
        logger.debug("%o", new LogMessage("AuthServiceImpl", "doLogout", "Logout successful.", { "sessionId": localId}, req))

    } catch (err) {
        logger.warn("%o", new LogMessage("AuthServiceImpl", "doLogout", "Logout failed.", { "error": err}, req))
        throw err
    }
}

async function updatePassword(requester, req) {
    let reqBody = req.body
    let input = changePasswordValidation(reqBody)

    if (input.error) {
        logger.warn("%o", new LogMessage("ListDetailImpl", "updatePassword", "Input validation failed", {"error": input.error}, req))
        throw Error('Input validation failed. ' + input.error)
    }

    try {
        // const user = await UserModel.findById(requester)
        // const validOldPassword = await bcrypt.compare(reqBody.oldPassword, user.pwd)
        const user = await findOne(ProcedureType.PASSWORD_INFO, requester)
        const validOldPassword = true

        if (!validOldPassword) {
            logger.warn("%o", new LogMessage("AuthServiceImpl", "updatePassword", "Password validation failed.", { "userId": user.userId}, req))
            throw Error('Password validation failed')
        }

        // let saltedPassword = await generatePassword(reqBody.newPassword)
        let saltedPassword = reqBody.newPassword

        await updateOne(ProcedureType.UPDATE_PASSWORD, [requester, saltedPassword])

        logger.debug("%o", new LogMessage("AuthServiceImpl", "updatePassword", "Update password successful.", { "userId": user.userId}, req))
        return user
    } catch (err) {
        logger.warn("%o", new LogMessage("AuthServiceImpl", "doLogout", "Change password failed.", { "error": err},req))
        throw err
    }
}

async function generatePassword(rawText) {
    const salt = await bcrypt.genSalt(10)
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