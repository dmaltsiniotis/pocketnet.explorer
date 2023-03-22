
<template>
<div>
    <div class="p-5 mb-4 bg-light rounded-3">
      <div class="container-fluid py-5">
        <h1 class="display-5 fw-bold">Bastyon Node Explorer</h1>
        <p class="col-md-8 fs-4">Welcome to the Bastyon Node Explorer, a tool for exploring the <a href="https://bastyon.com/">Bastyon</a> network.</p>
        <p class="">This site is in alpha-stage, probably buggy, and provides no expectation of accuracy or usefulness. Active development is underway on many aspect of this site, it's sort of an experimental playground at the moment. Questions/concerns contact <a target="_new" href="https://bastyon.com/demetri">https://bastyon.com/demetri</a> on Bastyon (formerly Pocketnet). Below is a brief summary of the different functions currently offered.</p>
        <ul>
            <li>The <router-link to="/nodetable">Node List</router-link> is probably the most useful part of the site so far, it lists all the nodes on the Bastyon network. It does this by connecting to each node and its peers and querying them in a methodical fashion. The node update/checking process will query for and update all nodes within every ten minutes.</li>
            <li>The <router-link to="/nodeinfo">Node Info</router-link> is probably the second-most useful part of the site. It allows for directly querying any Bastyon node on the internet to get basic information such as version, peers, and last 10 blocks.</li>
            <li>The <router-link to="/blockexplorer">Block Explorer</router-link> is a crude attempt at replicating the same functionality at <a href="https://bastyon.com/blockexplorer">https://bastyon.com/blockexplorer</a>. The official one is much nicer looking, the one here can be considered sort of a back-up in case that one doesn't work.</li>
            <li>The <router-link to="/nodegraph">Network Graph</router-link> was a poor attempt at trying to visualize all the nodes in the network as a directed graph. It was cute when the network was 20 nodes, but now (2023-03-21) at nearly 200 nodes on average it's a bit unruly.</li>
        </ul>
        <p class="">Some possible "coming soon" ideas (ideas/comments are welcome):</p>
        <ul>
            <li>Network/node fork detection.</li>
            <li>Historical graphs for stats like 'netstakeweight'.</li>
            <li>A naughty list of misbehaving nodes, such as nodes on old versions known to cause problems.</li>
            <li>A page that answers the question: Is my node set up correctly?</li>
            <!-- <li>"True" blockchain protocol integration, not just public RPC queries.</li> -->
        </ul>
        <!-- <span>test data: {{testdata}}</span> -->
        <!-- <component-a></component-a> -->
      </div>
    </div>
</div>
</template>

<script>
    const testLocalComponent = {
        //template: '<h1>can u c me now?</h1>'
    }

    export default {
        mounted: function() {
            //this.testdata = 'afterchange';
        },
        data: function() {
            return {
                //testdata: 'beforechange'
            }
        },
        methods: {
            //methodone: function() { console.log('methodone called');}
        },
        components: {
            //'component-a': testLocalComponent
        }
    }
</script>

<style scoped>

</style>