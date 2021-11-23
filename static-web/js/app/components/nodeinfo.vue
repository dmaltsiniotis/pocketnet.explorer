<template>
<div>
    <h1>Node Info</h1>
    <br>
    <h4>What is the node IP/RPC port you want to explore?</h4>
    <form class="row g-3" @submit.prevent="">
        <div class="col-auto">
            <label for="peer" class="visually-hidden">Email</label>
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

    <div v-show="(peerInfo && peerInfo.length > 0)">
        <br>
        <h4>Connected Peers</h4>
        <table class="table table-hover">
            <thead>
                <tr>
                    <th scope="col">Id</th>
                    <th scope="col">Addr</th>
                    <th scope="col">Version</th>
                    <th scope="col">Synced Blocks</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(peer) in peerInfo" :key="peer.id">
                    <td>{{peer.id}}</td>
                    <td>{{peer.addr}}</td>
                    <td>{{peer.subver}}</td>
                    <td>{{peer.synced_blocks}}</td>
                </tr>
            </tbody>
            <tfoot>
                <tr class="">
                    <td>Total</td>
                    <td>{{peerInfo.length}}</td>
                    <td></td>
                    <td></td>
                </tr>
            </tfoot>
        </table>
    </div>
</div>
</template>

<script>
    export default {
        mounted: function() {

        },
        beforeRouteUpdate (to, from, next) {
            // this.loadPollData(to.params.pid);
            next();
        },
        data: function() {
            return {
                error: "",
                peer: "",
                nodeInfo: {
                    lastblock: {}
                },
                peerInfo: []
            }
        },
        methods: {
            getnodeinfo: function (peer) {
                this.error = "";
                if (peer && peer !== "" && peer.split(":").legnth !== 2) {
                    axios.get('/nodeinfo', {params: {peer: peer}}).then((response) => {
                        if (response.status === 200) {
                            if (response.data && response.data.status === "OK") {
                                //console.debug(response.data.data);
                                this.nodeInfo = response.data.data.nodeInfo;
                                this.peerInfo = response.data.data.peerInfo;
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
                } else {
                    this.error = "Missing peer ip:port info. Dont forget to add \":38081 (or other public RPC port) at the end of the node IP address.\"";
                }
            }
        }
    }
</script>

<style scoped>

</style>