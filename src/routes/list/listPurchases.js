const express = require('express')
const router = express.Router()

const {DataResponse, ErrorResponse} = require("../../models/payload")
const util = require('../../middleware/session')
const PurchaseImpl = require('../../services/list/ListPurchasesImpl')
const CoreImpl = require('../../services/list/ListCoreImpl')

router.post("/", util.getUser, CoreImpl.validateListStatus, async (req, res) => {
    try {
        const detail = await PurchaseImpl.purchaseItem(res.userId, req.body)
        res.json(new DataResponse({detail}))
    } catch (err) {
        res.status(500).json(new ErrorResponse(err.message));
    }
})

router.post("/retract", util.getUser, CoreImpl.validateListStatus, async (req, res) => {
    try {
        const detail = await PurchaseImpl.retractItemPurchase(res.userId, req.body)
        res.json(new DataResponse({detail}))
    } catch (err) {
        res.status(500).json(new ErrorResponse(err.message));
    }
})

module.exports = router