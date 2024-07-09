import { logger, LogMessage } from '../../config/winston.mjs';
import { EmbeddedListModel } from '../../models/embeddedList.mjs';
import Invite from '../../models/invitation.mjs';
import OTPGenerator from 'otp-generator';
import Joi from '@hapi/joi';

async function createInvitationToList(requesterId, reqBody) {
    let input = inviteValidation(reqBody)

    if (input.error) {
        throw Error('Input validation failed. ' + input.err)
    }

    let fetchResult = await EmbeddedListModel.findById(reqBody.listId)
    let listInContext = fetchResult.toObject()

    if (listInContext === null) {
        logger.info("%o", new LogMessage("ListInvitationImpl", "createInvitation", "Unable to retrieve list.", {
            "listInfo": reqBody.listId
        }))
        throw Error('Could not retrieve list.')
    }

    if (requesterId !== listInContext.owner) {
        logger.info("%o", new LogMessage("ListInvitationImpl", "createInvitation", "Requester must be the owner.", {
            "listInfo": reqBody.listId, "userInfo": requesterId
        }))
        throw Error('Could not retrieve list.')
    }

    try {
        const generatedCode = OTPGenerator.generate(12, {
            upperCaseAlphabets: true, lowerCaseAlphabets: true, specialChars: true
        })

        const invitation = new Invite({
            invitationCode: generatedCode, listId: reqBody.listId, userId: reqBody.userId
        })

        const inviteCode = await invitation.save()
        logger.info("%o", new LogMessage("ListInvitationImpl", "createInvitation", "Successfully generated list invitation.", {"listInfo": reqBody.listId}))
        return inviteCode

    } catch (err) {
        logger.info("%o", new LogMessage("ListInvitationImpl", "createInvitation", "Unable to create invitation.", {"error": err}))
        throw err
    }
}

async function revokeInvitationToList(requesterId, reqBody) {

    let input = inviteRevokeValidation(reqBody)

    if (input.error) {
        throw Error('Input validation failed. ' + input.err)
    }

    let fetchResult = await EmbeddedListModel.findById(reqBody.listId)
    let listInContext = fetchResult.toObject()

    if (listInContext === null) {
        logger.info("%o", new LogMessage("ListInvitationImpl", "revokeInvitationToList", "Unable to retrieve list.", {
            "listInfo": reqBody.listId
        }))
        throw Error('Could not retrieve list.')
    }

    if (requesterId !== listInContext.owner) {
        logger.info("%o", new LogMessage("ListInvitationImpl", "revokeInvitationToList", "Requester must be the owner.", {
            "listInfo": reqBody.listId, "userInfo": requesterId
        }))
        throw Error('Could not retrieve list.')
    }

    try {
        await Invite.findByIdAndDelete(reqBody.inviteId)
        logger.info("%o", new LogMessage("ListInvitationImpl", "revokeInvitationToList", "Successfully deleted invitation.", {
            "listInd": reqBody.listId, "inviteInfo": reqBody.inviteId
        }))
        return {"status": "success"}

    } catch (err) {
        logger.info("%o", new LogMessage("ListInvitationImpl", "revokeInvitationToList", "Unable to delete invitation.", {
            "listInfo": reqBody.listId, "inviteInfo": reqBody.inviteId, "error": err.message
        }))
        throw err
    }
}

async function acceptInvitationToList(requesterId, reqBody) {

    let input = inviteAcceptValidation(reqBody)

    if (input.error) {
        throw Error('Input validation failed. ' + input.error)
    }

    try {
        let fetchResult = await Invite.findOne({
            invitationCode: reqBody.inviteCode
        })
        let inviteDetails = fetchResult.toObject()

        if (inviteDetails === null) {
            logger.info("%o", new LogMessage("ListInvitationImpl", "acceptInvitationToList", "No invitation found.", {"inviteInfo": reqBody.inviteCode}))
            throw Error('No active invitation found.')
        }

        if (requesterId !== inviteDetails.userId) {
            logger.info("%o", new LogMessage("ListInvitationImpl", "acceptInvitationToList", "Requester must be invitee.", {
                "inviteInfo": reqBody.inviteCode, "userInfo": requesterId
            }))
            throw Error('Only the invitee can accept an invitation.')
        }

        await EmbeddedListModel.findByIdAndUpdate(reqBody.listId, {
            $addToSet: {members: requesterId}, lastUpdateDate: Date.now()
        })
        logger.info("%o", new LogMessage("ListInvitationImpl", "acceptInvitationToList", "Successfully accepted invite.", {
            "inviteInfo": reqBody.inviteCode, "userInfo": requesterId
        }))
        return {"status": "success"}

    } catch (err) {
        logger.info("%o", new LogMessage("ListInvitationImpl", "acceptInvitationToList", "Unable to accept invite.", {
            "inviteInfo": reqBody.inviteCode, "userInfo": requesterId
        }))
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