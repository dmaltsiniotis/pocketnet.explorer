const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const baseSchema = require("./base_schema.js");
//const enums = require("../enums/enums.js");

const nodePeerSchema = new Schema(Object.assign({
    token: {type: String, required: true},
    questionid: {type: Schema.Types.ObjectId, required: true},
    pollid: {type: Schema.Types.ObjectId, required: true},
    remoteaddress: {type: String, required: true}
    // peers:
    // [
    //     {
    //         "id": 135,
    //         "addr": "74.208.128.141:37070",
    //         "addrlocal": "20.94.169.122:37782",
    //         "addrbind": "10.11.1.4:37782",
    //         "services": "000000000000040d",
    //         "relaytxes": true,
    //         "lastsend": 1635464198,
    //         "lastrecv": 1635464196,
    //         "bytessent": 39069072,
    //         "bytesrecv": 108717614,
    //         "conntime": 1635373238,
    //         "timeoffset": -15,
    //         "pingtime": 0.045312,
    //         "minping": 0.043615,
    //         "version": 70015,
    //         "subver": "/Satoshi:0.19.17/",
    //         "inbound": false,
    //         "addnode": false,
    //         "startingheight": 1414042,
    //         "banscore": 0,
    //         "synced_headers": 1415533,
    //         "synced_blocks": 1415533,
    //         "inflight": [],
    //         "whitelisted": false,
    //         "minfeefilter": 0.00001000,
    //         "bytessent_per_msg": {
    //             "addr": 385,
    //             "block": 29144093,
    //             "blocktxn": 453055,
    //             "cmpctblock": 537357,
    //             "feefilter": 32,
    //             "getaddr": 24,
    //             "getblocktxn": 3897,
    //             "getdata": 396993,
    //             "getheaders": 1085,
    //             "headers": 95800,
    //             "inv": 2207453,
    //             "notfound": 8625,
    //             "ping": 24000,
    //             "pong": 24064,
    //             "sendcmpct": 3003,
    //             "sendheaders": 24,
    //             "tx": 6169031,
    //             "verack": 24,
    //             "version": 127
    //         },
    //         "bytesrecv_per_msg": {
    //             "addr": 2765,
    //             "block": 100931079,
    //             "blocktxn": 818283,
    //             "cmpctblock": 891427,
    //             "feefilter": 32,
    //             "getblocktxn": 1515,
    //             "getdata": 273426,
    //             "getheaders": 1085,
    //             "headers": 91598,
    //             "inv": 1040670,
    //             "notfound": 7325,
    //             "ping": 24064,
    //             "pong": 24000,
    //             "sendcmpct": 1683,
    //             "sendheaders": 24,
    //             "tx": 4608487,
    //             "verack": 24,
    //             "version": 127
    //         }
    //     }
    // ]
}, baseSchema));

//nodePeerSchema.index({ token: 1, pollid: 1 }, { unique: true })

module.exports = mongoose.model("response", nodePeerSchema);