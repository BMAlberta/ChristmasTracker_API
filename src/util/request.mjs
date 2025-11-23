import { LogMessage, logger } from '../config/winston.mjs';

function getCallerIP(request) {
    let ip = request.headers['x-forwarded-for'] ||
        request.connection.remoteAddress ||
        request.socket.remoteAddress ||
        request.connection.socket.remoteAddress;
    ip = ip.split(',')[0];
    ip = ip.split(':').slice(-1); //in case the ip returned in a format: "::ffff:146.xxx.xxx.xxx"
    if (ip.length > 0) {
        return ip[0];
    } else {
        const logInfo = new LogMessage("RequestUtil", "getCallerIP", "Unable to determine login IP address.");
        logger.warn("%o", logInfo)
        return "No-IP";
    }
}

function checkAppVersion(request) {
    const deviceAppVersion = request.headers['av']
    const minimumAllowedVersion = process.env.MINIMUM_AV
    if (deviceAppVersion == null) {
        return false
    }
    return deviceAppVersion >= minimumAllowedVersion
}

export default { getCallerIP, checkAppVersion };