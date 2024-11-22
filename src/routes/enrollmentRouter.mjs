import express from 'express';
const router = express.Router()

import { DataResponse, ErrorResponse } from '../models/payload.mjs';
import EnrollmentImpl from '../services/EnrollmentServiceImpl.mjs';

router.post("/checkUser", async (req, res) => {
    try {
        const otpDetails = await EnrollmentImpl.enrollUser(req)
        res.json(new DataResponse({otpDetails}))
    } catch (err) {
        res.status(500).json(new ErrorResponse(err.message));
    }
})

router.post("/verifyEmail", async (req, res) => {
    try {
        const result = await EnrollmentImpl.validateEmail(req)
        req.session = result
        res.json(new DataResponse({"status": "success"}))
    } catch (err) {
        res.status(500).json(new ErrorResponse(err.message));
    }
})

router.post("/pwd/add", async (req, res) => {
    try {
        const result = await EnrollmentImpl.createPassword(req)
        res.json(new DataResponse({result}))
    } catch (err) {
        res.status(500).json(new ErrorResponse(err.message));
    }
})

router.post("/lw/createUser", async (req, res) => {
    try {
        const result = await EnrollmentImpl.enrollUserWithAccessCode(req)
        res.json(new DataResponse({result}))
    } catch (err) {
        res.status(500).json(new ErrorResponse(err.message));
    }
})

export default router;