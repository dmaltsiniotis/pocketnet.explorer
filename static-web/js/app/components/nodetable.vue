<template>
<div>
    <h1>Network Table</h1>

    <div class="row">
        <div class="col">
            <p class="text-center font-weight-bold">All active nodes<br><label>Include dead nodes? <input type="checkbox" v-model="include_dead" v-on:change="getnodes()"></label></p>
            <div class="input-group mb-3">
                <input type="text" class="form-control" placeholder="Filter" aria-label="Search" v-model="nodefilter">
            </div>

            <table class="table table-hover">
                <thead>
                    <tr>
                        <th scope="col">Addr</th>
                        <th scope="col">Version</th>
                        <th scope="col">Height</th>
                        <th scope="col">Hash</th>
                        <th scope="col">NSW</th>
                        <th scope="col">Status</th>
                        <th scope="col"># Peers</th>
                        <th scope="col">Last updated</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="cursor:pointer"
                        v-on:click="selectnode(node)"
                        v-for="(node) in filtered_nodes" :key="node._id"
                        v-bind:class="{
                            'table-active': node._id === selectednodeid
                        }">
                        <td>{{node.tcp_ipv4_address}}</td>
                        <td>{{node.node_info.version}}</td>
                        <td>{{node.node_info.lastblock.height}}</td>
                        <td>{{node.node_info.lastblock.hash.substring(0, 4)}}{{node.node_info.lastblock.hash? "..." : "Unknown"}}{{node.node_info.lastblock.hash.substring(node.node_info.lastblock.hash.length-4,node.node_info.lastblock.hash.length)}}</td>
                        <td>{{node.node_info.netstakeweight}}</td>
                        <td>{{node.status}}</td>
                        <td>{{node.peer_info.length}}</td>
                        <td>{{new Date(node.last_updated).toLocaleDateString()}} {{new Date(node.last_updated).toLocaleTimeString()}}</td>
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
                    </tr>
                </tfoot>
            </table>
        </div>
    </div>

</div>
</template>

<script>
    import {watch, markRaw} from "vue"
    export default {
        mounted: function() {
            const self = this;
            this.getnodes(function () {
                self.analyze_hashes();
            });
        },
        data: function() {
            return {
                nodes: [],
                nodefilter: "",
                selectednodeid: null,
                include_dead: false,
                height_hash_map: []
            }
        },
        methods: {
            getnodes: function (callback) {
                this.error = "";
                axios.get("/getnodes", {params: {all: this.include_dead}}).then((response) => {
                    if (response.status === 200) {
                        if (response.data && response.data.status === "OK") {
                            this.nodes = response.data.data;
                            this.sortnodes();
                            if (callback) {
                                callback();
                            }
                        } else {
                            console.error(`No data or error: ${response.status}: ${response.statusText}`);
                            console.error(response.data);
                        }
                    } else {
                        console.error(`Non 200 response received: ${response.status}: ${response.statusText}`);
                    }
                }, error => {
                    console.error(error);
                    this.error = `${error}`;
                });
            },
            sortnodes: function () {
                if (this.nodes) {
                    const secondarySort = function(nodea, nodeb) {
                        if (nodea.tcp_ipv4_address < nodeb.tcp_ipv4_address) {
                            return -1
                        } else if (nodea.tcp_ipv4_address > nodeb.tcp_ipv4_address) {
                            return 1
                        }
                        return 0;
                    };
                    this.nodes.sort(function (nodea, nodeb) {
                        if (nodea.status > nodeb.status) {
                            return -1;
                        }
                        if (nodea.status < nodeb.status) {
                            return 1;
                        }
                        if (nodea.status === nodeb.status) {
                            return secondarySort(nodea, nodeb);
                        }
                    });
                }
            },
            selectnode: function (node) {
                this.selectednodeid = node._id;
            },
            analyze_hashes: function () {
                const height_hash_map = this.height_hash_map;
                const nodes = this.nodes;
                if (nodes && nodes.length > 0) {
                    const addToMap = function (height, hash) {
                        let existingMap = height_hash_map.find(function (map) {
                            if (map.height === height && map.hash === hash) {
                                return true
                            }
                            return false;
                        });

                        if (existingMap) {
                            existingMap.count += 1;
                        } else {
                            height_hash_map.push({
                                height: height,
                                hash: hash,
                                count: 1,
                                forked: false
                            });
                        }
                    }
                    //this.height_hash_map
                    nodes.forEach(node => {
                        if (node.node_info && node.node_info.lastblock && node.node_info.lastblock.height > 0 && node.node_info.lastblock.hash !== "") {
                            addToMap(node.node_info.lastblock.height, node.node_info.lastblock.hash);
                        } else {
                            //console.debug(`Skipping node ${node.tcp_ipv4_address} due to missing info.`);
                        }
                    });
                    console.debug(height_hash_map);

                    // let max_height = nodes
                    //     .filter((node) => node.node_info.lastblock.height)
                    //     .map((node) => node.node_info.lastblock.height)
                    //     .reduce((prev, cur, idx, arr) => (prev > cur) ? prev : cur);
                    // console.debug(max_height);

                    height_hash_map.forEach(function (hhm) {
                        const uniqueHeightCount = height_hash_map.filter((hhm2) => hhm2.height === hhm.height);
                        if (uniqueHeightCount.length > 1) {
                            console.debug(`Block ${hhm.height} height IS forked.`);
                            // find the fork with most nodes, mark the rest as forked.
                            let max_height_hash = uniqueHeightCount.reduce(function (prev, cur, idx, arr) {
                                return (prev > cur) ? prev : cur;
                            });

                        } else {
                            console.debug(`Block ${hhm.height} height is NOT forked.`);
                        }
                    });

                } else {
                    console.debug("no nodes to analyze");
                }
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