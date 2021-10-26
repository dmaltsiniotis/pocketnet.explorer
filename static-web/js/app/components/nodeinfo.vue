<template>
<div>
    <h1>Node Info</h1>
    <br>
    <h4>What is the node IP/RPC port you want to explore?</h4>
    <form class="row g-3" @submit.prevent="">
        <div class="col-auto">
            <input type="text" class="form-control" id="peer" v-model="peer" placeholder="127.0.0.1:38081">
        </div>
        <div class="col-auto">
            <button type="submit" class="btn btn-primary mb-3" v-on:click="getnodeinfo(peer)">Get Info</button>
        </div>
        <!-- <span>For example, here are five "cryptoservers" you can query info on (if they are up):</span>
        <ul>
            <li><a href="#">CryptoserverSP: 64.235.45.119:38081</a></li>
            <li>CryptoserverSP5: 216.108.231.40:38081</li>
            <li>Cryptoserver243: 135.181.196.243:38081</li>
            <li>Cryptoserver0610: 65.21.56.203:38081</li>
            <li>Cryptoserver0610_2: 65.21.57.14:38081</li>
        </ul> -->
        <p>{{error}}</p>
    </form>

    <div v-show="loading">
        <div class="d-flex justify-content-center">
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    </div>
    
    <div v-show="(nodeInfo && nodeInfo.version)">
        <div class="accordion" id="accordionPanelsStayOpenExample">
        <div class="accordion-item">
            <h2 class="accordion-header" id="panelsStayOpen-headingOne">
            <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#panelsStayOpen-collapseOne" aria-expanded="true" aria-controls="panelsStayOpen-collapseOne">
                Info
            </button>
            </h2>
            <div id="panelsStayOpen-collapseOne" class="accordion-collapse collapse show" aria-labelledby="panelsStayOpen-headingOne">
            <div class="accordion-body">
                <div v-show="(nodeInfo && nodeInfo.version)">
                    <br>
                    <h4>Node Info</h4>
                    <dl class="row">
                        <dt class="col-sm-2">Version</dt>
                        <dd class="col-sm-10">{{nodeInfo.version}}</dd>

                        <dt class="col-sm-2">Time</dt>
                        <dd class="col-sm-10">{{nodeInfo.time}}</dd>

                        <dt class="col-sm-2">Chain</dt>
                        <dd class="col-sm-10">{{nodeInfo.chain}}</dd>

                        <dt class="col-sm-2">Net-Stake-Weight</dt>
                        <dd class="col-sm-10">{{nodeInfo.netstakeweight}}</dd>
                    </dl>
                    <p class="fw-bold">Last Block:</p>
                    <dl class="row">
                        <dt class="col-sm-2">Height</dt>
                        <dd class="col-sm-10">{{nodeInfo.lastblock.height}}</dd>

                        <dt class="col-sm-2">Hash</dt>
                        <dd class="col-sm-10">{{nodeInfo.lastblock.hash}}</dd>

                        <dt class="col-sm-2">Time</dt>
                        <dd class="col-sm-10">{{nodeInfo.lastblock.time}}</dd>

                        <dt class="col-sm-2">Ntx</dt>
                        <dd class="col-sm-10">{{nodeInfo.lastblock.ntx}}</dd>
                    </dl>
                </div>
            </div>
            </div>
        </div>
        <div class="accordion-item">
            <h2 class="accordion-header" id="panelsStayOpen-headingTwo">
            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#panelsStayOpen-collapseTwo" aria-expanded="false" aria-controls="panelsStayOpen-collapseTwo">
                Blocks
            </button>
            </h2>
            <div id="panelsStayOpen-collapseTwo" class="accordion-collapse collapse" aria-labelledby="panelsStayOpen-headingTwo">
            <div class="accordion-body">
                <div v-show="(blockInfo && blockInfo.length > 0)">
                    <br>
                    <h4>Last {{blockInfo.length}} Blocks</h4>
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th scope="col">Height</th>
                                <th scope="col">Hash</th>
                                <th scope="col">Time</th>
                                <th scope="col">Ntx</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(block) in blockInfo" :key="block.id">
                                <td>{{block.height}}</td>
                                <td>{{block.hash}}</td>
                                <td>{{block.time}}</td>
                                <td>{{block.ntx}}</td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr class="">
                                <td>Total</td>
                                <td>{{blockInfo.length}}</td>
                                <td></td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
            </div>
        </div>
        <div class="accordion-item">
            <h2 class="accordion-header" id="panelsStayOpen-headingThree">
            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#panelsStayOpen-collapseThree" aria-expanded="false" aria-controls="panelsStayOpen-collapseThree">
                Peers
            </button>
            </h2>
            <div id="panelsStayOpen-collapseThree" class="accordion-collapse collapse" aria-labelledby="panelsStayOpen-headingThree">
            <div class="accordion-body">
                <div v-show="(peerInfo && peerInfo.length > 0)">
                    <br>
                    <h4>Connected Peers</h4>
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th scope="col">Id</th>
                                <th scope="col">Addr</th>
                                <th scope="col">Version</th>
                                <th scope="col">Starting Height</th>
                                <th scope="col">Inbound</th>
                                <th scope="col">Addnode</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(peer) in peerInfo" :key="peer.id">
                                <td>{{peer.id}}</td>
                                <td><span class="link-primary" style="cursor:pointer;text-decoration:none;" v-on:click="changepeer(peer.addr)">{{peer.addr}}</span></td>
                                <td>{{peer.subver || peer.version}}</td>
                                <td>{{peer.startingheight}}</td>
                                <td>{{peer.inbound}}</td>
                                <td>{{peer.addnode}}</td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr class="">
                                <td>Total</td>
                                <td>{{peerInfo.length}}</td>
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
        </div>
        </div>
    </div>

</div>
</template>

<script>
    export default {
        mounted: function() {
            if (this.ip) {
                this.peer = this.ip + ":38081";
                this.getnodeinfo(this.peer);
            }
        },
        beforeRouteUpdate (to, from, next) {
            if (to.params.ip) {
                this.peer = to.params.ip + ":38081";
                this.getnodeinfo(this.peer);
            }
            next();
        },
        props: {
            ip: { required: false }
        },
        data: function() {
            return {
                error: "",
                peer: "",
                nodeInfo: {
                    lastblock: {}
                },
                peerInfo: [],
                blockInfo: [],
                loading: false
            }
        },
        methods: {
            cleardata: function() {
                this.error = "";
                this.nodeInfo = {
                    lastblock: {}
                };
                this.peerInfo = [];
                this.blockInfo = [];
                this.loading = false;
            },
            getnodeinfo: function (peer) {
                const self = this;
                this.error = "";
                if (peer.split(":").length === 1) {
                    peer = peer + ":38081";
                }
                if (peer && peer !== "" && peer.split(":").length === 2) {
                    self.cleardata();
                    self.loading = true;
                    axios.get('/nodeinfo', {params: {peer: peer}}).then((response) => {
                        self.loading = false;
                        if (response.status === 200) {
                            if (response.data && response.data.status === "OK") {
                                //console.debug(response.data.data);
                                this.nodeInfo = response.data.data.nodeInfo;
                                this.peerInfo = response.data.data.peerInfo;
                                this.blockInfo = response.data.data.blockInfo;
                            } else {
                                console.error(`No data or error: ${response.status}: ${response.statusText}`);
                                console.error(response.data);
                            }
                        } else {
                            console.error(`Non 200 response received: ${response.status}: ${response.statusText}`);
                        }
                    }, error => {
                        self.loading = false;
                        this.error = `${error}`;
                    });
                } else {
                    this.error = "Missing peer ip:port info. Dont forget to add \":38081 (or other public RPC port) at the end of the node IP address.\"";
                }
            },
            changepeer: function (newpeeraddr) {
                const raw_addr = newpeeraddr.split(":");
                this.$router.push({ name: "nodeinfo", params: { ip: raw_addr[0] } });
                this.peer = raw_addr[0];
                this.getnodeinfo(this.peer);
            }
        }
    }
</script>

<style scoped>

</style>