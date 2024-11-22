import express from 'express';
const router = express.Router()

import { DataResponse, ErrorResponse } from '../../models/payload.mjs';
import util from '../../middleware/session.mjs';
import InviteImpl from '../../services/list/ListInvitationImpl.mjs';


router.post("/send", util.getUser, async (req, res) => {
    try {
        const result = await InviteImpl.createInvitationToList(res.userId, req)
        res.json(new DataResponse({result}))
    } catch (err) {
        res.status(500).json(new ErrorResponse(err.message));
    }
})

router.post('/revoke', util.getUser, async (req, res) => {
    try {
        const result = await InviteImpl.revokeInvitationToList(res.userId, req)
        res.json(new DataResponse(result));
    } catch (err) {
        res.status(500).json(new ErrorResponse(err.message));
    }
})

router.post('/accept', util.getUser, async (req, res) => {
    try {
        let result = await InviteImpl.acceptInvitationToList(res.userId, req)
        res.json(new DataResponse({result}));
    } catch (err) {
        res.status(500).json(new ErrorResponse(err.message));
    }
})

export default router;