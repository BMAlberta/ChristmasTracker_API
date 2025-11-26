import express from 'express';
const router = express.Router()
import { DataResponse, ErrorResponse } from '../models/payload.mjs';
import UserProfileServiceImpl from '../services/UserProfileImpl.mjs';
import util from '../middleware/session.mjs';
// import {params} from "newrelic/lib/shim/specs/index.js";


router.get("/:id", async (req, res) => {
    try {
        const user = await UserProfileServiceImpl.getUserOverview(req.params.id, req)
        res.json(new DataResponse({ user }))
    } catch (err) {
        res.status(500).json(new ErrorResponse(err.message));
    }
})

router.patch("/", util.getUser, async (req, res) => {
    try {
        const updateInfo = await UserProfileServiceImpl.updateUser(res.userId, req)
        res.json(new DataResponse({ updateInfo }))
    } catch (err) {
        res.status(500).json(new ErrorResponse(err.message));
    }
})

router.delete("/:id", util.getUser, async (req, res) => {
    res.status(500).json(new ErrorResponse("Currently not supported."));
})

router.get("/metadata/list", util.getUser, async (req, res) => {
    try {
        const userMetadata = await UserProfileServiceImpl.getUserOverview(res.userId, req)
        res.json(new DataResponse({ userMetadata }))
    } catch (err) {
        res.status(500).json(new ErrorResponse(err.message));
    }
})

export default router;