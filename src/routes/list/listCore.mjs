import express from 'express';
const router = express.Router()

import { DataResponse, ErrorResponse } from '../../models/payload.mjs';
import util from '../../middleware/session.mjs';
import CoreImpl from '../../services/list/ListCoreImpl.mjs';


router.get("/owned/", util.getUser, async (req, res) => {
    try {
        const ownedLists = await CoreImpl.getOwnedLists(res.userId)
        res.json(new DataResponse({ownedLists}));
    } catch (err) {
        res.status(501).json(new ErrorResponse(err.message));
    }
})

router.get("/:id", util.getUser, async (req, res) => {
    try {
        const detail = await CoreImpl.getListDetails(req.params.id, res.userId, req.query.verbose)
        res.json(new DataResponse({detail}));
    } catch (err) {
        res.status(500).json(new ErrorResponse(err.message));
    }
})

router.get("/owner/:id", util.getUser, async (req, res) => {
    try {
        const ownedLists = await CoreImpl.getOwnedLists(req.params.id)
        res.json(new DataResponse({ownedLists}));
    } catch (err) {
        res.status(501).json(new ErrorResponse(err.message));
    }
})

router.post("/create", util.getUser, async (req, res) => {
    try {
        const detail = await CoreImpl.createList(res.userId, req.body)
        res.json(new DataResponse({detail}))
    } catch (err) {
        res.status(500).json(new ErrorResponse(err.message));
    }
})

router.patch('/:id', util.getUser, CoreImpl.validateListStatus, async (req, res) => {
    try {
        let result = await CoreImpl.updateList(req.params.id, res.userId, req.body)
        res.json(new DataResponse({result}));
    } catch (err) {
        res.status(500).json(new ErrorResponse(err.message));
    }
})

router.delete('/:id', util.getUser, async (req, res) => {
    try {
        await CoreImpl.deleteList(req.params.id, res.userId)
        res.json(new DataResponse());
    } catch (err) {
        res.status(500).json(new ErrorResponse(err.message));
    }
})

export default router;