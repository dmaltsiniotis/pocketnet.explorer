const Config = require("../config.js");
const Logger = require("./logger.js");
const Websocket = require("./websocket.js");
const Models = require("./models/models.js");
const Enums = require("./enums/enums.js");
const RPCApi = require("./rpc_api.js");
const Net = require("net");
const Async = require("async");

function _addNewNode(newNode, callback) {
    // TODO: Filter out local networks from public peers. Or maybe mark them as private to skip info gathering later.
    /*
    RFC 1918 name               IP address range    Number of addresses    Largest CIDR block (subnet mask) Host ID size   Mask bits    Classful description
    24-bit block       10.0.0.0 – 10.255.255.255    16777216               10.0.0.0/8 (255.0.0.0)             24 bits      8 bits       single class A network
    20-bit block     172.16.0.0 – 172.31.255.255    1048576                172.16.0.0/12 (255.240.0.0)        20 bits      12 bits      16 contiguous class B networks
    16-bit block    192.168.0.0 – 192.168.255.255   65536                  192.168.0.0/16 (255.255.0.0)       16 bits      16 bits      256 contiguous class C networks
    */
    if (newNode && newNode.tcp_ipv4_address && newNode.tcp_ipv4_address !== null) {
        //Logger.debug(`_addNewNode: Adding peer node ${newNode.tcp_ipv4_address}...`);
        Models.Node.findOne({tcp_ipv4_address: newNode.tcp_ipv4_address}, function (findNodeError, findNodeData) {
            if (!findNodeError) {
                if (findNodeData) {
                    Websocket.emit("public", "some channel", Enums.websocketevent.NodeSeenAsPeer, findNodeData.tcp_ipv4_address);
                    //Logger.debug(`_addNewNode: Updating last seen on node ${findNodeData.addr.toString()}.`); // This is too verbose.
                    if (newNode.last_seen_as_peer !== undefined) {
                        findNodeData.last_seen_as_peer = Date.now();
                        findNodeData.save(function (saveError) {
                            callback(saveError);
                        });
                    } else {
                        callback();
                    }
                } else {
                    Logger.debug(`_addNewNode: Creating new node ${newNode.tcp_ipv4_address.toString()}.`);
                    Models.Node.create(newNode, function (createNodeError, createNodeData) {
                        if (!createNodeError) {
                            Websocket.emit("public", "some channel", Enums.websocketevent.NewNode, createNodeData.tcp_ipv4_address);
                        } else {
                            Logger.error("_addNewNode: Create Error. Trying to create new node in mongodb. The error:");
                            Logger.error(createNodeError);
                            Logger.error("_addNewNode: The model: ");
                            Logger.error(newNode);

                            // Check if this was a unique index constraint error because the node already exists
                            //  and _addNewNode was called in parallel by the callee...
                            // if (createNodeError && createNodeError.code && createNodeError.code === 11000) {
                            //     Websocket.emit("public", "some channel", Enums.websocketevent.NodeSeenAsPeer, findNodeData.tcp_ipv4_address);
                            // }
                        }
                        callback(createNodeError);
                    });
                }
            } else {
                callback(findNodeError);
            }
        });

    } else {
        callback("Missing newNode or newNode.tcp_ipv4_address is not set.");
    }
}

function _probeTcpPort(host, port, callback) {
    const callbackResult = {
        status: Enums.tcpprobestatus.Unknown,
        latency_in_milliseconds: 0,
        error: null
    };
    const connectionOption = {
        host: host,
        port: port,
        timeout: Config.timing.tcp_probe_timeout
    };

    Logger.debug(`_probeTcpPort: Connecting to: ${connectionOption.host}:${connectionOption.port} timeout ${connectionOption.timeout}...`);
    const startProcessTime = process.hrtime();
    const clientSocket = Net.createConnection(connectionOption, function () {
        const elapsedMs = process.hrtime(startProcessTime)[1] / 1000000; // nanoseconds to milliseconds
        const elapsedMsString = `${process.hrtime(startProcessTime)[0]}s, ${elapsedMs.toFixed(3)}ms`;

        Logger.debug(`_probeTcpPort: Connected to: ${host}:${port} in ${elapsedMsString}. Disconnecting...`);
        // clientSocket.end(function () {
        //     //Logger.debug(`_probeTcpPort: Disconnected from ${host}:${port}.`);
        //     //clientSocket.destroy();
        // });
        callbackResult.status = Enums.tcpprobestatus.Open;
        callbackResult.latency_in_milliseconds = elapsedMs;
        clientSocket.destroy(); // Clean this socket up now, don't let half open connections linger?
        callback(null, callbackResult);
    }).on("timeout", function () {
        Logger.debug(`_probeTcpPort: Timeout connecting to: ${connectionOption.host}:${connectionOption.port}.`);
        callbackResult.status = Enums.tcpprobestatus.Timeout;
        callbackResult.latency_in_milliseconds = 0;
        clientSocket.destroy(); // Clean this socket up now, don't let half open connections linger?
        callback(null, callbackResult);
    }).on("error", function (error) {
        Logger.debug(`_probeTcpPort: Error connecting to: ${host}:${port}: ${(error.code || "")}`);
        //Logger.debug(error);
        if (error && error.code) {
            switch (error.code) {
            case "ETIMEDOUT":
                callbackResult.status = Enums.tcpprobestatus.Timeout;
                break;
            case "ECONNREFUSED":
                callbackResult.status = Enums.tcpprobestatus.Closed;
                break;
            default:
                callbackResult.status = Enums.tcpprobestatus.Error;
            }
        }
        callbackResult.latency_in_milliseconds = 0;
        callbackResult.error = error; // This is ignored.
        clientSocket.destroy(); // Clean this socket up now, don't let half open connections linger?
        callback(null, callbackResult);
    }).on("end", function () {
        Logger.debug(`_probeTcpPort: Disconnected from ${host}:${port}.`);
        clientSocket.destroy(); // Clean this socket up now, don't let half open connections linger?
    });
}

function _probeNodeTcpPortsAndUpdateStatus(node, callback) {
    Logger.debug(`_probeNodeTcpPortsAndUpdateStatus: Probing TCP ports for node: ${node.tcp_ipv4_address}`);
    if (node) {
        node.last_queried_ports = Date.now();
        Async.series([
            function (blockChainCallback) {
                _probeTcpPort(node.tcp_ipv4_address, node.tcp_port_blockhain, function (probeBlockChainTcpPortError, probeBlockChainTcpPortResult) {
                    if (!probeBlockChainTcpPortError) {
                        node.status_port_blockhain = probeBlockChainTcpPortResult.status;
                        node.latency_port_blockhain = probeBlockChainTcpPortResult.latency_in_milliseconds;
                    } else {
                        Logger.error(probeBlockChainTcpPortError);
                    }
                    blockChainCallback();
                });
            },
            function (rpcCallback) {
                _probeTcpPort(node.tcp_ipv4_address, node.tcp_port_publicrpc, function (probeRpcTcpPortError, probeRpcTcpPortResult) {
                    if (!probeRpcTcpPortError) {
                        node.status_port_publicrpc = probeRpcTcpPortResult.status;
                        node.latency_port_publicrpc = probeRpcTcpPortResult.latency_in_milliseconds;
                    } else {
                        Logger.error(probeRpcTcpPortError);
                    }
                    rpcCallback();
                });
            },
            function (websocketCallback) {
                _probeTcpPort(node.tcp_ipv4_address, node.tcp_port_websocket, function (probeWebSocketTcpPortError, probeWebSocketTcpPortResult) {
                    if (!probeWebSocketTcpPortError) {
                        node.status_port_websocket = probeWebSocketTcpPortResult.status;
                        node.latency_port_websocket = probeWebSocketTcpPortResult.latency_in_milliseconds;
                    } else {
                        Logger.error(probeWebSocketTcpPortError);
                    }
                    websocketCallback();
                });
            }
        ], function (probingError, ignore) {
            if (probingError) {
                Logger.error(probingError);
            }
            // if (probingResult) {
            //     Logger.debug(probingResult)
            // }
            Logger.debug(`_probeNodeTcpPortsAndUpdateStatus: Done probing TCP ports for node: ${node.tcp_ipv4_address}`);
            node.save(function () {
                callback();
            });
        });

    } else {
        callback("Missing 'node' parameter.");
    }
}

function _updateNodeInfo(node, callback) {
    if (node.status_port_publicrpc === Enums.tcpprobestatus.Open) {
        const rpcCmd = RPCApi.genericRPCCall("getnodeinfo");
        RPCApi.proxycmd(node.rpcaddr, rpcCmd, function (proxyCmdError, proxyCmdData) {
            if (!proxyCmdError) {
                node.node_info = proxyCmdData;
                node.last_queried_info = Date.now();
                node.node_info_status = `Node info updated sucessfully`;
            } else {
                node.node_info_status = `Error updating info: ${(proxyCmdError.code || proxyCmdError.toString())}.`;
            }
            node.save(function () {
                callback();
            });
        });
    } else {
        node.node_info_status = `Not updating node info because RPC port is not open.`;
        node.save(function () {
            callback();
        });
    }
}

function _extractNodesFromPeer(peernode, callback) {
    const peer_addr = peernode.addr.split(":");
    const tcp_ipv4_address = peer_addr[0];
    const newNode = {
        tcp_ipv4_address: tcp_ipv4_address,
        last_seen_as_peer: Date.now()
    };
    _addNewNode(newNode, callback);
}

function _extractNodesFromPeers(node, callback) {
    if (node) {
        Logger.debug(`_extractNodesFromPeers: Starting processing ${node.peer_info.length.toString()} peers for node ${node.addr}.`);
        if (node.peer_info && node.peer_info.length > 0) {
            Async.eachSeries(node.peer_info, _extractNodesFromPeer, function () {
                // We're going to ignore any errors from _extractNodesFromPeer and _addNewNode. _addNewNode has error display/handling.
                callback();
            });
        } else {
            Logger.debug(`_extractNodesFromPeers: No peers found while while processing node ${node.addr}.`);
            callback();
        }
    } else {
        callback("Missing 'node' parameter.");
    }
}

function _updateNodePeerInfo(node, callback) {
    if (node.status_port_publicrpc === Enums.tcpprobestatus.Open) {
        const rpcCmd = RPCApi.genericRPCCall("getpeerinfo");
        RPCApi.proxycmd(node.rpcaddr, rpcCmd, function (proxyCmdError, proxyCmdData) {
            if (!proxyCmdError) {
                node.peer_info = proxyCmdData;
                node.last_queried_peers = Date.now();
                node.peer_info_status = `Peer info updated sucessfully`;

                node.save(function () {
                    _extractNodesFromPeers(node, function (_extractNodesFromPeersError, ignore) {
                        if (_extractNodesFromPeersError) {
                            Logger.error(_extractNodesFromPeersError);
                        }
                        callback();
                    });
                });
            } else {
                node.peer_info_status = `Error updating peers: ${(proxyCmdError.code || proxyCmdError.toString())}.`;
                node.save(function () {
                    callback();
                });
            }
        });
    } else {
        node.peer_info_status = `Not updating node peers because RPC port is not open.`;
        node.save(function () {
            callback();
        });
    }
}

//TODO: This needs to run perodically on _all_ nodes, irrespective of status.
function _updateNodeStatus(node, callback) {
    const consider_dead_if_last_seen_older_than = Date.now() - Config.timing.node_considered_dead;

    if (node.status_port_blockhain === Enums.tcpprobestatus.Open) {
        node.status = Enums.nodestatus.Open;
    } else { // The node does hot have its blockchain port open. Check to see if was seen a peer of another node. If so, it's probably alive but in listen=0 mode, or not port forwarded properly.
        if (node.last_seen_as_peer > consider_dead_if_last_seen_older_than) {
            node.status = Enums.nodestatus.Hidden;
        } else {
            node.status = Enums.nodestatus.Dead;
        }
    }

    node.save(function () {
        callback();
    });
}

function _refreshNodes(nodelist, callback) {
    Logger.info(`Found ${nodelist.length} nodes to update. Starting update...`);
    if (nodelist && nodelist.length > 0) {
        Logger.debug("refreshAllNodes: Node list:");
        Logger.debug(nodelist.map((node) => node.tcp_ipv4_address));

        Async.series([
            function (callback) {
                nodelist.forEach(function (node) {
                    node.last_updated = Date.now();
                });
                callback(null, `Updated last_updated on ${nodelist.length} node(s).`);
            },
            function (callback) {
                Async.each(nodelist, _probeNodeTcpPortsAndUpdateStatus, function (probeNodeTcpPortsAndUpdateStatusError) {
                    if (probeNodeTcpPortsAndUpdateStatusError) {
                        callback(probeNodeTcpPortsAndUpdateStatusError);
                    } else {
                        callback(null, `Updated tcp port info on ${nodelist.length} node(s).`);
                    }
                });
            },
            function (callback) {
                Async.each(nodelist, _updateNodeInfo, function (updateNodeInfoError) {
                    if (updateNodeInfoError) {
                        callback(updateNodeInfoError);
                    } else {
                        callback(null, `Updated node info on ${nodelist.length} node(s).`);
                    }
                });
            },
            function (callback) {
                Async.each(nodelist, _updateNodePeerInfo, function (updateNodePeerInfoError) {
                    if (updateNodePeerInfoError) {
                        callback(updateNodePeerInfoError);
                    } else {
                        callback(null, `Updated node peers on ${nodelist.length} node(s).`);
                    }
                });
            },
            function (callback) {
                Async.each(nodelist, function (node, callback) {
                    _updateNodeStatus(node, callback);
                }, function (updateNodeStatusError) {
                    if (updateNodeStatusError) {
                        callback(updateNodeStatusError);
                    } else {
                        callback(null, `Updated node status on ${nodelist.length} node(s).`);
                    }
                });
            }
        ], function (seriesError, results) {
            if (seriesError) {
                Logger.error("refreshAllNodes: Issues found while refreshing all nodes:");
                Logger.error(seriesError);
                callback(seriesError);
            } else {
                Logger.debug("refreshAllNodes: Results:");
                Logger.debug(results);
                callback(null, results);
            }
        });
    } else {
        callback(null, "No nodes to update.");
    }
}

const Automation = {
    newNode: function (tcp_ipv4_address, callback) {
        const newNode = {
            tcp_ipv4_address: tcp_ipv4_address,
            added_manually: true
        };
        _addNewNode(newNode, function (error) {
            if (!error) {
                callback(null, `Added new node: ${newNode.tcp_ipv4_address}.`);
            } else {
                callback(error, `Error addeding node: ${newNode.tcp_ipv4_address}.`);
            }
        });
    },
    newNodes: function (tcp_ipv4_addresses, callback) {
        Async.each(tcp_ipv4_addresses, function (tcp_ipv4_address, tcp_ipv4_addressesCb) {
            const newNode = {
                tcp_ipv4_address: tcp_ipv4_address,
                added_manually: true
            };
            _addNewNode(newNode, function (_addNewNodeError) {
                if (_addNewNodeError) {
                    tcp_ipv4_addressesCb(_addNewNodeError);
                } else {
                    tcp_ipv4_addressesCb();
                }
            });
        }, function (error) {
            callback(error, `OK. Added/updated ${tcp_ipv4_addresses.length.toString()} nodes.`);
        });
    },
    extractNodesFromPeers: function (internalNodeId, callback) {
        if (internalNodeId !== undefined && internalNodeId !== null) {
            Models.Node.findById(internalNodeId, function (findNodeError, findNodeData) {
                if (!findNodeError) {
                    _extractNodesFromPeers(findNodeData, callback);
                } else {
                    callback(findNodeError);
                }
            });
        } else {
            callback("Missing 'internalNodeId' parameter.");
        }
    },
    refreshNodeInfo: function (internalNodeId, callback) {
        Logger.debug("refreshNodeInfo:");
        Logger.debug(`Looking up node with _id: ${internalNodeId}...`);
        const query = {"_id": internalNodeId};
        Models.Node.find(query, function (findNodeError, findNodeData) {
            if (!findNodeError) {
                _refreshNodes(findNodeData, callback);
            } else {
                callback(findNodeError);
            }
        });
    },
    refreshAllNodes: function (callback) {
        Logger.debug("refreshAllNodes:");
        const node_info_refresh_age_limit = Date.now() - Config.timing.node_info_refresh_age_limit;
        const query = {"$or": [
            {status: {"$eq": Enums.nodestatus.New}},
            {last_updated: {"$eq": null}},
            {last_updated: {"$lt": node_info_refresh_age_limit}}
        ]};
        Logger.debug(`
Now: ${new Date()}
Before: ${new Date(node_info_refresh_age_limit)}`);

        Models.Node.find(query, function (findNodeError, findNodeData) {
            // for each node we know about, call refreshNodeInfo();
            if (!findNodeError) {
                _refreshNodes(findNodeData, callback);
            } else {
                callback(findNodeError);
            }
        });
    },
    extractAllNodePeers: function (callback) {
        // const node_info_refresh_age_limit = Date.now() - Config.timing.node_info_refresh_age_limit;
        // const query = {$or: [
        //     {"peer_info.0": {$exists: true}},
        //     {last_queried_peers: {$lt: node_info_refresh_age_limit}},
        // ]};
        const query = {
            "peer_info.0": {"$exists": true}
        };
        Logger.debug(query);

        Models.Node.find(query, function (findNodeError, findNodeData) {
            // for each node we know about, call refreshNodeInfo();
            if (!findNodeError) {
                Logger.debug(`extractAllNodePeers: Processing peers on ${findNodeData.length} nodes...`);
                if (findNodeData && findNodeData.length > 0) {
                    Async.eachSeries(findNodeData, _extractNodesFromPeers, function (extractNodesFromPeersError) {
                        if (extractNodesFromPeersError) {
                            callback(extractNodesFromPeersError);
                        } else {
                            callback(null, `Done extracting peers from ${findNodeData.length} node(s).`);
                        }
                    });
                } else {
                    callback(null, "No nodes need checking for peers to extract.");
                }
            } else {
                callback(findNodeError);
            }
        });
    },
    refreshAllNodeStatuses: function (callback) {
        Logger.debug("refreshAllNodeStatuses:");
        const query = {};

        Models.Node.find(query, function (findNodeError, findNodeData) {
            // for each node we know about, call refreshNodeInfo();
            if (!findNodeError) {
                Async.each(findNodeData, function (node, callback) {
                    _updateNodeStatus(node, callback);
                }, function (updateNodeStatusError) {
                    if (updateNodeStatusError) {
                        callback(updateNodeStatusError);
                    } else {
                        Logger.debug(`Updated node status on ${findNodeData.length} node(s).`);
                        callback(null, `Updated node status on ${findNodeData.length} node(s).`);
                    }
                });

            } else {
                callback(findNodeError);
            }
        });
    }
};

module.exports = Automation;