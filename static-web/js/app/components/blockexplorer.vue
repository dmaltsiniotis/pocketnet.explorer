<template>
<div>
    <h1>Block Explorer</h1>
    <form class="row" @submit.prevent="">
        <div class="col-6">
            <input type="text" class="form-control" id="searchbar_hash" v-model="searchbar_hash" placeholder="Search for a block, transaction, or address">
        </div>
        <div class="col-1">
            <button type="submit" class="btn btn-primary mb-3" v-on:click="search(searchbar_hash)">Search</button>
        </div>

        <div class="col-2 text-end">
            <div class="dropdown">
                <button class="btn btn-outline-secondary dropdown-toggle" type="button" id="dropdownMenu2" data-bs-toggle="dropdown" aria-expanded="false">
                    Select Node
                </button>
                <ul class="dropdown-menu" aria-labelledby="dropdownMenu2">
                    <li v-on:click="selectednode = node" v-for="(node) in activenodes" :key="node._id">
                        <button v-bind:class="{'active': (node._id === selectednode._id)}" class="dropdown-item" type="button">{{node?.tcp_ipv4_address}} (v{{node?.node_info?.version}}) - {{node?.node_info?.lastblock?.height}}</button>
                    </li>
                </ul>
            </div>
        </div>
        <div class="col-3">
            {{selectednode?.tcp_ipv4_address}}:{{selectednode?.tcp_port_publicrpc}}<br>(v{{selectednode?.node_info?.version}}) - {{selectednode?.node_info?.lastblock?.height}}
        </div>

        <p>{{error}}</p>
    </form>

    <div v-show="hashtype === ''">
        <h2>Latest Blocks</h2>
        <table class="table table-hover" v-show="latetblocks.length > 0">
            <thead>
                <tr>
                    <th scope="col" class="table-header" data-bs-toggle="tooltip" data-bs-placement="top" title="Block height.">Height</th>
                    <th scope="col" class="table-header" data-bs-toggle="tooltip" data-bs-placement="top" title="Block hash.">Hash</th>
                    <th scope="col" class="table-header" data-bs-toggle="tooltip" data-bs-placement="top" title="Timestamp">Timestamp</th>
                    <th scope="col" class="table-header" data-bs-toggle="tooltip" data-bs-placement="top" title="Transactions">Transactions</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(block) in latetblocks" :key="block.hash">
                    <td>{{block.height}}</td>
                    <td><span style="cursor:pointer;" class="link-primary" v-on:click="search(block.hash)">{{block.hash}}</span></td>
                    <td>{{block.time}}</td>
                    <td>{{block.ntx}}</td>
                </tr>
            </tbody>
            <tfoot>
                <tr class="">
                    <td>Total</td>
                    <td>{{latetblocks.length}}</td>
                    <td></td>
                    <td></td>
                </tr>
            </tfoot>
        </table>
    </div>

    <div v-show="hashtype === 'block'">
        <h2>Block {{blocksummary.height}}</h2>
        <span class="text-muted">{{blocksummary.hash}}</span>
        <h4>Summary</h4>
        <ul>
            <li>difficulty: {{blocksummary.difficulty}}</li>
            <li>bits: {{blocksummary.bits}}</li>
            <li>merkleroot: {{blocksummary.merkleroot}}</li>
            <li>prevhash: <span style="cursor:pointer;" class="link-primary" v-on:click="search(blocksummary.prevhash)">{{blocksummary.prevhash}}</span></li>
            <li>nexthash: <span style="cursor:pointer;" class="link-primary" v-on:click="search(blocksummary.nexthash)">{{blocksummary.nexthash}}</span></li>
        </ul>

        <h4>Transactions</h4>
        <table class="table table-hover">
            <thead>
                <tr>
                    <th scope="col" class="table-header" data-bs-toggle="tooltip" data-bs-placement="top" title="Block height.">Height</th>
                    <th scope="col" class="table-header" data-bs-toggle="tooltip" data-bs-placement="top" title="Transaction hash.">Txid</th>
                    <th scope="col" class="table-header" data-bs-toggle="tooltip" data-bs-placement="top" title="Transaction type (money, coinstake, coinbase, etc...)">Type</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(transaction) in blocktransactions" :key="transaction.txid">
                    <td>{{transaction.height}}</td>
                    <td><span style="cursor:pointer;" class="link-primary" v-on:click="search(transaction.txid)">{{transaction.txid}}</span></td>
                    <td>{{getTypeName(transaction.type)}}</td>
                </tr>
            </tbody>
            <tfoot>
                <tr class="">
                    <td>Total</td>
                    <td>{{blocktransactions.length}}</td>
                    <td></td>
                </tr>
            </tfoot>
        </table>
    </div>

    <div v-if="hashtype === 'transaction'">
        <h2>Transaction</h2>
        <span>{{transaction.txid}}</span>
        <h4>Summary</h4>
        <ul>
            <li>Height: {{transaction.height}}</li>
            <li>Type: {{getTypeName(transaction.type)}} ({{transaction.type}})</li>
            <li>Time: {{transaction.nTime}}</li>
            <li>Block: <span style="cursor:pointer;" class="link-primary" v-on:click="search(transaction.blockHash)">{{transaction.blockHash}}</span></li>
        </ul>

        <div class="row">
            <div class="col-sm-6">
                <h4>Inputs</h4>
                <table class="table table-hover">
                     <tbody>
                        <tr v-for="(vin) in transaction.vin" :key="vin">
                            <td>
                                Parent Tx: <span style="cursor:pointer;" class="link-primary" v-on:click="search(vin.txid)">{{vin.txid}}</span><br>
                                Outputs: {{vin.vout}}<br>
                                Address: <span style="cursor:pointer;" class="link-primary" v-on:click="search(vin.address)">{{vin.address}}</span><br>
                                Amount: {{vin.value}}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="col-sm-6">
                <h4>Outputs</h4>
                <table class="table table-hover">
                    <tbody>
                        <tr v-for="(vout) in nonEmptyOutputs(transaction.vout)" :key="vout">
                            <td>
                                n: {{vout.n}}<br>
                                Amount: {{vout.value}}<br>
                                Addresses:
                                <ul v-for="(address) in vout.scriptPubKey.addresses" :key="address">
                                    <span style="cursor:pointer;" class="link-primary" v-on:click="search(address)">{{address}}</span><br>
                                </ul>
                                
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

    </div>

    <div v-show="hashtype === 'address'">
        <h2>Address</h2>
        <h4>Summary</h4>
        <ul>
            <li>Final Balance: {{addressinfo.balance}}</li>
            <li>Recent changes (Height): {{addressinfo.lastChange}}</li>
        </ul>

        <h4>Transactions</h4>
        <table class="table table-hover">
            <thead>
                <tr>
                    <th scope="col" class="table-header" data-bs-toggle="tooltip" data-bs-placement="top" title="Block height.">Height</th>
                    <th scope="col" class="table-header" data-bs-toggle="tooltip" data-bs-placement="top" title="Transaction hash.">Txid</th>
                    <th scope="col" class="table-header" data-bs-toggle="tooltip" data-bs-placement="top" title="Transaction type (money, coinstake, coinbase, etc...)">Type</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(addresstransaction) in addresstransactions" :key="addresstransaction.txid">
                    <td>{{addresstransaction.height}}</td>
                    <td><span style="cursor:pointer;" class="link-primary" v-on:click="search(addresstransaction.txid)">{{addresstransaction.txid}}</span></td>
                    <td>{{getTypeName(addresstransaction.type)}}</td>
                </tr>
            </tbody>
            <tfoot>
                <tr class="">
                    <td>Total</td>
                    <td>{{addresstransactions.length}}</td>
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
            const self = this;
            self.getactivenodes(function () {
                self.selectrandomnode();
                if (self.hash) {
                    self.search(self.hash);
                } else {
                    self.getlatestblocks(self.latestblockcount);
                }
            });
        },
        beforeRouteUpdate (to, from, next) {
            next();
        },
        props: {
            hash: { required: false }
        },
        watch: { 
            hash: function(newVal, oldVal) {
              //console.log('Prop changed: ', newVal, ' | was: ', oldVal)
              this.search(newVal);
            }
        },
        data: function() {
            return {
                searchbar_hash: "",
                latestblockcount: 10,
                activenodes: [],
                selectednode: {},
                error: "",
                hashtype: "not_set",
                latetblocks: [],
                blocktransactions: [],
                addressinfo: {},
                addresstransactions: [],
                blocksummary: {},
                transaction: {}
            }
        },
        methods: {
            nonEmptyOutputs: function (vouts) {
                if (vouts) {
                    return vouts.filter(function (vout) {
                        //console.log(`checking: ${JSON.stringify(vout,null,4)}`)
                        return !(vout.scriptPubKey.addresses.length == 1 && vout.scriptPubKey.addresses[0] == "");
                    });
                }
                return vouts;
            },
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
            genericSearchAPIRequest: function (command, peer, hash, extra, callback) {
                var errorText = null;
                var params = {peer: peer, hash: hash};
                Object.assign(params, extra);
                axios.get(`/${command}`, {params: params}).then((response) => {
                    if (response.status === 200) {
                        if (response.data && response.data.status === "OK") {
                            //response.data.data;
                        } else {
                            errorText = `No data or error: ${response.status}: ${response.statusText}\n\n`;
                            errorText += JSON.stringify(response.data, null, 4);
                        }
                    } else {
                        errorText = `Non 200 response received: ${response.status}: ${response.statusText}`;
                    }

                    if (callback) {
                        callback(errorText, response.data.data);
                    }
                }, (error) => {
                    errorText = `${error}`;
                    if (callback) {
                        callback(errorText);
                    }
                });
            },
            getlatestblocks: function (count) {
                const self = this;
                const peer = `${this.selectednode.tcp_ipv4_address}:${this.selectednode.tcp_port_publicrpc}`;
                self.hashtype = "",
                this.genericSearchAPIRequest("getlastblocks", peer, count, null, function (error, data) {
                    if (!error) {
                        self.latetblocks = data.sort(function(a, b){return b.height - a.height});
                    } else {
                        self.error = error;
                    }
                });
            },
            search: function (hash) {
                this.searchbar_hash = hash;
                if (this.hash !== hash) {
                    this.$router.push({ name: "blockexplorer", params: { hash: hash } });
                    return;
                }
                const self = this;
                const peer = `${this.selectednode.tcp_ipv4_address}:${this.selectednode.tcp_port_publicrpc}`;
                if (peer) {
                    if (hash === "") {
                        self.getlatestblocks(self.latestblockcount);
                    } else {
                        self.error = "";
                        this.genericSearchAPIRequest("searchbyhash", peer, hash, null, function(error, data) {
                            if (!error) {
                                self.hashtype = data.type;
                                if (self.hashtype === "block") {
                                    self.genericSearchAPIRequest("getcompactblock", peer, hash, null, function (error, data) {
                                        if (!error) {
                                            self.blocksummary = data;

                                            self.genericSearchAPIRequest("getblocktransactions", peer, hash, {pageSize: self.blocksummary.nTx}, function (error, data) {
                                                if (!error) {
                                                    self.blocktransactions = data;
                                                } else {
                                                    self.error = error;
                                                }
                                            });

                                        } else {
                                            self.error = error;
                                        }
                                    });
                                } else if (self.hashtype === "transaction") {
                                    self.genericSearchAPIRequest("gettransactions", peer, hash, null, function (error, data) {
                                        if (!error) {
                                            self.transaction = data[0];
                                        } else {
                                            self.error = error;
                                        }
                                    });
                                } else if (self.hashtype === "address") {
                                    self.genericSearchAPIRequest("getaddressinfo", peer, hash, null, function (error, data) {
                                        if (!error) {
                                            self.addressinfo = data;
                                        } else {
                                            self.error = error;
                                        }
                                    });

                                    self.genericSearchAPIRequest("getaddresstransactions", peer, hash, null, function (error, data) {
                                        if (!error) {
                                            self.addresstransactions = data;    
                                        } else {
                                            self.error = error;
                                        }
                                    });
                                } else {
                                    self.error = `Unknown hash type: ${self.hashtype}`;
                                }
                            } else {
                                self.error = error;
                            }
                        });
                    }
                }
                // if (peer && hash) {

                // } else {
                //     this.error = "Please enter a value in the search field.";
                // }
            },
            getTypeName: function (typenum) {
                typenum = Number(typenum);
                var val = "";
                switch (typenum) {
                    case 0:
                        val = "NotSupported"
                        break;
                    case 1:
                        val = "Money"
                        break;
                    case 2:
                        val = "Coinbase"
                        break;
                    case 3:
                        val = "Coinstake"
                        break;
                    case 100:
                        val = "AccountUser"
                        break;
                    case 101:
                        val = "AccountVideoServer"
                        break;
                    case 102:
                        val = "AccountMessageServer"
                        break;
                    case 200:
                        val = "Post"
                        break;
                    case 201:
                        val = "Video"
                        break;
                    case 202:
                        val = "Article"
                        break;
                    case 204:
                        val = "Comment"
                        break;
                    case 205:
                        val = "CommentEdit"
                        break;
                    case 206:
                        val = "CommentDelete"
                        break;
                    case 207:
                        val = "ContentDelete"
                        break;
                    case 208:
                        val = "BoostContent"
                        break;
                    case 300:
                        val = "Score"
                        break;
                    case 301:
                        val = "ScoreComment"
                        break;
                    case 302:
                        val = "Subscribe"
                        break;
                    case 303:
                        val = "SubscribePrivate"
                        break;
                    case 304:
                        val = "Unsubscribe"
                        break;
                    case 305:
                        val = "Blocking"
                        break;
                    case 306:
                        val = "Unblocking"
                        break;
                    case 307:
                        val = "Complain"
                        break;
                    case 400:
                        val = "ModerationRequest"
                        break;
                    case 401:
                        val = "ModerationRegister"
                        break;
                    case 410:
                        val = "ModerationFlag"
                        break;
                    case 420:
                        val = "ModerationVote"
                        break;
                    default:
                        val = "Unknown"
                        break;
                }
                return val;
            }
        }
    }
</script>

<style scoped>

</style>