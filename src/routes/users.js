const express = require('express')
const router = express.Router()
const User = require('../models/user')
const { DataResponse, ErrorResponse } = require("../models/payload")
const util = require('../middleware/validate-token')
const { logger, LogMessage } = require('../config/winston');

// Get all users
router.get('/list', async (_, res) => {
    try {
        const users = await User.find()
        logger.info("%o", new LogMessage("Users", "Get all users", "Successfully retrieved users."))
        res.json(new DataResponse({ users }));
    } catch (err) {
        logger.info("%o", new LogMessage("Users", "Get all users", "Unable to retrieve users.", { "error": err.message }))
        res.status(500).json(new ErrorResponse(err.message));
    }
})

// Get current user details
router.get('/', util.getUser, async (_, res) => {
    try {
        const user = await User.findById(res.id, { email: 1, firstName: 1, lastName: 1, creationDate: 1, lastLogInLocation: 1, lastLogInDate: 1,lastPasswordChange: 1, _id: 1 })
        logger.info("%o", new LogMessage("Users", "Get current user", "Successfully retrieved user."))
        res.json(new DataResponse({ user }));
    } catch (err) {
        logger.info("%o", new LogMessage("Users", "Get current user", "Unable to retrieve user data.", { "error": err.message }))
        res.status(500).json(new ErrorResponse(err.message));
    }
})

// Get one user
router.get('/:id', getUser, (_, res) => {
    const user = res.user
    res.json(new DataResponse({ user }));

})

// Create a user
router.post('/', async (req, res) => {
    const user = new User({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        pwd: req.body.password
    })

    try {
        const newUser = await user.save()
        res.json(new DataResponse({ newUser }));

        logger.info("%o", new LogMessage("Users", "Create user", "Successfully created user.", { "userInfo": newUser }))
    } catch (err) {
        logger.info("%o", new LogMessage("Users", "Create user", "Unable to create user.", { "userInfo": user, "error": err.message }))
        res.status(500).json(new ErrorResponse(err.message));
    }
})

// Update a user
router.patch('/:id', getUser, async (req, res) => {
    if (req.body.firstName != null) {
        res.user.firstName = req.body.firstName
    }

    if (req.body.lastName != null) {
        res.user.lastName = req.body.lastName
    }

    if (req.body.role != null) {
        res.user.role = req.body.role
    }

    try {
        const updatedUser = await res.user.save()
        logger.info("%o", new LogMessage("Users", "Update user", "Successfully updated user.", { "userInfo": res.user._id }))
        res.json(new DataResponse({ updatedUser }));

    } catch (err) {
        logger.info("%o", new LogMessage("Users", "Update user", "Unable to update user.", { "userInfo": res.user._id, "error": err.message }))
        res.status(500).json(new ErrorResponse(err.message));
    }
})

// Delete a user
router.delete('/:id', getUser, async (_, res) => {
    try {
        await res.user.remove()
        logger.info("%o", new LogMessage("Users", "Delete user", "Successfully deleted user.", { "userInfo": res.user._id }))
        res.json(new DataResponse());

    } catch (err) {
        logger.info("%o", new LogMessage("Users", "Delete user", "Unable to delete user.", { "userInfo": res.user._id, "error": err.message }))
        res.status(500).json(new ErrorResponse(err.message));
    }
})


async function getUser(req, res, next) {
    try {
        user = await User.findById(req.params.id)
        if (user == null) {
            logger.info("%o", new LogMessage("Users", "Delete user", "Unable to retrieve user.", { "userInfo": req.params.id }))
            return res.status(500).json(new ErrorResponse("Unable to find a user with that id"));
        }
    } catch (err) {
        logger.info("%o", new LogMessage("Users", "Delete user", "Failed to retrieve user.", { "userInfo": req.params.id, "error": err.message }))
        return res.status(500).json(new ErrorResponse(err.message));
    }

    res.user = user
    logger.info("%o", new LogMessage("Users", "Get user.", "Successfully retrieved user.", {"itemInfo": req.params.id }))
    next()
}

module.exports = router
