<template>
<div>
    <h1>Block Explorer</h1>
    <form class="row" @submit.prevent="">
        <div class="col-6">
            <input type="text" class="form-control" id="hash" v-model="hash" placeholder="Search for a block, transaction, or address">
        </div>
        <div class="col-1">
            <button type="submit" class="btn btn-primary mb-3" v-on:click="search(hash)">Search</button>
        </div>

        <div class="col-2 text-end">
            <div class="dropdown">
                <button class="btn btn-outline-secondary dropdown-toggle" type="button" id="dropdownMenu2" data-bs-toggle="dropdown" aria-expanded="false">
                    Select Node
                </button>
                <ul class="dropdown-menu" aria-labelledby="dropdownMenu2">
                    <li v-on:click="selectednode = node" v-for="(node) in activenodes" :key="node._id">
                        <button v-bind:class="{'active': (node._id === selectednode._id)}" class="dropdown-item" type="button">{{node?.tcp_ipv4_address}} (v{{node?.node_info?.version}})</button>
                    </li>
                </ul>
            </div>
        </div>
        <div class="col-3">
            {{selectednode?.tcp_ipv4_address}}:{{selectednode?.tcp_port_publicrpc}}<br>(v{{selectednode?.node_info?.version}})
        </div>

        <p>{{error}}</p>
    </form>

</div>
</template>

<script>
    export default {
        mounted: function() {
            const self = this;
            self.getactivenodes(function () {
                self.selectrandomnode();
            });
        },
        beforeRouteUpdate (to, from, next) {
            next();
        },
        props: {
            hash: { required: false }
        },
        data: function() {
            return {
                activenodes: [],
                selectednode: {},
                error: "",
                hash: "",
                searchresponse: null
            }
        },
        methods: {
            selectrandomnode: function () {
                if (this.activenodes && this.activenodes.length > 0) {
                    const min = 0
                    const max = Math.floor(this.activenodes.length - 1);
                    const randomIndex = Math.floor(Math.random() * (max - min + 1) + min);
                    this.selectednode = this.activenodes[randomIndex];
                }
            },
            getactivenodes: function (callback) {
                this.error = "";
                axios.get('/getactivenodes').then((response) => {
                    if (response.status === 200) {
                        if (response.data && response.data.status === "OK") {
                            this.activenodes = response.data.data;
                        } else {
                            this.error = `No data or error: ${response.status}: ${response.statusText}\n\n`;
                            this.error += JSON.stringify(response.data, null, 4);
                        }
                    } else {
                        this.error = `Non 200 response received: ${response.status}: ${response.statusText}`;
                    }

                    if (callback) {
                        callback();
                    }
                }, error => {
                    this.error = `Error: ${error}`;
                });
            },
            search: function(hash) {
                this.error = "";
                const peer = `${this.selectednode.tcp_ipv4_address}:${this.selectednode.tcp_port_publicrpc}`;
                if (peer && hash) {
                    axios.get('/search', {params: {peer: peer, hash: hash}}).then((response) => {
                        if (response.status === 200) {
                            if (response.data && response.data.status === "OK") {
                                this.searchresponse = response.data.data;
                            } else {
                                this.error = `No data or error: ${response.status}: ${response.statusText}\n\n`;
                                this.error += JSON.stringify(response.data, null, 4);
                            }
                        } else {
                            this.error = `Non 200 response received: ${response.status}: ${response.statusText}`;
                        }

                        if (callback) {
                            callback();
                        }
                    }, (error) => {
                        this.error = `${error}`;
                    });
                } else {
                    this.error = "Please enter a value in the search field.";
                }
            }
        }
    }
</script>

<style scoped>

</style>