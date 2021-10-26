//const Config = require("../config.js");
//const Logger = require("./logger.js");
//const Http = require("http");

const Websocket = {
    emit: function (visibility, channel, event, data, callback) {
        //Logger.debug(`Websocket emit called: ${visibility}, ${channel}, ${event}, ${data}`);
        if (callback) {
            callback();
        }
    }
};

module.exports = Websocket;