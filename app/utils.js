/*jslint this*/
const Logger = require("./logger.js");

const Utils = {
    splitAddressAndPort: function (addr) {
        const lastColon = addr.lastIndexOf(":");
        let address = addr;
        let port = null;
        if (lastColon > 0) {
            address = addr.substring(0, lastColon);
            port = addr.substring(lastColon + 1, addr.length);
        }
        return {
            address: address,
            port: port
        }
    }
};
module.exports = Utils;