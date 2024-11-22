import express from 'express';
const router = express.Router()
import { DataResponse, ErrorResponse } from '../models/payload.mjs';
import UserProfileServiceImpl from '../services/UserProfileImpl.mjs';
import util from '../middleware/session.mjs';


router.get("/:id", async (req, res) => {
    try {

        const user = await UserProfileServiceImpl.getUserOverview(req)
        res.json(new DataResponse({ user }))
    } catch (err) {
        res.status(500).json(new ErrorResponse(err.message));
    }
})

router.patch("/", util.getUser, async (req, res) => {
    try {
        const result = await UserProfileServiceImpl.updateUser(res.userId, req)
        res.json(new DataResponse(result))
    } catch (err) {
        res.status(500).json(new ErrorResponse(err.message));
    }
})

router.delete("/:id", util.getUser, async (req, res) => {
    res.status(500).json(new ErrorResponse("Currently not supported."));
})

export default router;