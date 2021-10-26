const expressmiddleware = function () {
    return {
        routelogger: require("./routelogger.js")
    };
};
module.exports = expressmiddleware();