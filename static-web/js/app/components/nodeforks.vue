<template>
<div>
    <h1>Fork Analysis</h1>

    <div class="row">
        <div class="col">
            <p class="text-center font-weight-bold">Heights &amp; Hashs</p>
            <!-- <div class="input-group mb-3">
                <input type="text" class="form-control" placeholder="Filter" aria-label="Search" v-model="nodefilter">
            </div> -->

            <table class="table table-hover">
                <thead>
                    <tr>
                        <th scope="col">Height</th>
                        <th scope="col">Hash</th>
                        <th scope="col">Node count</th>
                        <th scope="col">Fork?</th>
                        <th scope="col">Primary?</th>
                        <th scope="col">Behind?</th>
                        <th scope="col">Ahead?</th>
                        
                    </tr>
                </thead>
                <tbody>
                    <tr style="cursor:pointer"
                        v-on:click="selectnode(node)"
                        v-for="(hhm) in height_hash_map" :key="hhm._id"
                        v-bind:class="{
                            'table-active': hhm._id === selectednodeid
                        }">
                        <td>{{hhm.height}}</td>
                        <td>{{hhm.hash}}</td>
                        <td>{{hhm.count}}</td>
                        <td>{{hhm.fork}}</td>
                        <td>{{hhm.primary}}</td>
                        <td>{{hhm.behind}}</td>
                        <td>{{hhm.ahead}}</td>
                    </tr>
                </tbody>
                <tfoot>
                    <tr class="">
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
                            //this.sortnodes(this.nodes);
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
            // sortnodes: function (nodes) {
            //     if (nodes) {
            //         const secondarySort = function(nodea, nodeb) {
            //             if (nodea.tcp_ipv4_address < nodeb.tcp_ipv4_address) {
            //                 return -1
            //             } else if (nodea.tcp_ipv4_address > nodeb.tcp_ipv4_address) {
            //                 return 1
            //             }
            //             return 0;
            //         };
            //         nodes.sort(function (nodea, nodeb) {
            //             if (nodea.status > nodeb.status) {
            //                 return -1;
            //             }
            //             if (nodea.status < nodeb.status) {
            //                 return 1;
            //             }
            //             if (nodea.status === nodeb.status) {
            //                 return secondarySort(nodea, nodeb);
            //             }
            //         });
            //     }
            // },
            selectnode: function (node) {
                this.selectednodeid = node._id;
            },
            analyze_hashes: function () {
                const height_hash_map = this.height_hash_map;
                const nodes = this.nodes;
                if (nodes && nodes.length > 0) {
                    const addToMap = function (height, hash, nodeid) {
                        let existingMap = height_hash_map.find(function (map) {
                            if (map.height === height && map.hash === hash) {
                                return true
                            }
                            return false;
                        });

                        if (existingMap) {
                            existingMap.count += 1;
                            existingMap.nodes.push(nodeid);
                        } else {
                            height_hash_map.push({
                                height: height,
                                hash: hash,
                                count: 1,
                                nodes: [
                                    nodeid
                                ],
                                forked: false,
                                primary: false,
                                behind: false,
                                ahead: false
                            });
                        }
                    }
                    //this.height_hash_map
                    nodes.forEach(node => {
                        if (node.node_info && node.node_info.lastblock && node.node_info.lastblock.height > 0 && node.node_info.lastblock.hash !== "") {
                            addToMap(node.node_info.lastblock.height, node.node_info.lastblock.hash, node._id);
                        } else {
                            //console.debug(`Skipping node ${node.tcp_ipv4_address} due to missing info.`);
                        }
                    });
                    console.debug(height_hash_map);

                    height_hash_map.forEach(hhm => {
                        
                    });

                    // Set the most popular height/hash combo as the "primary" chain.
                    let primary_hhm = height_hash_map
                        .filter((hhm) => hhm.count > 0)
                        .reduce((prev, cur, idx, arr) => (prev.count > cur.count) ? prev : cur);
                    primary_hhm.primary = true;

                    // If other height/hashes are ahread or behind the primary, mark them an check for forks.
                    height_hash_map.forEach(function (hhm) {
                        if (hhm.height < primary_hhm.height) {
                            hhm.behind = true;
                        } else if (hhm.height > primary_hhm.height) {
                            hhm.ahead = true;
                        }
                    });
                    
                    // height_hash_map.reduce(function (prev, cur, idx, arr) {
                    //    
                    // });

                    height_hash_map.forEach(function (hhm) {
                        const uniqueHeightCount = height_hash_map.filter((hhm2) => hhm2.height === hhm.height);
                        if (uniqueHeightCount.length > 1) {
                            console.debug(`Block ${hhm.height} height IS forked.`);
                            // find the fork with most nodes, mark the rest as forked.
                            let max_height_hash = uniqueHeightCount.reduce(function (prev, cur, idx, arr) {
                                return (prev > cur) ? prev : cur;
                            });
                            console.debug(`Max height discovered as: {}`);
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