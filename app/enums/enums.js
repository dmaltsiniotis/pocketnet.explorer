const Enums = function () {
    return {
        nodestatus: require("./nodestatus.js"),
        tcpprobestatus: require("./tcpprobestatus.js"),
        websocketevent: require("./websocket_event.js"),

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