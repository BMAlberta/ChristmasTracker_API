const express = require('express')
const router = express.Router()
const { registerValidation, loginValidation } = require("../middleware/validation")
const User = require("../models/user")
const { DataResponse, ErrorResponse } = require("../models/payload")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { logger, LogMessage } = require('../config/winston');

router.post("/register", async (req, res) => {

    const { error } = registerValidation(req.body)

    if (error) {
        var logInfo = new LogMessage("Auth", "register", "Validation Error", { "message": error.details[0].message })
        logger.info("%o", logInfo)
        return res.status(400).json(new ErrorResponse( error.details[0].message));
    }

    const emailExists = await User.findOne({ email: req.body.email })

    if (emailExists) {
        var logInfo = new LogMessage("Auth", "register", "Email already exists.", { "userInfo": req.body.email })
        logger.info("%o", logInfo)
        return res.status(400).json(new ErrorResponse( "An account with that email already exists."));
    }

    const salt = await bcrypt.genSalt(10)
    const saltedPassword = await bcrypt.hash(req.body.password, salt)

    const user = new User({
        email: req.body.email,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        pwd: saltedPassword
    })

    try {
        const savedUser = await user.save()
        var logInfo = new LogMessage("Auth", "register", "User successfully created.", { "userId": savedUser._id })
        logger.info("%o", logInfo)
        res.json(new DataResponse({ userId: savedUser._id }));
    } catch (err) {
        var logInfo = new LogMessage("Auth", "register", "Failed to create user.", { "message": req.body.email })
        logger.info("%o", logInfo)
        res.status(400).json(new ErrorResponse( err.message));
    }
})


router.post("/login", async (req, res) => {

    const { error } = loginValidation(req.body);

    if (error) {
        var logInfo = new LogMessage("Auth", "login", "Input validation failed.", { "error": error.details[0].message })
        logger.info("%o", logInfo)
        return res.status(400).json(new ErrorResponse( error.details[0].message ));
    }
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        var logInfo = new LogMessage("Auth", "login", "Unable to find user.", { "userId": req.body.email })
        logger.info("%o", logInfo)
        return res.status(400).json(new ErrorResponse( "User credentials are invalid"));
    }

    const validPassword = await bcrypt.compare(req.body.password, user.pwd);
    if (!validPassword) {
        var logInfo = new LogMessage("Auth", "login", "Password validation failed.", { "userId": req.body.email })
        logger.info("%o", logInfo)
        return res.status(400).json(new ErrorResponse("User credentials are invalid"));
    }

    var loginIp = getCallerIP(req)

    try {
        const updatedUser = await User.findByIdAndUpdate({ _id: user._id }, { lastLogInLocation: loginIp, lastLogInDate: Date.now() }, { new: true })
        var logInfo = new LogMessage("Auth", "login", "Updated login IP.", { "user": user._id, "ip": loginIp })
        logger.info("%o", logInfo)
    } catch (err) {
        var logInfo = new LogMessage("Auth", "login", "Unable to update login IP", { "user": user._id, "ip": loginIp })
        logger.warn("%o", logInfo)
    }

    // create token
    const token = jwt.sign({
        name: user.email,
        id: user._id
    }, process.env.TOKEN_SECRET, { expiresIn: process.env.EXPIRY_TIME })


    var logInfo = new LogMessage("Auth", "login", "Login successful.", { "name": user.email, "id": user._id, "token": token })
    logger.debug("%o", logInfo)

    res.header("auth-token", token).json(new DataResponse({token}));
});


function getCallerIP(request) {
    var ip = request.headers['x-forwarded-for'] ||
        request.connection.remoteAddress ||
        request.socket.remoteAddress ||
        request.connection.socket.remoteAddress;
    ip = ip.split(',')[0];
    ip = ip.split(':').slice(-1); //in case the ip returned in a format: "::ffff:146.xxx.xxx.xxx"
    if (ip.length > 0) {
        return ip[0];
    } else {
        var logInfo = new LogMessage("Auth", "getCallerIP", "Unable to determine login IP address.")
        logger.warn("%o", logInfo)
        return "No-IP";
    }

}


module.exports = router