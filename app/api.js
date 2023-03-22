//const Config = require("../config.js");
//const Logger = require("./logger.js");
const ApiUtils = require("./api_utils.js");
//const http = require("http");
const Websocket = require("./websocket.js");
const Models = require("./models/models.js");
const Enums = require("./enums/enums.js");
const Consts = require("./consts.js");
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
                Websocket.emit(Enums.WebsocketVisibility.Public, Enums.WebsocketChannel.Broadcast, Enums.WebsocketEvent.AllNodesCleared, {});
                ApiUtils.apiResponseGeneric(response, removeError, "Cleared all nodes.");
            });
        },
        newnode: function (request, response) {
            if (request.query.ip && request.query.ip !== null) {
                Automation.newNode(request.query.ip, function (newNodeError, newNodeData) {
                    ApiUtils.apiResponseGeneric(response, newNodeError, newNodeData);
                });
            } else {
                ApiUtils.apiError(response, "Missing 'ip' query parameters.");
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

            Models.Node.find(query, Consts.DefaultNodeDataProjection, {lean: true}, function (findNodesError, findNodesData) {
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

                            const addrinfo = Utils.splitAddressAndPort(peer.addr);
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
        getcompactnodelist: function (ignore, response) {
            const query = {};
            query.status = {"$in": [Enums.nodestatus.New, Enums.nodestatus.Open, Enums.nodestatus.Hidden]};

            Models.Node.find(query, Consts.CompactNodeDataProjection, {lean: true}, function (findNodesError, findNodesData) {
                if (!findNodesError && findNodesData) {
                    findNodesData.forEach(function (node) {
                        if (!node.node_info.version || node.node_info.version === "") {
                            node.node_info.version = "Unknown";
                        }
                    });
                }
                ApiUtils.apiResponseGeneric(response, findNodesError, findNodesData);
            });
        },
        getactivenodes: function (ignore, response) {
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
                "node_info.version": true,
                "node_info.lastblock.height": true
            };

            Models.Node.find(query, projection, {lean: true}, function (findNodesError, findNodesData) {
                ApiUtils.apiResponseGeneric(response, findNodesError, findNodesData);
            });
        },
        searchbyhash: function (request, response) {
            if (request.query.peer && request.query.hash) {
                const searchbyhashRequest = RPCApi.genericRPCCall("searchbyhash", [request.query.hash]);
                RPCApi.proxycmd(request.query.peer, searchbyhashRequest, function (searchbyhashError, searchbyhashResponse) {
                    ApiUtils.apiResponseGeneric(response, searchbyhashError, searchbyhashResponse);
                });
            } else {
                ApiUtils.apiError(response, "Missing 'searchparam' parameter.");
            }
        },
        getlastblocks: function (request, response) {
            let count = request.query.count || 10;
            count = Number(count);

            let last_height = request.query.last_height || -1;
            last_height = Number(last_height);

            let verbose = request.query.verbose || "false";
            verbose = (verbose.toLowerCase() === "true");

            const getLastBlocksCmd = RPCApi.genericRPCCall("getlastblocks", [count, last_height, verbose]);
            RPCApi.proxycmd(request.query.peer, getLastBlocksCmd, function (getLastBlocksError, getLastBlocksResponse) {
                ApiUtils.apiResponseGeneric(response, getLastBlocksError, getLastBlocksResponse);
            });
        },
        getcompactblock: function (request, response) {
            const getCompactBlockCmd = RPCApi.genericRPCCall("getcompactblock", [request.query.hash, request.query.number || -1]);
            RPCApi.proxycmd(request.query.peer, getCompactBlockCmd, function (getCompactBlockError, getCompactBlockResponse) {
                ApiUtils.apiResponseGeneric(response, getCompactBlockError, getCompactBlockResponse);
            });
        },
        getblocktransactions: function (request, response) {
            let blockhash = request.query.hash;

            let pageStart = request.query.pageStart || 0;
            pageStart = Number(pageStart);

            let pageSize = request.query.pageSize || 10;
            pageSize = Number(pageSize);

            const getBlockTransactionsCmd = RPCApi.genericRPCCall("getblocktransactions", [blockhash, pageStart, pageSize]);
            RPCApi.proxycmd(request.query.peer, getBlockTransactionsCmd, function (getBlockTransactionsError, getBlockTransactionsResponse) {
                ApiUtils.apiResponseGeneric(response, getBlockTransactionsError, getBlockTransactionsResponse);
            });
        },
        gettransactions: function (request, response) {
            const getTransactionsCmd = RPCApi.genericRPCCall("gettransactions", {transactions: request.query.hash});
            RPCApi.proxycmd(request.query.peer, getTransactionsCmd, function (getTransactionsError, getTransactionsResponse) {
                ApiUtils.apiResponseGeneric(response, getTransactionsError, getTransactionsResponse);
            });
        },
        getaddressinfo: function (request, response) {
            const getAddressTransactionsCmd = RPCApi.genericRPCCall("getaddressinfo", {address: request.query.hash});
            RPCApi.proxycmd(request.query.peer, getAddressTransactionsCmd, function (getAddressInfoError, getAddressInfoResponse) {
                ApiUtils.apiResponseGeneric(response, getAddressInfoError, getAddressInfoResponse);
            });
        },
        getaddresstransactions: function (request, response) {
            let address = request.query.hash;

            let pageInitBlock = request.query.pageInitBlock || null;
            if (pageInitBlock) {
                pageInitBlock = Number(pageInitBlock);
            }

            let pageStart = request.query.pageStart || 0;
            pageStart = Number(pageStart);

            let pageSize = request.query.pageSize || 10;
            pageSize = Number(pageSize);

            const getAddressTransactionsCmd = RPCApi.genericRPCCall("getaddresstransactions", [address, pageInitBlock, pageStart, pageSize]);
            RPCApi.proxycmd(request.query.peer, getAddressTransactionsCmd, function (getAddressTransactionsError, getAddressTransactionsResponse) {
                ApiUtils.apiResponseGeneric(response, getAddressTransactionsError, getAddressTransactionsResponse);
            });
        }
    },
    post: {
        // proxycmd: function (request, response) {
        //     RPCApi.proxycmd(request.query.peer, request.body, function (error, data) {
        //         ApiUtils.apiResponseGeneric(response, error, data);
        //     });
        // },
        newnodes: function (request, response) {
            if (request.body.ips && request.body.ips !== null) {
                Automation.newNodes(request.body.ips, function (newNodeError, newNodeData) {
                    ApiUtils.apiResponseGeneric(response, newNodeError, newNodeData);
                });
            } else {
                ApiUtils.apiError(response, "Missing 'ip' query parameter.");
            }
        }
    }
};

module.exports = api;