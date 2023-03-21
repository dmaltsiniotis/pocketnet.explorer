const NodeStatus = function () {
    return {
        Unknown: "unknown",
        Open: "open",
        Closed: "closed",
        Timeout: "timeout",
        Error: "error"
    };
};

module.exports = NodeStatus();