import express from 'express';
const router = express.Router()

import { DataResponse, ErrorResponse } from '../models/payload.mjs';
import util from '../middleware/session.mjs';
import StatsImpl from '../services/StatsImpl.mjs';


router.get("/purchases", util.getUser, async (req, res) => {
    try {
        const purchaseStats = await StatsImpl.getPurchaseOverviews(res.userId)
        res.json(new DataResponse({purchaseStats}))
    } catch (err) {
        res.status(500).json(new ErrorResponse(err.message));
    }
})

export default router;