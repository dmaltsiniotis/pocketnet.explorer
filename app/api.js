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
                            const nodeBlockRequest = RPCApi.genericRPCCall("getlastblocks", [10, -1, false]);
                            RPCApi.proxycmd(request.query.peer, nodeBlockRequest, function (blockInfoError, blockInfoData) {
                                if (!blockInfoError) {
                                    const nodeinfoReturnData = {
                                        nodeInfo: nodeInfoData,
                                        peerInfo: peerInfoData,
                                        blockInfo: blockInfoData
                                    };
                                    ApiUtils.apiOk(response, nodeinfoReturnData);
                                } else {
                                    ApiUtils.apiError(response, blockInfoError);
                                }
                            });
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
        refreshallnodes: function (request, response) {
            const forceall = (request.query.forceall !== undefined);
            Automation.refreshAllNodes(function (refreshAllNodeInfoError, refreshAllNodeInfoData) {
                ApiUtils.apiResponseGeneric(response, refreshAllNodeInfoError, refreshAllNodeInfoData);
            }, forceall);
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
            };
            Models.Node.find(query, projection, {lean: true}, function (findNodesError, findNodesData) {
                findNodesData.forEach(function (node) {
                    if (!node.node_info.version || node.node_info.version === "") {
                        node.node_info.version = "Unknown";
                    }
                    node.peer_count = 0;
                    if (node && node.peer_info && node.peer_info.length > 0) {
                        node.peer_count = node.peer_info.length;
                        node.peer_info.forEach(function (peer) {
                            if (peer.subver) {
                                peer.version = Utils.parseVersion(peer.subver);
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
        },
        getactivenodes: function (request, response) {
            const query = {
                "$and": [
                    {
                        status_port_publicrpc: "open"
                    },
                    {
                        status: {
                            "$in": [
                                Enums.nodestatus.Open,
                                Enums.nodestatus.Hidden
                            ]
                        }
                    }
                ]
            };

            const projection = {
                "_id": true,
                tcp_ipv4_address: true,
                tcp_port_publicrpc: true,
                label: true,
                'node_info.version': true
            };

            Models.Node.find(query, projection, {lean: true}, function (findNodesError, findNodesData) {
                ApiUtils.apiResponseGeneric(response, findNodesError, findNodesData);
            });
        },
        searchbyhash: function (request, response) {
            if (request.query.peer && request.query.searchparam) {
                const searchbyhashRequest = RPCApi.genericRPCCall("searchbyhash", {value: request.query.searchparam});
                RPCApi.proxycmd(request.query.peer, searchbyhashRequest, function (searchbyhashError, searchbyhashResponse) {
                    ApiUtils.apiResponseGeneric(response, searchbyhashError, searchbyhashResponse);
                });
            } else {
                ApiUtils.apiError(response, "Missing 'searchparam' parameter.");
            }
        },
        getlastblocks: function (request, response) {
            ApiUtils.apiError(response, "Not yet implemented");
        },
        getblocktransactions: function (request, response) {
            ApiUtils.apiError(response, "Not yet implemented");
        },
        getaddresstransactions: function (request, response) {
            ApiUtils.apiError(response, "Not yet implemented");
        },
        search: function (request, response) {
            Logger.debug(request.query);
            if (request.query.peer && request.query.hash) {
                const searchbyhashRequest = RPCApi.genericRPCCall("searchbyhash", {value: request.query.hash});
                RPCApi.proxycmd(request.query.peer, searchbyhashRequest, function (searchbyhashError, searchbyhashResponse) {
                    if (!searchbyhashError) {
                        Logger.debug(searchbyhashResponse);
                        if (searchbyhashResponse.type === Enums.hashtype.Block) {
                            const searchByBlockHashCmd = RPCApi.genericRPCCall("searchbyhash", {value: request.query.hash});
                        } else if (searchbyhashResponse.type === Enums.hashtype.Transaction) {
                            const searchByTransactionHashCmd = RPCApi.genericRPCCall("gettransactions", {transactions: request.query.hash});
                        } else if (searchbyhashResponse.type === Enums.hashtype.Address) {
                            const searchByAddressHashCmd = RPCApi.genericRPCCall("getaddresstransactions", {address: request.query.hash});
                        } else {
                            // Unknown type...
                            ApiUtils.apiError(response, `I'm not sure how to handle a hash type of "${searchbyhashResponse.type}" yet. `);
                        }
                        ApiUtils.apiError(response, "Not yet implemented");
                    } else {
                        ApiUtils.apiError(response, searchbyhashError);
                    }
                });
            } else {
                ApiUtils.apiError(response, "Missing 'peer' or 'hash' parameter.");
            }
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