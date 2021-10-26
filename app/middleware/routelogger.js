const logger = require("../logger.js");

const routeLogger = function() {
    return function (request, ignore, next) {
        let hostname = request.hostname;
        if (request.headers["x-forwarded-for"]) {
            hostname = request.headers["x-forwarded-for"];
        }
        logger.info("Incoming request from " + hostname + ": " + request.method + " " + request.originalUrl);
        next();
    }
};

module.exports = routeLogger