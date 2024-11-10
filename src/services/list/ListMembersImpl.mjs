import { logger, LogMessage } from '../../config/winston.mjs';
import { EmbeddedListModel } from '../../models/embeddedList.mjs';
import Joi from '@hapi/joi';



async function getJoinedLists(userId) {
    try {
        let fetchResult = await EmbeddedListModel.aggregate([
            {
              '$match': {
                '$and': [
                  {
                    'members': {
                      '$in': [
                        userId
                      ]
                    }
                  }, {
                    'owner': {
                      '$ne': userId
                    }
                  }, {
                    'status': {
                      '$eq': 'active'
                    }
                  }
                ]
              }
            }, {
              '$addFields': {
                'convertedMemberId': {
                  '$toObjectId': '$_id'
                }
              }
            }, {
              '$project': {
                '_id': 0, 
                'listName': '$name', 
                'listId': {
                  '$toString': '$_id'
                }
              }
            }
          ]
        )
        logger.info("%o", new LogMessage("ListMembersImpl", "getJoinedLists", "Succesfully fetched joined lists..", {"userId": userId}))
        return fetchResult
    } catch (err) {
        logger.info("%o", new LogMessage("ListMembersImpl", "getJoinedLists", "Unable to fetch joined lists for user.", {"error": err, "userId": userId}))
        throw err
    }
}


async function removeUserFromList(requesterId, reqBody) {

    let input = memberChangeValidation(reqBody)

    if (input.error) {
        throw Error('Input validation failed. ' + input.error)
    }

    try {
        let fetchResult = await EmbeddedListModel.findById(reqBody.listId)
        let listInContext = fetchResult.toObject()
        if (listInContext === null) {
            logger.info("%o", new LogMessage("ListMembersImpl", "removeUserFromList", "Unable to retrieve list.", {
                "listInfo": reqBody.listId
            }))
            throw Error('Could not retrieve list.')
        }

        if (requesterId !== listInContext.owner) {
            logger.info("%o", new LogMessage("ListMembersImpl", "removeUserFromList", "Requester must be the owner.", {
                "listInfo": reqBody.listId, "userInfo": requesterId
            }))
            throw Error('Could not retrieve list.')
        }

        let updatedList = await EmbeddedListModel.findByIdAndUpdate(reqBody.listId, {
            $pull: {members: reqBody.userId}, lastUpdateDate: Date.now()
        }, {
            new: true
        })
        logger.info("%o", new LogMessage("ListMembersImpl", "removeUserFromList", "Removed user from list.", {
            "listInfo": reqBody.listId, "userInfo": reqBody.userId
        }))
        return updatedList

    } catch (err) {
        logger.info("%o", new LogMessage("ListMembersImpl", "removeUserFromList", "Unable to remove user from list.", {"error": err}))
        throw err
    }
}

async function removeSelfFromList(requesterId, reqBody) {

    let input = unsubscribeValidation(reqBody)
    if (input.error) {
        throw Error('Input validation failed ' + input.error)
    }

    try {
        let fetchResult = await EmbeddedListModel.findById(reqBody.listId)
        let listInContext = fetchResult.toObject()
        if (listInContext === null) {
            logger.info("%o", new LogMessage("ListMembersImpl", "removeSelfFromList", "Unable to retrieve list.", {
                "listInfo": reqBody.listId
            }))
            throw Error('Could not retrieve list.')
        }

        if (requesterId === listInContext.owner) {
            logger.info("%o", new LogMessage("ListMembersImpl", "removeSelfFromList", "Owner cannot remove self from list.", {
                "listInfo": reqBody.listId, "userInfo": requesterId
            }))
            throw Error('Owner cannot remove self.')
        }

        await EmbeddedListModel.findByIdAndUpdate(reqBody.listId, {
            $pull: {members: requesterId}, lastUpdateDatae: Date.now()
        })
        logger.info("%o", new LogMessage("ListMembersImpl", "removeSelfFromList", "Removed user from list.", {
            "listInfo": reqBody.listId
        }))

        return {"status": "success"}

    } catch (err) {
        logger.info("%o", new LogMessage("ListMembersImpl", "removeSelfFromList", "Unable to remove self from list.", {"error": err}))
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