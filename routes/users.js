const express = require('express')
const router = express.Router()
const User = require('../models/user')
const { DataResponse, ErrorResponse } = require("../models/payload")

// Get all users
router.get('/', async (req, res) => {
    try {
        const users = await User.find()
        logger.info("%o", new LogMessage("Users", "Get all users", "Successfully retrieved users."))
        res.json(new DataResponse({ users }));
    } catch (err) {
        logger.info("%o", new LogMessage("Users", "Get all users", "Unable to retrieve users.", { "error": err.message }))
        res.status(500).json(new ErrorResponse(err.message));
    }
})

// Get one user
router.get('/:id', getUser, (req, res) => {
    const user = res.user
    res.json(new DataResponse({ user }));

})

// Create a user
router.post('/', async (req, res) => {
    const user = new User({
        firstName: req.body.firstName,
        lastName: req.body.lastName
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
router.delete('/:id', getUser, async (req, res) => {
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