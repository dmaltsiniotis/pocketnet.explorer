
const Consts = {
    DefaultNodeDataProjection: {
        "_id": true,
        tcp_ipv4_address: true,
        last_updated: true,
        last_seen_as_peer: true,
        status: true,
        label: true,
        status_port_blockhain: true,
        status_port_publicrpc: true,
        status_port_websocket: true,
        node_info: true,
        "peer_info._id": true,
        "peer_info.addr": true,
        "peer_info.subver": true,
        "peer_info.inbound": true,
        "peer_info.addnode": true,
        block_info: true
    }
};

module.exports = Consts;