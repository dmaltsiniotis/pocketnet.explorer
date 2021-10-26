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
    },
    parseVersion: function (satoshiversion) {
        if (satoshiversion) {
            const verinfo = satoshiversion.split(":");
            if (verinfo[1]) {
                verinfo[1] = verinfo[1].replace("/", "");
            }
            return verinfo[1] || satoshiversion;
        } else {
            return satoshiversion;
        }
    }
};
module.exports = Utils;