<template>
<div>
    <h1>List of Nodes</h1>

    <div class="row">
        <div class="col">
            <p class="text-center font-weight-bold">
                <button type="submit" class="btn btn-primary btn-sm" v-on:click="getcompactnodelist()" v-bind:disabled="loading">Refresh Table</button>
            </p>

            <div class="input-group mb-3">
                <input type="text" class="form-control" placeholder="Filter" aria-label="Search" v-model="nodefilter">
            </div>
            <span class="text-muted">Table is now sortable, click the column header to sort by it.</span>
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th scope="col" class="link-primary table-header-links" v-on:click="sortby('tcp_ipv4_address')" data-bs-toggle="tooltip" data-bs-placement="top" title="The IP address of this node.">Addr</th>
                        <th scope="col" class="link-primary table-header-links" v-on:click="sortby('node_info.version')" data-bs-toggle="tooltip" data-bs-placement="top" title="The version of pocketcoin this node is reporting.">Version</th>
                        <th scope="col" class="link-primary table-header-links" v-on:click="sortby('node_info.lastblock.height')" data-bs-toggle="tooltip" data-bs-placement="top" title="The latest block height this node is reporting.">Height</th>
                        <th scope="col" class="link-primary table-header-links" v-on:click="sortby('node_info.lastblock.hash')" data-bs-toggle="tooltip" data-bs-placement="top" title="The latest block hash this node is reporting.">Hash</th>
                        <th scope="col" class="link-primary table-header-links" v-on:click="sortby('node_info.netstakeweight')" data-bs-toggle="tooltip" data-bs-placement="top" title="The Net Stake Weight this node 'sees'.">NSW</th>
                        <th scope="col" class="link-primary table-header-links" v-on:click="sortby('status_port_blockhain')" data-bs-toggle="tooltip" data-bs-placement="top" title="Is the default listen port 37070 open?">Listen</th>
                        <th scope="col" class="link-primary table-header-links" v-on:click="sortby('status_port_publicrpc')" data-bs-toggle="tooltip" data-bs-placement="top" title="Is the default public RPC port 38081 open?">RPC</th>
                        <th scope="col" class="link-primary table-header-links" v-on:click="sortby('peer_count')" ># Peers</th>
                        <th scope="col" class="link-primary table-header-links" v-on:click="sortby('status')" data-bs-toggle="tooltip" data-bs-placement="top" title="If the node is fully open, hidden behind a firewall, or dead/timed out.">Status</th>
                        <!-- <th scope="col">Time?</th> -->
                        <!-- <th scope="col">Last updated</th> -->
                    </tr>
                </thead>
                <tbody>
                    <tr v-show="loading">
                        <td colspan="8">
                            <div class="text-center">
                                <div class="spinner-border" style="width: 10rem; height: 10rem;" role="status">
                                    <span class="visually-hidden">Loading...</span>
                                </div>
                                <p>Loading...</p>
                            </div>
                        </td>
                    </tr>
                    <tr style="cursor:pointer;"
                        v-on:click="selectnode(node)"
                        v-for="(node) in filtered_nodes" :key="node._id"
                        v-bind:class="{
                            'table-active': node._id === selectednodeid,
                            'table-warning': node.node_info.version.substring(0, 7) !== '0.22.11',
                            'table-danger': node.node_info.version.substring(0, 4) !== '0.22'
                            
                        }">
                        <td><router-link style="text-decoration:none;" :to="{name: 'nodeinfo', params: {ip: node.tcp_ipv4_address }}">{{node.tcp_ipv4_address}}</router-link></td>
                        <td>{{node.node_info.version}}</td>
                        <td>{{node.node_info.lastblock.height}}</td>
                        <!-- <td>{{node.node_info.lastblock.hash.substring(0, 4)}}{{node.node_info.lastblock.hash? "..." : "Unknown"}}{{node.node_info.lastblock.hash.substring(node.node_info.lastblock.hash.length-4,node.node_info.lastblock.hash.length)}}</td> -->
                        <td>{{node.node_info.lastblock.hash}}</td>
                        <td>{{node.node_info.netstakeweight}}</td>
                        <td>{{node.status_port_blockhain}}</td>
                        <td>{{node.status_port_publicrpc}}</td>
                        <td>{{node.peer_count}}</td>
                        <!-- <td>{{new Date(node.node_info.time).toUTCString()}}</td> -->
                        <!-- <td>{{new Date(node.last_updated).toLocaleDateString()}} {{new Date(node.last_updated).toLocaleTimeString()}}</td> -->
                        <td>{{node.status}}</td>
                    </tr>
                </tbody>
                <tfoot>
                    <tr class="">
                        <td>Total</td>
                        <td>{{filtered_nodes.length}}</td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <!-- <td></td> -->
                        <!-- <td></td> -->
                    </tr>
                </tfoot>
            </table>
        </div>
    </div>

</div>
</template>

<script>
    import {Tooltip} from "bootstrap"
    export default {
        mounted: function() {
            //init Bootstrap 5 tooltips.
            Array.from(document.querySelectorAll('th[data-bs-toggle="tooltip"]')).forEach(tooltipNode => new Tooltip(tooltipNode))
            const self = this;
            this.getcompactnodelist(function () {
                self.sortby('node_info.lastblock.height');
            });

            // TODO: Make this not suck.
            // let connection = new WebSocket("ws://" + location.host + "/");
            // connection.onmessage = function (event) {
            //     let message = JSON.parse(event.data);
            //     console.log(message);
            // }
        },
        data: function() {
            return {
                nodes: [],
                nodefilter: "",
                selectednodeid: null,
                height_hash_map: [],
                sortbyfield: "status",
                sortbydirection: -1,
                loading: true
            }
        },
        methods: {
            getcompactnodelist: function (callback) {
                this.loading = true;
                this.error = "";
                const self = this;
                axios.get("/getcompactnodelist").then((response) => {
                    if (response.status === 200) {
                        if (response.data && response.data.status === "OK") {
                            this.nodes = response.data.data;
                            this.sortnodes();
                        } else {
                            console.error(`No data or error: ${response.status}: ${response.statusText}`);
                            console.error(response.data);
                        }
                    } else {
                        console.error(`Non 200 response received: ${response.status}: ${response.statusText}`);
                    }
                    self.loading = false;
                    if (callback) {
                        callback();
                    }
                }, error => {
                    console.error(error);
                    self.error = `${error}`;
                    self.loading = false;
                });
            },
            sortby: function (field) {
                if (this.sortbyfield === field) {
                    this.sortbydirection *= -1;
                } else {
                    this.sortbyfield = field;
                    this.sortbydirection = -1;
                }
                this.sortnodes();
            },
            sortnodes: function () {
                const sortbyfield = this.sortbyfield;
                const sortbydirection = this.sortbydirection;
                if (this.nodes) {
                    const getFieldFromPath = function (nestedPathInDotNotation, nestedObj) {
                        const paths = nestedPathInDotNotation.split(".");
                        return paths.reduce((object, path) => {
                            return (object || {})[path];
                        }, nestedObj);
                    }
                    const secondarySort = function(nodea, nodeb) {
                        if (nodea.tcp_ipv4_address < nodeb.tcp_ipv4_address) {
                            return -1
                        } else if (nodea.tcp_ipv4_address > nodeb.tcp_ipv4_address) {
                            return 1
                        }
                        return 0;
                    };
                    this.nodes.sort(function (nodea, nodeb) {
                        const fielda = getFieldFromPath(sortbyfield, nodea);
                        const fieldb = getFieldFromPath(sortbyfield, nodeb);

                        if (fielda > fieldb) {
                            return sortbydirection;
                        }
                        if (fielda < fieldb) {
                            return sortbydirection*-1;
                        }
                        if (fielda === fieldb) {
                            return secondarySort(nodea, nodeb);
                        }
                    });
                }
            },
            selectnode: function (node) {
                this.selectednodeid = node._id;
            }
        },
        computed: {
            filtered_nodes() {
                if (this.nodefilter.length >= 3) {
                    const recursivePropertySearch = function (objToCheck, keyword) {
                        let found = false;
                        const objKeys = Object.keys(objToCheck);
                        for (let objectKeyIndex = 0; objectKeyIndex < objKeys.length; objectKeyIndex++) {
                            const propertyName = objKeys[objectKeyIndex];
                            const propertyToCheck = objToCheck[propertyName];
                            if (propertyToCheck !== null && propertyToCheck.constructor !== Array) { // Ignore arrays.
                                if (typeof propertyToCheck === "string") {
                                    if (propertyToCheck.includes(keyword)) {
                                        found = true;
                                        break;
                                    }
                                } else if (typeof propertyToCheck === "number") {
                                    if (propertyToCheck.toString().includes(keyword)) {
                                        found = true;
                                        break;
                                    }
                                } else if (typeof propertyToCheck === "object") {
                                    found = recursivePropertySearch(propertyToCheck, keyword);
                                }
                            }
                        }
                        return found;
                    }
                    const filter_keyword = this.nodefilter;
                    const filteredResults = this.nodes.filter(function (node) {
                        return recursivePropertySearch(node, filter_keyword);
                    });
                    return filteredResults;
                } else {
                    return this.nodes;
                }
            }
        }
    }
</script>

<style scoped>

</style>