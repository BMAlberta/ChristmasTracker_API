const express = require('express')
const router = express.Router()

const {DataResponse, ErrorResponse, NewErrorResponse} = require("../models/payload")
const util = require('../middleware/session')
const EnrollmentImpl = require('../services/EnrollmentServiceImpl')


router.post("/checkUser", async (req, res) => {
    try {
        const otpDetails = await EnrollmentImpl.enrollUser(req.session, req.body)
        res.json(new DataResponse({otpDetails}))
    } catch (err) {
        res.status(500).json(new ErrorResponse(err.message));
    }
})

router.post("/verifyEmail", async (req, res) => {
    try {
        const result = await EnrollmentImpl.validateEmail(req.session, req.body)
        req.session = result
        res.json(new DataResponse({"status": "success"}))
    } catch (err) {
        res.status(500).json(new ErrorResponse(err.message));
    }
})

router.post("/pwd/add", async (req, res) => {
    try {
        const result = await EnrollmentImpl.createPassword(req.session, req.body)
        res.json(new DataResponse({result}))
    } catch (err) {
        res.status(500).json(new ErrorResponse(err.message));
    }
})

router.post("/lw/createUser", async (req, res) => {
    try {
        const result = await EnrollmentImpl.enrollUserWithAccessCode(req.body)
        res.json(new DataResponse({result}))
    } catch (err) {
        res.status(500).json(new ErrorResponse(err.message));
    }
})



module.exports = router