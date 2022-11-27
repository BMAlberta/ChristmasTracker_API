const express = require('express')
const router = express.Router()
const NetworkUtils = require('../util/request')
const {DataResponse, ErrorResponse} = require("../models/payload")
const AuthServiceImpl = require('../services/AuthServiceImpl')
const util = require("../middleware/session");


router.post("/login", async (req, res) => {
    try {
        let metadata = NetworkUtils.getCallerIP(req)
        const userInfo = await AuthServiceImpl.doLogin(req.session, req.body, metadata)
        res.json(new DataResponse({userInfo}))
    } catch (err) {
        res.status(500).json(new ErrorResponse(err.message));
    }
})

router.post("/logout", async (req, res) => {
    try {
        const result = await AuthServiceImpl.doLogout(req.session)
        res.json(new DataResponse({"status": "success"}))
    } catch (err) {
        res.status(500).json(new ErrorResponse(err.message));
    }
})


router.post("/password/update", util.getUser, async (req, res) => {
    try {
        const result = await AuthServiceImpl.updatePassword(res.userId, req.body)
        res.json(new DataResponse(result._id))
    } catch (err) {
        res.status(500).json(new ErrorResponse(err.message));
    }
})
module.exports = router