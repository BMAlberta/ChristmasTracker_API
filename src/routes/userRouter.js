const express = require('express')
const router = express.Router()
const {DataResponse, ErrorResponse} = require("../models/payload")
const UserProfileServiceImpl = require('../services/UserProfileImpl')
const util = require("../middleware/session");


router.get("/:id", async (req, res) => {
    try {

        const user = await UserProfileServiceImpl.getUserOverview(req.params.id)
        res.json(new DataResponse({ user }))
    } catch (err) {
        res.status(500).json(new ErrorResponse(err.message));
    }
})

router.patch("/", util.getUser, async (req, res) => {
    try {
        const result = await UserProfileServiceImpl.updateUser(res.userId, req.body)
        res.json(new DataResponse(result))
    } catch (err) {
        res.status(500).json(new ErrorResponse(err.message));
    }
})


router.delete("/:id", util.getUser, async (req, res) => {
    res.status(500).json(new ErrorResponse("Currently not supported."));
})
module.exports = router
