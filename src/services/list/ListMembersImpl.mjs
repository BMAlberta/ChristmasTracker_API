import { logger, LogMessage } from '../../config/winston.mjs';
import Joi from '@hapi/joi';

// Error Domain: 9

async function getJoinedLists(userId, req) {
    try {
        // let fetchResult = await EmbeddedListModel.aggregate([
        //     {
        //       '$match': {
        //         '$and': [
        //           {
        //             'members': {
        //               '$in': [
        //                 userId
        //               ]
        //             }
        //           }, {
        //             'owner': {
        //               '$ne': userId
        //             }
        //           }, {
        //             'status': {
        //               '$eq': 'active'
        //             }
        //           }
        //         ]
        //       }
        //     }, {
        //       '$addFields': {
        //         'convertedMemberId': {
        //           '$toObjectId': '$_id'
        //         }
        //       }
        //     }, {
        //       '$project': {
        //         '_id': 0,
        //         'listName': '$name',
        //         'listId': {
        //           '$toString': '$_id'
        //         }
        //       }
        //     }
        //   ]
        // )
        let fetchResult = null
        logger.info("%o", new LogMessage("ListMembersImpl", "getJoinedLists", "Successfully fetched joined lists..", {"userId": userId}, req))
        return fetchResult
    } catch (err) {
        logger.warn("%o", new LogMessage("ListMembersImpl", "getJoinedLists", "Unable to fetch joined lists for user.", {"error": err, "userId": userId}, req))
        throw err
    }
}


async function removeUserFromList(requesterId, req) {
  let reqBody = req.body
    let input = memberChangeValidation(reqBody)

    if (input.error) {
      logger.warn("%o", new LogMessage("ListDetailImpl", "removeUserFromList", "Input validation failed", {"error": input.error}, req))
      throw Error('Input validation failed. ' + input.error)
    }

    try {
        // let fetchResult = await EmbeddedListModel.findById(reqBody.listId)
        let listInContext = null
        if (listInContext === null) {
            logger.warn("%o", new LogMessage("ListMembersImpl", "removeUserFromList", "Unable to retrieve list.", {
                "listInfo": reqBody.listId
            }, req))
            throw Error('Could not retrieve list.')
        }

        if (requesterId !== listInContext.owner) {
            logger.warn("%o", new LogMessage("ListMembersImpl", "removeUserFromList", "Requester must be the owner.", {
                "listInfo": reqBody.listId, "userInfo": requesterId
            }, req))
            throw Error('Could not retrieve list.')
        }

        // let updatedList = await EmbeddedListModel.findByIdAndUpdate(reqBody.listId, {
        //     $pull: {members: reqBody.userId}, lastUpdateDate: Date.now()
        // }, {
        //     new: true
        // })
        let updatedList = null
        logger.info("%o", new LogMessage("ListMembersImpl", "removeUserFromList", "Removed user from list.", {
            "listInfo": reqBody.listId, "userInfo": reqBody.userId
        }, req))
        return updatedList

    } catch (err) {
        logger.warn("%o", new LogMessage("ListMembersImpl", "removeUserFromList", "Unable to remove user from list.", {"error": err}, req))
        throw err
    }
}

async function removeSelfFromList(requesterId, req) {
    let reqBody = req.body
    let input = unsubscribeValidation(reqBody)
    if (input.error) {
      logger.warn("%o", new LogMessage("ListDetailImpl", "removeSelfFromList", "Input validation failed", {"error": input.error}, req))
      throw Error('Input validation failed. ' + input.error)
    }

    try {
        // let fetchResult = await EmbeddedListModel.findById(reqBody.listId)
        let listInContext = null
        if (listInContext === null) {
            logger.warn("%o", new LogMessage("ListMembersImpl", "removeSelfFromList", "Unable to retrieve list.", {
                "listInfo": reqBody.listId
            }, req))
            throw Error('Could not retrieve list.')
        }

        if (requesterId === listInContext.owner) {
            logger.warn("%o", new LogMessage("ListMembersImpl", "removeSelfFromList", "Owner cannot remove self from list.", {
                "listInfo": reqBody.listId, "userInfo": requesterId
            }, req))
            throw Error('Owner cannot remove self.')
        }

        // await EmbeddedListModel.findByIdAndUpdate(reqBody.listId, {
        //     $pull: {members: requesterId}, lastUpdateDate: Date.now()
        // })
        logger.info("%o", new LogMessage("ListMembersImpl", "removeSelfFromList", "Removed user from list.", {
            "listInfo": reqBody.listId
        }, req))

        return {"status": "success"}

    } catch (err) {
        logger.warn("%o", new LogMessage("ListMembersImpl", "removeSelfFromList", "Unable to remove self from list.", {"error": err}, req))
        throw err
    }
}

function memberChangeValidation(data) {
    const schema = Joi.object({
        listId: Joi.string().required(), userId: Joi.string().required()
    })
    return schema.validate(data)
}

function unsubscribeValidation(data) {
    const schema = Joi.object({
        listId: Joi.string().required()
    })
    return schema.validate(data)
}

export default {
    removeUserFromList, removeSelfFromList, getJoinedLists
};