const Mongoose = require("mongoose");
const Schema = Mongoose.Schema;
const baseSchema = require("./base_schema.js");
const Enums = require("../enums/enums.js");

const nodeSchema = new Schema(Object.assign({
    status: {type: String, required: true, default: Enums.nodestatus.New, enum: Enums.returnEnumValuesAsArray(Enums.nodestatus)},
    label: {type: String, required: false, default: null}, // This should be fun. An anonymous? user-defined text label for a node.
    added_manually: {type: Boolean, required: false, default: false},
    last_updated: {type: Date, required: false, default: null},
    //next_update: {type: Date, required: false, default: null},
    do_not_poll: {type: Boolean, required: false, default: false},
    do_not_poll_reason: {type: String, required: false, default: ""},
    tcp_ipv4_address: {type: String, required: true},
    tcp_ipv6_address: {type: String, required: false, default: null},
    tcp_port_blockhain: {type: String, required: false, default: "37070"}, // This will be given to us by the peer list info.
    tcp_port_publicrpc: {type: String, required: false, default: "38081"}, // This is unknowable at this time. Just going to try the default.
    tcp_port_websocket: {type: String, required: false, default: "8087"}, // This is unknowable at this time. Just going to try the default.
    //last_seen_alive: {type: Date, required: false, default: null},
    last_queried_ports: {type: Date, required: false, default: null},
    last_queried_info: {type: Date, required: false, default: null},
    last_queried_peers: {type: Date, required: false, default: null},
    last_queried_block: {type: Date, required: false, default: null},
    last_seen_as_peer: {type: Date, required: false, default: null},
    status_port_blockhain: {type: String, required: false, default: Enums.tcpprobestatus.Unknown, enum: Enums.returnEnumValuesAsArray(Enums.tcpprobestatus)},
    status_port_publicrpc: {type: String, required: false, default: Enums.tcpprobestatus.Unknown, enum: Enums.returnEnumValuesAsArray(Enums.tcpprobestatus)},
    status_port_websocket: {type: String, required: false, default: Enums.tcpprobestatus.Unknown, enum: Enums.returnEnumValuesAsArray(Enums.tcpprobestatus)},
    latency_port_blockhain: {type: Number, required: false, default: 0},
    latency_port_publicrpc: {type: Number, required: false, default: 0},
    latency_port_websocket: {type: Number, required: false, default: 0},
    node_info_status: {type: String, required: false, default: null},
    node_info: {
        version: {type: String, default: ""},
        time: {type: Number, default: 0},
        chain: {type: String, default: ""},
        netstakeweight: {type: Number, default: 0},
        lastblock: {
            height: {type: Number, default: 0},
            hash: {type: String, default: ""},
            time: {type: Number, default: 0},
            ntx: {type: Number, default: 0}
        }
    },
    peer_info_status: {type: String, required: false, default: null},
    peer_info: [{
        id: {type: Number},
        addr: {type: String},
        addrlocal: {type: String},
        addrbind: {type: String},
        services: {type: String}, // Change to Buffer or Number? This appears to be a bytemask.
        relaytxes: {type: Boolean},
        lastsend: {type: Number},
        lastrecv: {type: Number},
        bytessent: {type: Number},
        bytesrecv: {type: Number},
        conntime: {type: Number},
        timeoffset: {type: Number},
        pingtime: {type: Number}, // Change to Decimal128 ?
        minping: {type: Number}, // Change to Decimal128 ?
        protocol: {type: Number}, // Added in 0.20.x.
        version: {type: String}, // Added in 0.20.x. This was changed from Number to String, using this field instead of the subver field in the new version.
        subver: {type: String},
        inbound: {type: Boolean},
        addnode: {type: Boolean},
        startingheight: {type: Number},
        banscore: {type: Number},
        synced_headers: {type: Number},
        synced_blocks: {type: Number},
        inflight: [{type: Number}],
        whitelisted: {type: Boolean},
        minfeefilter: {type: Number}, // Change to Decimal128 ?
        bytessent_per_msg: {
            addr: {type: Number},
            block: {type: Number},
            blocktxn: {type: Number},
            cmpctblock: {type: Number},
            feefilter: {type: Number},
            getaddr: {type: Number},
            getblocktxn: {type: Number},
            getdata: {type: Number},
            getheaders: {type: Number},
            headers: {type: Number},
            inv: {type: Number},
            notfound: {type: Number},
            ping: {type: Number},
            pong: {type: Number},
            sendcmpct: {type: Number},
            sendheaders: {type: Number},
            tx: {type: Number},
            verack: {type: Number},
            version: {type: Number}
        },
        bytesrecv_per_msg: {
            addr: {type: Number},
            block: {type: Number},
            blocktxn: {type: Number},
            cmpctblock: {type: Number},
            feefilter: {type: Number},
            getblocktxn: {type: Number},
            getdata: {type: Number},
            getheaders: {type: Number},
            headers: {type: Number},
            inv: {type: Number},
            notfound: {type: Number},
            ping: {type: Number},
            pong: {type: Number},
            sendcmpct: {type: Number},
            sendheaders: {type: Number},
            tx: {type: Number},
            verack: {type: Number},
            version: {type: Number}
        }
    }],
    block_info_status: {type: String, required: false, default: null},
    block_info: [{
        height: {type: Number},
        hash: {type: String},
        time: {type: Date},
        ntx: {type: Number}
    }]
}, baseSchema));

nodeSchema.index({tcp_ipv4_address: 1}, {unique: true});

nodeSchema.virtual("addr").get(function () {
    return this.tcp_ipv4_address + ":" + this.tcp_port_blockhain;
});

nodeSchema.virtual("rpcaddr").get(function () {
    return this.tcp_ipv4_address + ":" + this.tcp_port_publicrpc;
});

const nodeModel = Mongoose.model("node", nodeSchema);

module.exports = nodeModel;