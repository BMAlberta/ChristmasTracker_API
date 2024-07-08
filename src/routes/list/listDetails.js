const express = require('express')
const router = express.Router()

const {DataResponse, ErrorResponse} = require("../../models/payload")
const util = require('../../middleware/session')
const DetailImpl = require('../../services/list/ListDetailsImpl')
const CoreImpl = require('../../services/list/ListCoreImpl')

router.get("/overviews", util.getUser, async (req, res) => {
    try {
        const listOverviews = await DetailImpl.getOverviewsForList(res.userId)
        res.json(new DataResponse({listOverviews}));
    } catch (err) {
        res.status(500).json(new ErrorResponse(err.message));
    }
})

router.post("/addItem", util.getUser, CoreImpl.validateListStatus, async (req, res) => {
    try {
        const detail = await DetailImpl.addItemToList(res.userId, req.body)
        res.json(new DataResponse({detail}))
    } catch (err) {
        res.status(500).json(new ErrorResponse(err.message));
    }
})

router.patch('/update', util.getUser, CoreImpl.validateListStatus, async (req, res) => {
    try {
        let result = await DetailImpl.updateItem(res.userId, req.body)
        res.json(new DataResponse({result}));
    } catch (err) {
        res.status(500).json(new ErrorResponse(err.message));
    }
})

router.delete('/:id', util.getUser, async (req, res) => {
    try {
        let result = await DetailImpl.deleteItemFromList(req.params.id, res.userId, req.query.itemId)
        res.json(new DataResponse(result));
    } catch (err) {
        res.status(500).json(new ErrorResponse(err.message));
    }
})

module.exports = router
