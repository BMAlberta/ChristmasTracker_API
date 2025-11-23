import express from 'express';
const router = express.Router()

import { DataResponse, ErrorResponse } from '../models/payload.mjs';
import util from '../middleware/session.mjs';
import OverviewImpl from '../services/OverviewServiceImpl.mjs';


router.get("/list", util.getUser, async (req, res) => {
    try {
        const appData = await OverviewImpl.aggregateData(res.userId, req)
        res.json(new DataResponse({appData}))
    } catch (err) {
        res.status(500).json(new ErrorResponse(err.message));
    }
})

export default router;