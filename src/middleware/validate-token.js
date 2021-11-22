const jwt = require("jsonwebtoken");
const { logger, LogMessage } = require('../config/winston');

const verifyToken = (req, res, next) => {
    if (process.env.AUTH_TYPE == "TOKEN") {
        const token = req.header("auth-token");

        if (!token) {
            logger.info("%o", new LogMessage("Validate Token", "verifyToken", "No token provided."))
            return res.status(400).json({ error: "Missing authentication" });
        }
        try {
            const verified = jwt.verify(token, process.env.TOKEN_SECRET);
            req.user = verified;
            logger.info("%o", new LogMessage("Validate Token", "verifyToken", "Token validated.", { "tokenInfo": token }) )
            next();
        } catch (err) {
            logger.info("%o", new LogMessage("Validate Token", "verifyToken", "Token validation failed.", { "tokenInfo": token, "error": err.message }))
            res.status(401).json({ error: "Unauthorized" });
        }
    }
    else {
        logger.info("%o", new LogMessage("Validate Token", "verifyToken", "No token provided."))
        next()
    }
};


function getUser(req, res, next) {
    const token = req.header("auth-token");
    var decoded = jwt.decode(token, { complete: true });
    const user = decoded.payload.id

    if (user != null) {
        res.id = user
        next()
    } else {
        logger.info("%o", new LogMessage("Validate Token", "getUser", "Unable to locate user.", { "userInfo": user } ))
        return res.status(500).json({ message: "Unable to find a user" })
    }
}
module.exports = { verifyToken, getUser };
