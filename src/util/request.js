const {LogMessage, logger} = require("../config/winston");

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
        var logInfo = new LogMessage("RequestUtil", "getCallerIP", "Unable to determine login IP address.")
        logger.warn("%o", logInfo)
        return "No-IP";
    }
}

module.exports = { getCallerIP }