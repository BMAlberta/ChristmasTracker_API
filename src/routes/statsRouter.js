const express = require('express')
const router = express.Router()

const {DataResponse, ErrorResponse} = require("../models/payload")
const util = require('../middleware/session')
const StatsImpl = require('../services/StatsImpl')


router.get("/purchases", util.getUser, async (req, res) => {
    try {
        const purchaseStats = await StatsImpl.getPurchaseOverviews(res.userId)
        res.json(new DataResponse({purchaseStats}))
    } catch (err) {
        res.status(500).json(new ErrorResponse(err.message));
    }
})

module.exports = router