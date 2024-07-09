import express from 'express';
const router = express.Router()
import NetworkUtils from '../util/request.mjs';
import { DataResponse, ErrorResponse } from '../models/payload.mjs';
import AuthServiceImpl from '../services/AuthServiceImpl.mjs';
import util from '../middleware/session.mjs';

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
        await AuthServiceImpl.doLogout(req.session)
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
export default router;