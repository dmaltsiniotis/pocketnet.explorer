//const Config = require("../config.js");
const Logger = require("./logger.js");
const ApiUtils = require("./api_utils.js");
//const http = require("http");
const Websocket = require("./websocket.js");
const Models = require("./models/models.js");
const Enums = require("./enums/enums.js");
const Utils = require("./utils.js");
const RPCApi = require("./rpc_api.js");
const Automation = require("./automation.js");

const api = {
    get: {
        ping: function (ignore, response) {
            ApiUtils.apiOk(response, "PONG");
        },
        nodeinfo: function (request, response) {
            const nodeInfoRequest = RPCApi.genericRPCCall("getnodeinfo");
            RPCApi.proxycmd(request.query.peer, nodeInfoRequest, function (nodeInfoError, nodeInfoData) {
                if (!nodeInfoError) {
                    const nodePeerRequest = RPCApi.genericRPCCall("getpeerinfo");
                    RPCApi.proxycmd(request.query.peer, nodePeerRequest, function (peerInfoError, peerInfoData) {
                        if (!peerInfoError) {
                            const nodeinfoReturnData = {
                                nodeInfo: nodeInfoData,
                                peerInfo: peerInfoData
                            };
                            ApiUtils.apiOk(response, nodeinfoReturnData);
                        } else {
                            ApiUtils.apiError(response, peerInfoError);
                        }
                    });
                } else {
                    ApiUtils.apiError(response, nodeInfoError);
                }
            });
        },
        clearnodes: function (ignore, response) {
            Models.Node.deleteMany({}, function (removeError) {
                Websocket.emit("public", "some channel", "clear_all_nodes", null);
                ApiUtils.apiResponseGeneric(response, removeError, "Cleared all nodes.");
            });
        },
        newnode: function (request, response) {
            if (request.query.ip && request.query.ip !== null) {
                Automation.newNode(request.query.ip, function (newNodeError, newNodeData) {
                    ApiUtils.apiResponseGeneric(response, newNodeError, newNodeData);
                });
            } else {
                ApiUtils.apiError(response, "Missing 'ip' or 'blockchainport' query parameters.");
            }
        },
        refreshnodeinfo: function (request, response) {
            if (request.query.internalNodeId && request.query.internalNodeId !== null) {
                Automation.refreshNodeInfo(request.query.internalNodeId, function (refreshNodeInfoError, refreshNodeInfoData) {
                    ApiUtils.apiResponseGeneric(response, refreshNodeInfoError, refreshNodeInfoData);
                });
            } else {
                ApiUtils.apiError(response, "Missing 'internalNodeId' query parameters.");
            }
        },
        extractnodesfrompeers: function (request, response) {
            if (request.query.internalNodeId && request.query.internalNodeId !== null) {
                Automation.extractNodesFromPeers(request.query.internalNodeId, function (refreshNodeInfoError, refreshNodeInfoData) {
                    ApiUtils.apiResponseGeneric(response, refreshNodeInfoError, refreshNodeInfoData);
                });
            } else {
                ApiUtils.apiError(response, "Missing 'internalNodeId' query parameters.");
            }
        },
        refreshallnodes: function (ignore, response) {
            Automation.refreshAllNodes(function (refreshAllNodeInfoError, refreshAllNodeInfoData) {
                ApiUtils.apiResponseGeneric(response, refreshAllNodeInfoError, refreshAllNodeInfoData);
            });
        },
        extractallnodepeers: function (ignore, response) {
            Automation.extractAllNodePeers(function (extractAllNodePeersError, extractAllNodePeersData) {
                ApiUtils.apiResponseGeneric(response, extractAllNodePeersError, extractAllNodePeersData);
            });
        },
        refreshallnodestatuses: function (ignore, response) {
            Automation.refreshAllNodeStatuses(function (refreshAllNodeStatusesError, refreshAllNodeStatusesData) {
                ApiUtils.apiResponseGeneric(response, refreshAllNodeStatusesError, refreshAllNodeStatusesData);
            });
        },
        getnodes: function (request, response) {
            const query = {};
            if (request.query.all && request.query.all === "true") {
                query.status = {"$in": [Enums.nodestatus.New, Enums.nodestatus.Open, Enums.nodestatus.Hidden, Enums.nodestatus.Dead]};
            } else {
                query.status = {"$in": [Enums.nodestatus.New, Enums.nodestatus.Open, Enums.nodestatus.Hidden]};
            }
            const projection = {
                "_id": true,
                tcp_ipv4_address: true,
                last_updated: true,
                last_seen_as_peer: true,
                status: true,
                label: true,
                node_info: true,
                "peer_info._id": true,
                "peer_info.addr": true,
                "peer_info.subver": true,
                "peer_info.inbound": true,
                "peer_info.addnode": true
            };
            Models.Node.find(query, projection, {lean: true}, function (findNodesError, findNodesData) {
                findNodesData.forEach(function (node) {
                    if (!node.node_info.version || node.node_info.version === "") {
                        node.node_info.version = "Unkown";
                    }
                    node.peer_count = 0;
                    if (node && node.peer_info && node.peer_info.length > 0) {
                        node.peer_count = node.peer_info.length;
                        node.peer_info.forEach(function (peer) {
                            if (peer.subver) {
                                const verinfo = peer.subver.split(":");
                                if (verinfo[1]) {
                                    verinfo[1] = verinfo[1].replace("/", "");
                                }
                                peer.version = verinfo[1] || peer.subver;
                            } else if (peer.version) {
                                peer.version = "Unknown";
                            }

                            const addrinfo =  Utils.splitAddressAndPort(peer.addr);
                            peer.tcp_ipv4_address = addrinfo.address;
                            peer.tcp_port_blockhain = addrinfo.port || 37070;

                            delete peer.addr;
                            delete peer.subver;
                        });
                    }
                });
                ApiUtils.apiResponseGeneric(response, findNodesError, findNodesData);
            });
        }
    },
    post: {
        proxycmd: function (request, response) {
            RPCApi.proxycmd(request.query.peer, request.body, function (error, data) {
                ApiUtils.apiResponseGeneric(response, error, data);
            });
        },
        newnodes: function (request, response) {
            if (request.body.ips && request.body.ips !== null) {
                Automation.newNodes(request.body.ips, function (newNodeError, newNodeData) {
                    ApiUtils.apiResponseGeneric(response, newNodeError, newNodeData);
                });
            } else {
                ApiUtils.apiError(response, "Missing 'ip' or 'blockchainport' query parameters.");
            }
        }
    }
};

module.exports = api;