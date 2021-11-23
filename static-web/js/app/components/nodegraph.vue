<template>
<div>
    <h1>Network Graph</h1>

    <div class="row">
        <div class="col-3">
            <p class="text-center font-weight-bold">All active nodes<!--<br>(Include dead nodes? <input type="checkbox">)--></p>
            <div class="input-group mb-3">
                <input type="text" class="form-control" placeholder="Filter" aria-label="Search" v-model="nodefilter">
            </div>
            <div class="list-group">

                <a class="list-group-item list-group-item-action" style="cursor:pointer"
                    v-on:click="selectnode(node)"
                    v-for="(node) in filtered_nodes" :key="node._id"
                    v-bind:class="{
                        'active': node._id === selectednodeid,
                        'list-group-item-success': node.status === 'open',
                        'list-group-item-secondary': node.status === 'new',
                        'list-group-item-warning': node.status === 'hidden',
                        'list-group-item-danger': node.status === 'dead'
                    }">
                    {{node.tcp_ipv4_address}} ({{node.node_info.version}}) - {{node.status}}
                </a>

            </div>
        </div>
        <div class="col-9">
            <div class="text-center">
                Directed Graph<br>
                <label><input type="radio" name="layout" value="circle" v-model="layout" v-on:change="layout_changed(layout)"> circle</label> ||
                <label><input type="radio" name="layout" value="random" v-model="layout" v-on:change="layout_changed(layout)"> Random</label> ||
                <label><input type="radio" name="layout" value="cose-bilkent" v-model="layout" v-on:change="layout_changed(layout)"> cose-bilkent</label>
                
            </div>
            <div class="min-vh-100" id="cynodes">

            </div>
        </div>
    </div>

</div>
</template>

<script>
    import {watch, markRaw} from "vue"
    export default {
        mounted: function() {
            this.initcy();
        },
        data: function() {
            return {
                nodes: [],
                nodefilter: "",
                layout: "circle",
                selectednodeid: null,
                cytograph: null,
                cytograph_layout: null
            }
        },
        methods: {
            layout_changed: function (new_layout) {
                if (!new_layout){
                    new_layout = this.layout;
                }
                switch(new_layout) {
                    case "random":
                        this.cytograph.layout(this.random_layout()).run();
                        break;
                    case "cose-bilkent":
                        this.cytograph.layout(this.cose_bilkent_layout()).run();
                        break;
                    case "circle":
                        this.cytograph.layout(this.circle_layout()).run();
                        break;
                    default:
                        console.error(`Unkown layout: ${new_layout}`);
                }
            },
            initcy: function() {
                const self = this;
                //const layoutOptions = this.random_layout();
                //const layoutOptions = {name: "circle"};
                //const layoutOptions = this.cose_layout();
                //const layoutOptions = this.cose_bilkent_layout();
                this.cytograph = markRaw(cytoscape({
                    container: document.getElementById("cynodes"),
                    style: this.cose_style(),
                    ready: function () {
                        //const cy = this;
                        self.getnodes(function () {
                            //cy.layout(layoutOptions).run();
                            self.layout_changed();
                        });
                    }
                }));
            },
            getnodes: function (callback) {
                this.error = "";
                axios.get("/getnodes", {params: {all: false}}).then((response) => {
                    if (response.status === 200) {
                        if (response.data && response.data.status === "OK") {
                            this.nodes = response.data.data;
                            this.sortnodes();
                            this.loadcytodata();
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
            loadcytodata: function () {
                const data = [];
                if (this.nodes) {
                    this.nodes.forEach(node => { // Create all the parent nodes.
                        data.push({
                            group: "nodes",
                            data: {
                                id: node.tcp_ipv4_address,
                                name: node.tcp_ipv4_address,
                                statusColor: this.getStatusColor(node.status),
                                peer_count: node.peer_count
                            }
                        });
                        if (node.peer_info && node.peer_info.length > 0) {
                            node.peer_info.forEach(function (peer) {
                                data.push({
                                    group: "edges",
                                    data: {
                                        id: node.tcp_ipv4_address + "_" + peer.tcp_ipv4_address,
                                        source: node.tcp_ipv4_address,
                                        target: peer.tcp_ipv4_address
                                    }
                                });
                            });
                        }
                    });
                }
                this.cytograph.add(data);
            },
            selectnode: function (node) {
                this.selectednodeid = node._id;
            },
            getStatusColor: function (status) {
                //0f5132 bcd0c7
                //e6dbb9 warning
                //f5c6cb danger
                let color = "#ccc";
                switch(status) {
                    case "open":
                        color = "#bcd0c7"
                        break;
                    case "hidden":
                        color = "#e6dbb9"
                        break;
                    case "dead":
                        color = "#f5c6cb"
                        break;
                }
                return color;
            },
            random_layout: function() {
                return {
                    name: "random",
                    fit: true, 
                    padding: 150
                };
            },
            circle_layout: function() {
                return {
                    name: "circle",
                    fit: true, 
                    padding: 150
                };
            },
            cose_layout: function () {
                return {
                    name: "cose",

                    // Called on `layoutready`
                    ready: function() {
                        //console.debug("layoutready");
                    },

                    // Called on `layoutstop`
                    stop: function() {
                        //console.debug("layoutready");
                    },

                    // Whether to animate while running the layout
                    // true : Animate continuously as the layout is running
                    // false : Just show the end result
                    // "end" : Animate with the end result, from the initial positions to the end positions
                    animate: "end",

                    // Easing of the animation for animate:"end"
                    animationEasing: undefined,

                    // The duration of the animation for animate:"end"
                    animationDuration: undefined,

                    // A function that determines whether the node should be animated
                    // All nodes animated by default on animate enabled
                    // Non-animated nodes are positioned immediately when the layout starts
                    animateFilter: function ( node, i ){ return true; },


                    // The layout animates only after this many milliseconds for animate:true
                    // (prevents flashing on fast runs)
                    animationThreshold: 250,

                    // Number of iterations between consecutive screen positions update
                    refresh: 20,

                    // Whether to fit the network view after when done
                    fit: true,

                    // Padding on fit
                    padding: 30,

                    // Constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
                    boundingBox: undefined,

                    // Excludes the label when calculating node bounding boxes for the layout algorithm
                    nodeDimensionsIncludeLabels: false,

                    // Randomize the initial positions of the nodes (true) or use existing positions (false)
                    randomize: false,

                    // Extra spacing between components in non-compound graphs
                    componentSpacing: 40,

                    // Node repulsion (non overlapping) multiplier
                    nodeRepulsion: function( node ){ return 2048; },

                    // Node repulsion (overlapping) multiplier
                    nodeOverlap: 4,

                    // Ideal edge (non nested) length
                    idealEdgeLength: function( edge ){ return 32; },

                    // Divisor to compute edge forces
                    edgeElasticity: function( edge ){ return 32; },

                    // Nesting factor (multiplier) to compute ideal edge length for nested edges
                    nestingFactor: 1.2,

                    // Gravity force (constant)
                    gravity: 1,

                    // Maximum number of iterations to perform
                    numIter: 1000,

                    // Initial temperature (maximum node displacement)
                    initialTemp: 1000,

                    // Cooling factor (how the temperature is reduced between consecutive iterations
                    coolingFactor: 0.99,

                    // Lower temperature threshold (below this point the layout will end)
                    minTemp: 1.0
                };
            },
            cose_bilkent_layout: function () {
                return {
                    name: "cose-bilkent",
                    // Called on `layoutready`
                    ready: function () {
                        //console.debug("layoutready");
                    },
                    // Called on `layoutstop`
                    stop: function () {
                        //console.debug("layoutstop");
                    },
                    // "draft", "default" or "proof" 
                    // - "draft" fast cooling rate 
                    // - "default" moderate cooling rate 
                    // - "proof" slow cooling rate
                    quality: "default",
                    // Whether to include labels in node dimensions. Useful for avoiding label overlap
                    nodeDimensionsIncludeLabels: true,
                    // number of ticks per frame; higher is faster but more jerky
                    refresh: 30,
                    // Whether to fit the network view after when done
                    fit: true,
                    // Padding on fit
                    padding: 10,
                    // Whether to enable incremental mode
                    randomize: true,
                    // Node repulsion (non overlapping) multiplier
                    nodeRepulsion: 4500,
                    // Ideal (intra-graph) edge length
                    idealEdgeLength: 200,
                    // Divisor to compute edge forces
                    edgeElasticity: 0.45,
                    // Nesting factor (multiplier) to compute ideal edge length for inter-graph edges
                    nestingFactor: 0.1,
                    // Gravity force (constant)
                    gravity: 0.25,
                    // Maximum number of iterations to perform
                    numIter: 2500,
                    // Whether to tile disconnected nodes
                    tile: true,
                    // Type of layout animation. The option set is {"during", "end", false}
                    animate: "end",
                    // Duration for animate:end
                    animationDuration: 500,
                    // Amount of vertical space to put between degree zero nodes during tiling (can also be a function)
                    tilingPaddingVertical: 50,
                    // Amount of horizontal space to put between degree zero nodes during tiling (can also be a function)
                    tilingPaddingHorizontal: 50,
                    // Gravity range (constant) for compounds
                    gravityRangeCompound: 1.5,
                    // Gravity force (constant) for compounds
                    gravityCompound: 1.0,
                    // Gravity range (constant)
                    gravityRange: 3.8,
                    // Initial cooling factor for incremental layout
                    initialEnergyOnIncremental: 0.5
                };
            },
            cose_style: function () {
                return [
                    {
                        "selector": "node",
                        "style": {
                            "background-color": "data(statusColor)",
                            "label": "data(id)",
                            "width": "mapData(peer_count, 0, 50, 20, 80)",
                            "height": "mapData(peer_count, 0, 50, 20, 80)",
                            // "content": "data(name)",
                            "font-size": "2em",
                            // "text-valign": "center",
                            // "text-halign": "center",
                            // "background-color": "#ff0000",
                            // "text-outline-color": "#555",
                            // "text-outline-width": "2px",
                            // "color": "#fff",
                            // "overlay-padding": "6px",
                            // "z-index": "10"
                            // "padding": "100px"
                        }
                    },
                    // {
                    //     "selector": "node:selected",
                    //     "style": {
                    //         "border-width": "6px",
                    //         "border-color": "#AAD8FF",
                    //         "border-opacity": "0.5",
                    //         "background-color": "#77828C",
                    //         "text-outline-color": "#77828C"
                    //     }
                    // },
                    {
                        "selector": "edge",
                        "style": {
                            "width": 3,
                            "line-color": "#ccc",
                            "target-arrow-color": "#ccc",
                            "target-arrow-shape": "triangle",
                            "curve-style": "bezier"
                            //"curve-style": "haystack",
                            // "haystack-radius": "0.5",
                            // "opacity": "0.4",
                            // "line-color": "#bbb",
                            // //"width": "mapData(weight, 0, 1, 1, 8)",
                            // "overlay-padding": "3px"
                        }
                    }
                ];
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