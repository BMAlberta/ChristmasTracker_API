import { logger, LogMessage } from '../../config/winston.mjs';
import OTPGenerator from 'otp-generator';
import Joi from '@hapi/joi';

async function createInvitationToList(requesterId, req) {
    let reqBody = req.body
    let input = inviteValidation(reqBody)

    if (input.error) {
        logger.warn("%o", new LogMessage("ListDetailImpl", "createInvitationToList", "Input validation failed", {"error": input.error}, req))
        throw Error('Input validation failed. ' + input.error)
    }

    let fetchResult = null
    let listInContext = fetchResult.toObject()

    if (listInContext === null) {
        logger.warn("%o", new LogMessage("ListInvitationImpl", "createInvitation", "Unable to retrieve list.", {
            "listInfo": reqBody.listId
        }, req))
        throw Error('Could not retrieve list.')
    }

    if (requesterId !== listInContext.owner) {
        logger.warn("%o", new LogMessage("ListInvitationImpl", "createInvitation", "Requester must be the owner.", {
            "listInfo": reqBody.listId, "userInfo": requesterId
        }, req))
        throw Error('Could not retrieve list.')
    }

    try {
        const generatedCode = OTPGenerator.generate(12, {
            upperCaseAlphabets: true, lowerCaseAlphabets: true, specialChars: true
        })

        // const invitation = new Invite({
        //     invitationCode: generatedCode, listId: reqBody.listId, userId: reqBody.userId
        // })

        const inviteCode = null
        logger.info("%o", new LogMessage("ListInvitationImpl", "createInvitation", "Successfully generated list invitation.", {"listInfo": reqBody.listId}, req))
        return inviteCode

    } catch (err) {
        logger.warn("%o", new LogMessage("ListInvitationImpl", "createInvitation", "Unable to create invitation.", {"error": err}, req))
        throw err
    }
}

async function revokeInvitationToList(requesterId, req) {
    let reqBody = req.body
    let input = inviteRevokeValidation(reqBody)

    if (input.error) {
        logger.warn("%o", new LogMessage("ListDetailImpl", "revokeInvitationToList", "Input validation failed", {"error": input.error}, req))
        throw Error('Input validation failed. ' + input.error)
    }

    let fetchResult = null
    let listInContext = fetchResult.toObject()

    if (listInContext === null) {
        logger.warn("%o", new LogMessage("ListInvitationImpl", "revokeInvitationToList", "Unable to retrieve list.", {
            "listInfo": reqBody.listId
        }, req))
        throw Error('Could not retrieve list.')
    }

    if (requesterId !== listInContext.owner) {
        logger.warn("%o", new LogMessage("ListInvitationImpl", "revokeInvitationToList", "Requester must be the owner.", {
            "listInfo": reqBody.listId, "userInfo": requesterId
        }, req))
        throw Error('Could not retrieve list.')
    }

    try {
        await Invite.findByIdAndDelete(reqBody.inviteId)
        logger.info("%o", new LogMessage("ListInvitationImpl", "revokeInvitationToList", "Successfully deleted invitation.", {
            "listInd": reqBody.listId, "inviteInfo": reqBody.inviteId
        }, req))
        return {"status": "success"}

    } catch (err) {
        logger.warn("%o", new LogMessage("ListInvitationImpl", "revokeInvitationToList", "Unable to delete invitation.", {
            "listInfo": reqBody.listId, "inviteInfo": reqBody.inviteId, "error": err.message
        }, req))
        throw err
    }
}

async function acceptInvitationToList(requesterId, req) {
    let reqBdy = req.body
    let input = inviteAcceptValidation(reqBody)

    if (input.error) {
        logger.warn("%o", new LogMessage("ListDetailImpl", "acceptInvitationToList", "Input validation failed", {"error": input.error}, req))
        throw Error('Input validation failed. ' + input.error)
    }

    try {
        // let fetchResult = await Invite.findOne({
        //     invitationCode: reqBody.inviteCode
        // })
        // let inviteDetails = fetchResult.toObject()
        let inviteDetails = null
        if (inviteDetails === null) {
            logger.warn("%o", new LogMessage("ListInvitationImpl", "acceptInvitationToList", "No invitation found.", {"inviteInfo": reqBody.inviteCode}, req))
            throw Error('No active invitation found.')
        }

        if (requesterId !== inviteDetails.userId) {
            logger.warn("%o", new LogMessage("ListInvitationImpl", "acceptInvitationToList", "Requester must be invitee.", {
                "inviteInfo": reqBody.inviteCode, "userInfo": requesterId
            }, req))
            throw Error('Only the invitee can accept an invitation.')
        }
        // add
        logger.info("%o", new LogMessage("ListInvitationImpl", "acceptInvitationToList", "Successfully accepted invite.", {
            "inviteInfo": reqBody.inviteCode, "userInfo": requesterId
        }, req))
        return {"status": "success"}

    } catch (err) {
        logger.warn("%o", new LogMessage("ListInvitationImpl", "acceptInvitationToList", "Unable to accept invite.", {
            "inviteInfo": reqBody.inviteCode, "userInfo": requesterId
        }, req))
        throw Error('Unable to accept invite.')
    }


}

function inviteValidation(data) {
    const schema = Joi.object({
        listId: Joi.string().required(), userId: Joi.string().required()
    })
    return schema.validate(data)
}

function inviteRevokeValidation(data) {
    const schema = Joi.object({
        listId: Joi.string().required(), inviteId: Joi.string().required()
    })
    return schema.validate(data)
}

function inviteAcceptValidation(data) {
    const schema = Joi.object({
        listId: Joi.string().required(), inviteCode: Joi.string().min(12).max(12).required()
    })
    return schema.validate(data)
}


export default {
    createInvitationToList, revokeInvitationToList, acceptInvitationToList
};