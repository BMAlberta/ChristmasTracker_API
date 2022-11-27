const express = require('express')
const router = express.Router()

const {DataResponse, ErrorResponse} = require("../../models/payload")
const util = require('../../middleware/session')
const InviteImpl = require('../../services/list/ListInvitationImpl')


router.post("/send", util.getUser, async (req, res) => {
    try {
        const result = await InviteImpl.createInvitationToList(res.userId, req.body)
        res.json(new DataResponse({result}))
    } catch (err) {
        res.status(500).json(new ErrorResponse(err.message));
    }
})

router.post('/revoke', util.getUser, async (req, res) => {
    try {
        const result = await InviteImpl.revokeInvitationToList(res.userId, req.body)
        res.json(new DataResponse(result));
    } catch (err) {
        res.status(500).json(new ErrorResponse(err.message));
    }
})

router.post('/accept', util.getUser, async (req, res) => {
    try {
        let result = await InviteImpl.acceptInvitationToList(res.userId, req.body)
        res.json(new DataResponse({result}));
    } catch (err) {
        res.status(500).json(new ErrorResponse(err.message));
    }
})

module.exports = router