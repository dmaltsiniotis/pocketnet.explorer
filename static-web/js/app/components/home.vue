<template>
<div>
    <div class="p-5 mb-4 bg-light rounded-3">
      <div class="container-fluid py-5">
        <h1 class="display-5 fw-bold">Welcome</h1>
        <p class="col-md-8 fs-4">The Pocketnet Node Explorer</p>
        <p class="">This is an experimental web application to explore the Pocketnet network. It is pre-alpha, probably buggy, and provides no expectation of accuracy or usefulness.</p>
        <p class="">Active development is underway on every aspect of this site, it's sort of an experimental playground at the moment. Questions/concerns contact <a target="_new" href="https://bastyon.com/demetri">https://bastyon.com/demetri</a> on Bastyon (Pocketnet).</p>
        <p class="">The node update/checking process runs every minute, but only refreshes a node if it was last checked more than ten minutes ago. This means the current list of nodes is, at most, eleven minutes behind.</p>
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