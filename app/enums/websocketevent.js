const WebsocketEvent = function () {
    return {
        NewNode: "new_node",
        NodeSeenAsPeer: "node_seen_as_peer",
        NodeUpdated: "node_updated",
        NodeStatusChanged: "node_status_changed",
        AllNodesCleared: "all_nodes_cleared",
        NodeInfoUpdated: "node_info_updated",
        NodePeerInfoUpdated: "node_peer_info_updated",
        NodeBlockInfoUpdated: "node_block_info_updated",
        NodeStatusUpdated: "node_status_updated"
    };
};

module.exports = WebsocketEvent();