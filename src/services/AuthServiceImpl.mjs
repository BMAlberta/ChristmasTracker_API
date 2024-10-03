import bcrypt from 'bcryptjs';
import UserModel from '../models/user.mjs';
import { logger, LogMessage } from '../config/winston.mjs';
import Joi from '@hapi/joi';
import { ValidationError } from '../config/errors.mjs';

async function doLogin(session, reqBody, requestMetaData) {
    let input = loginValidation(reqBody)

    if (input.error) {
        throw new ValidationError(input.error)
    }

    // Find user by email
    var user = ""
    try {
        user = await UserModel.findOne({ email: reqBody.email })
    } catch (err) {
        logger.warn("%o", new LogMessage("AuthServiceImpl", "doLogin", "Unable to query for users", { "user": reqBody.email, "ip": loginIp }))
        throw Error("Query failed.")
    }

    if (!user) {
        logger.info("%o", new LogMessage("AuthServiceImpl", "doLogin", "Unable to find user.", { "userId": reqBody.email }))
        throw Error('User not found.')
    }

    // Validate password
    let validPassword = await bcrypt.compare(reqBody.password, user.pwd)
    if (!validPassword) {
        logger.info("%o", new LogMessage("AuthServiceImpl", "doLogin", "Password validation failed", { "userId": reqBody.email }))
        throw Error('Credential validation failed.')
    }

    // Update login details
    try {
        await UserModel.findByIdAndUpdate({
            _id: user._id
        }, {
            lastLogInLocation: requestMetaData,
            lastLogInDate: Date.now()
        })
    } catch (err) {
        logger.warn("%o", new LogMessage("AuthServiceImpl", "doLogin", "Unable to update login IP", { "user": user._id, "ip": loginIp }))
    }

    session.details = {
        userId: user._id,
        userAuthenticated: true
    }
    // Update session
    try {
        await session.save()
        logger.warn("%o", new LogMessage("AuthServiceImpl", "doLogin", "Login successful", { "user": user._id, "session": session.details }))
        return user._id
    } catch (err) {
        logger.warn("%o", new LogMessage("AuthSerivceImpl", "doLogin", "Session generation failed", { "user": user._id, "error": err }))
        throw err
    }
}

async function doLogout(session) {
    try {
        const localId = session.id
        await session.destroy()
        logger.debug("%o", new LogMessage("AuthServiceImpl", "doLogout", "Logout successful.", { "sessionId": localId}))

    } catch (err) {
        logger.debug("%o", new LogMessage("AuthServiceImpl", "doLogout", "Logout failed.", { "error": err}))
        throw err
    }
}

async function updatePassword(requester, reqBody) {
    let input = changePasswordValidation(reqBody)

    if (input.error) {
        throw new ValidationError(input.error)
    }

    try {
        const user = await UserModel.findById(requester)
        const validOldPassword = await bcrypt.compare(reqBody.oldPassword, user.pwd)

        if (!validOldPassword) {
            logger.debug("%o", new LogMessage("AuthServiceImpl", "updatePassword", "Password validation failed.", { "userId": user._id}))
            throw Error('Password validation failed')
        }

        let saltedPassword = await generatePassword(reqBody.newPassword)

        await UserModel.findByIdAndUpdate({ _id: user._id },
            {
                pwd: saltedPassword,
                lastPasswordChange: Date.now()
        })
        logger.debug("%o", new LogMessage("AuthServiceImpl", "updatePassword", "Update password successful.", { "userId": user._id}))
        return user
    } catch (err) {
        logger.debug("%o", new LogMessage("AuthServiceImpl", "doLogout", "Change password failed.", { "error": err}))
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