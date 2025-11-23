import express from 'express';
const router = express.Router()

import { DataResponse, ErrorResponse } from '../models/payload.mjs';
import util from '../middleware/session.mjs';
import ActivityListServiceImpl from "../services/ActivityListServiceImpl.mjs";


router.get("/activity", util.getUser, async (req, res) => {
    try {
        const appData = await ActivityListServiceImpl.getActivity(req.userId, req)
        res.json(new DataResponse({appData}))
    } catch (err) {
        res.status(500).json(new ErrorResponse(err.message));
    }
})

export default router;