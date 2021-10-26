const WebsocketEvent = function () {
    return {
        NewNode: "new_node",
        NodeSeenAsPeer: "node_seen_as_peer"
    };
};

module.exports = WebsocketEvent();