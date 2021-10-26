<template>
<div>
    <h1>Network Table</h1>

    <div class="row">
        <div class="col">
            <p class="text-center font-weight-bold">All active nodes<br><label>Include dead nodes? <input type="checkbox" v-model="include_dead" v-on:change="getnodes()"></label></p>
            <!--<div class="input-group mb-3">
                <input type="text" class="form-control" placeholder="Filter" aria-label="Search" v-model="nodefilter">
            </div> -->

            <table class="table table-hover">
                <thead>
                    <tr>
                        <th scope="col">Addr</th>
                        <th scope="col">Version</th>
                        <th scope="col">Height</th>
                        <th scope="col">NSW</th>
                        <th scope="col">Status</th>
                        <th scope="col"># Peers</th>
                        <th scope="col">Last updated</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="cursor:pointer"
                        v-on:click="selectnode(node)"
                        v-for="(node) in nodes" :key="node._id"
                        v-bind:class="{
                            'table-active': node._id === selectednodeid
                        }">
                        <td>{{node.tcp_ipv4_address}}</td>
                        <td>{{node.node_info.version}}</td>
                        <td>{{node.node_info.lastblock.height}}</td>
                        <td>{{node.node_info.netstakeweight}}</td>
                        <td>{{node.status}}</td>
                        <td>{{node.peer_info.length}}</td>
                        <td>{{new Date(node.last_updated).toLocaleDateString()}} {{new Date(node.last_updated).toLocaleTimeString()}}</td>
                    </tr>
                </tbody>
                <tfoot>
                    <tr class="">
                        <td>Total</td>
                        <td>{{nodes.length}}</td>
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
            this.getnodes();
        },
        data: function() {
            return {
                nodes: [],
                nodefilter: "",
                selectednodeid: null,
                include_dead: false
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