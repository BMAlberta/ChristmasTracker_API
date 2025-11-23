import express from 'express';
const router = express.Router()

import { DataResponse, ErrorResponse } from '../../models/payload.mjs';
import util from '../../middleware/session.mjs';
import PurchaseImpl from '../../services/list/ListPurchasesImpl.mjs';
import CoreImpl from '../../services/list/ListCoreImpl.mjs';

router.post("/", util.getUser, CoreImpl.validateListStatus, async (req, res) => {
    try {
        const purchaseInfo = await PurchaseImpl.purchaseItem(res.userId, req)
        res.json(new DataResponse({purchaseInfo}))
    } catch (err) {
        res.status(500).json(new ErrorResponse(err.message));
    }
})

router.post("/retract", util.getUser, CoreImpl.validateListStatus, async (req, res) => {
    try {
        const detail = await PurchaseImpl.retractItemPurchase(res.userId, req)
        res.json(new DataResponse({detail}))
    } catch (err) {
        res.status(500).json(new ErrorResponse(err.message));
    }
})

export default router;