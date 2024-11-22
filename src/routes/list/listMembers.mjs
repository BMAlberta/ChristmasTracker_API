import express from 'express';
const router = express.Router()

import { DataResponse, ErrorResponse } from '../../models/payload.mjs';
import util from '../../middleware/session.mjs';
import MembersImpl from '../../services/list/ListMembersImpl.mjs';

router.get('/joined', util.getUser, async (req, res) => {
    try {
        let result = await MembersImpl.getJoinedLists(res.userId, req)
        res.json(new DataResponse(result));
    } catch (err) {
        res.status(500).json(new ErrorResponse(err.message));
    }
})

router.post('/delete', util.getUser, async (req, res) => {
    try {
        let result = await MembersImpl.removeUserFromList(res.userId, re)
        res.json(new DataResponse(result));
    } catch (err) {
        res.status(500).json(new ErrorResponse(err.message));
    }
})

router.post('/unsubscribe', util.getUser, async (req, res) => {
    try {
        let result = await MembersImpl.removeSelfFromList(res.userId, req)
        res.json(new DataResponse({ result }));
    } catch (err) {
        res.status(500).json(new ErrorResponse(err.message));
    }
})

export default router;