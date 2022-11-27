const express = require('express')
const router = express.Router()

const { DataResponse, ErrorResponse } = require("../../models/payload")
const util = require('../../middleware/session')
const MembersImpl = require('../../services/list/ListMembersImpl')

router.post('/delete', util.getUser, async (req, res) => {
    try {
        let result = await MembersImpl.removeUserFromList(res.userId, req.body)
        res.json(new DataResponse(result));
    } catch (err) {
        res.status(500).json(new ErrorResponse(err.message));
    }
})

router.post('/unsubscribe', util.getUser, async (req, res) => {
    try {
        let result = await MembersImpl.removeSelfFromList(res.userId, req.body)
        res.json(new DataResponse({ result }));
    } catch (err) {
        res.status(500).json(new ErrorResponse(err.message));
    }
})

module.exports = router