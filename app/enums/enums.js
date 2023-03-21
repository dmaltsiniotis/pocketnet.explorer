const Enums = function () {
    return {
        nodestatus: require("./nodestatus.js"),
        tcpprobestatus: require("./tcpprobestatus.js"),
        hashtype: require("./hashtype.js"),
        WebsocketEvent: require("./websocketevent.js"),
        WebsocketVisibility: require("./websocketvisibility.js"),
        WebsocketChannel: require("./websocketchannel.js"),

        returnEnumValuesAsArray: function(enumObject) {
            let retVal = [];
            if (enumObject !== undefined && enumObject !== null) {
                Object.keys(enumObject).forEach(function(key) {
                    retVal.push(enumObject[key]);
                });
            }
            return retVal;
        }
    };
};

module.exports = Enums();