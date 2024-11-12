import express from 'express';
const router = express.Router()

import { DataResponse, ErrorResponse } from '../../models/payload.mjs';
import util from '../../middleware/session.mjs';
import DetailImpl from '../../services/list/ListDetailsImpl.mjs';
import CoreImpl from '../../services/list/ListCoreImpl.mjs';

router.get("/overviews", util.getUser, async (req, res) => {
    try {
        const listOverviews = await DetailImpl.getOverviewsForList(res.userId)
        res.json(new DataResponse({listOverviews}));
    } catch (err) {
        res.status(500).json(new ErrorResponse(err.message));
    }
})

router.post("/addItem", util.getUser, CoreImpl.validateListStatus, async (req, res) => {
    try {
        const detail = await DetailImpl.addNewItemToList(res.userId, req.body)
        res.json(new DataResponse({detail}))
    } catch (err) {
        res.status(500).json(new ErrorResponse(err.message));
    }
})

router.patch('/update', util.getUser, CoreImpl.validateListStatus, async (req, res) => {
    try {
        let detail = await DetailImpl.updateItem(res.userId, req.body)
        res.json(new DataResponse({detail}));
    } catch (err) {
        res.status(500).json(new ErrorResponse(err.message));
    }
})

router.delete('/:id', util.getUser, async (req, res) => {
    try {
        let result = await DetailImpl.deleteItemFromList(req.params.id, res.userId, req.query.itemId)
        res.json(new DataResponse(result));
    } catch (err) {
        res.status(500).json(new ErrorResponse(err.message));
    }
})

export default router;