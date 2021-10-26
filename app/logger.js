const config = require("../config.js");

const LOGLEVEL = {
    NONE: 0,
    ERROR: 1,
    WARNING: 2,
    INFO: 3,
    DEBUG: 4
};

// https://stackoverflow.com/questions/4816099/chrome-sendrequest-error-typeerror-converting-circular-structure-to-json
function censor(censor) {
    var i = 0;
    return function (ignore, value) {
        if (i !== 0 && typeof(censor) === "object" && typeof(value) === "object" && censor === value) {
            return "[Circular]";
        }
        if (i >= 29) {// seems to be a harded maximum of 30 serialized objects?
            return "[Unknown]";
        }
        i = i + 1; // so we know we aren't using the original object anymore
        return value;
    };
}

function getLogLevelName(log_level) {
    const logLevelKeys = Object.keys(LOGLEVEL);
    var returnLogLevelName = "UNKNOWN";
    logLevelKeys.forEach(function (logLevelKey) {
        const logLevelName = logLevelKey;
        if (LOGLEVEL[logLevelName] === log_level) {
            returnLogLevelName = logLevelName;
        }
    });
    return returnLogLevelName;
}

function getLogDateTimeStamp() {
    const now = new Date();
    //return now.toLocaleString();
    return `${now.getFullYear()}-${now.getMonth().toString().padStart(2, "0")}-${now.getDay().toString().padStart(2, "0")} ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}.${now.getMilliseconds().toString().padStart(3, "0")}`;
}

function log(message, log_level) {
    if (config.app.log_level >= log_level) {
        if (typeof message === "object") {
            message = "\n" + JSON.stringify(message, censor(message), 4);
        }
        console.log(`${getLogLevelName(log_level)}: ${getLogDateTimeStamp()}: ${message}`);
    }
}

const logger = function () {
    return {
        debug: function (message) {
            log(message, LOGLEVEL.DEBUG);
        },
        info: function (message) {
            log(message, LOGLEVEL.INFO);
        },
        warn: function (message) {
            log(message, LOGLEVEL.WARNING);
        },
        error: function (message) {
            log(message, LOGLEVEL.ERROR);
        }
    };
};


module.exports = logger();