//const config = require("../config.js");
const Logger = require("./logger.js");
const Enums = require("./enums/enums.js");
const WebSocket = require("ws");

let ws_server = null;
let sockets = [];

const Websocket = {
    start: function (httpServer, callback) {
        if (httpServer) {
            ws_server = new WebSocket.Server({server: httpServer});

            ws_server.on("connection", function (socket) {
                sockets.push(socket);
                Logger.debug(`New web socket connection: ${socket.remoteAddress}`);

                socket.on("close", function () {
                    sockets = sockets.filter((s) => s !== socket);
                });
            });

            if (callback) {
                callback(null, ws_server);
            }
        } else {
            callback("Missing server to use for web sockets.");
        }
    },
    shutdown: function (callback) {
        Logger.debug("Shutdown called");
        if (sockets && sockets.length > 0) {
            sockets.forEach(function (socket) {
                socket.close();
            });
        }
        Logger.debug("Closing server...");
        if (ws_server) {
            ws_server.close(function () {
                callback();
            });
        } else {
            callback();
        }
    },
    emit: function (visibility, channel, event, data, callback) {
        //Logger.debug(`Websocket emit: ${visibility}, ${channel}, ${event}, data: ${JSON.stringify(data)}`);

        if (channel === Enums.WebsocketChannel.Broadcast) {
            sockets.forEach(function (socket) {
                const ws_data = {
                    event: event,
                    data: data
                };
                socket.send(JSON.stringify(ws_data));
            });
        } else {
            Logger.error(`Unknown channel type: ${channel}`);
        }

        if (callback) {
            callback();
        }
    }
};

module.exports = Websocket;