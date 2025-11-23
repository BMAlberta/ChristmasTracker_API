import express from 'express';
const router = express.Router()
import NetworkUtils from '../util/request.mjs';
import { DataResponse, ErrorResponse } from '../models/payload.mjs';
import AuthServiceImpl from '../services/AuthServiceImpl.mjs';
import util from '../middleware/session.mjs';
import { logger, LogMessage } from '../config/winston.mjs';
import { TrackerError } from '../config/errors.mjs';

/**
   * @swagger
   * /auth/login:
   *     post:
   *       tags:
   *         - Auth
   *       summary: Obtain a session
   *       description: Logs a user in 
   *       requestBody:
   *         description: Username and password for the user requesting to log in.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/LoginBody'
   *         required: true
   *       responses:
   *         '200':
   *           description: Successful login - userId is returned.
   *           content:
   *             application/json:
   *               schema:
   *                 $ref: '#/components/schemas/LoginSuccess'
   *   
   */
router.post("/login", async (req, res) => {
    try {
        let metadata = NetworkUtils.getCallerIP(req)
        if (!NetworkUtils.checkAppVersion(req)) {
            logger.warn("%o", new LogMessage("AuthRouter", "postLogin", "App version not valid.", { "userId": req.body.email }, req))
            res.status(401).json(new ErrorResponse(new TrackerError("1.1", "Invalid App version.")));
        } else {
            const userInfo = await AuthServiceImpl.doLogin(req)
            res.json(new DataResponse({userInfo}))
        }
    } catch (err) {
        res.status(500).json(new ErrorResponse(err));
    }

})

/**
   * @swagger
   * /auth/logout:
   *   post:
   *     tags:
   *       - Auth
   *     summary: Logoff
   *     description: Terminates a user's session. 
   *       This is no response API - there is no return value.
   *     responses:
   *       '200':
   *         description: Successful logoff.
   */
router.post("/logout", async (req, res) => {
    try {
        await AuthServiceImpl.doLogout(req)
        res.json(new DataResponse({"status": "success"}))
    } catch (err) {
        res.status(500).json(new ErrorResponse(err));
    }
})

/**
   * @swagger
   * /auth/password/update:
   *   post:
   *     tags:
   *       - Auth
   *     summary: Password update.
   *     description: Updates the user's password.
   *     requestBody:
   *       description: Both new and old passwords are required. UserId and other
   *         identifying attributes are retrieved from the headers.
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LoginBody'
   *       required: true
   *     responses:
   *       '200':
   *         description: Successfully updated password - userId is returned.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/LoginSuccess'
   */
router.post("/password/update", util.getUser, async (req, res) => {
    try {
        const result = await AuthServiceImpl.updatePassword(res.userId, req)
        res.json(new DataResponse({"userId": result.userId}))
    } catch (err) {
        res.status(500).json(new ErrorResponse(err));
    }
})
export default router;