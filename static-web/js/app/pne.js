/*jslint browser: true */
/*global Vue, LoadVue, VueRouter, feather, axios, window */

const Home =  () => LoadVue("./js/app/components/home.vue");
const Login =  () => LoadVue("./js/app/components/login.vue");
const Logout =  () => LoadVue("./js/app/components/logout.vue");
const NodeInfo =  () => LoadVue("./js/app/components/nodeinfo.vue");
const NodeTable =  () => LoadVue("./js/app/components/nodetable.vue");
const NodeGraph =  () => LoadVue("./js/app/components/nodegraph.vue");
const NodeForks =  () => LoadVue("./js/app/components/nodeforks.vue");
const BlockExplorer =  () => LoadVue("./js/app/components/blockexplorer.vue");

const router = VueRouter.createRouter({
    history: VueRouter.createWebHashHistory(), // Provide the history implementation to use. We are using the hash history for simplicity here.
    routes: [
      { name: "home", path: "/", component: Home },
      { name: "logout",  path: "/logout", component: Logout },
      { name: "login",  path: "/login", component: Login },
      { name: "nodeinfo",  path: "/nodeinfo/:ip?", component: NodeInfo, props: true },
      { name: "nodetable",  path: "/nodetable", component: NodeTable },
      { name: "nodegraph",  path: "/nodegraph", component: NodeGraph },
      { name: "nodeforks",  path: "/nodeforks", component: NodeForks },
      { name: "blockexplorer",  path: "/blockexplorer/:hash?", component: BlockExplorer, props: true }
    ]
});

const RootComponent = {
    data() {
        return {
            loggedin: false
        };
    },
    mounted() {

    }
};

// App init
function init() {
    feather.replace();

    // TODO move Axis init out of main init().
    axios.interceptors.response.use(function (response) {
        //console.debug("Response was received");
        if (response.status === 200) {
            if (response.data) {
                switch (response.data) {
                case "OK":
                    break;
                case "REDIRECT":
                    console.info("Redirecting to: " + response.data.url);
                    window.location.replace(response.data.url); // This seems harsh.
                    break;
                case "ERROR":
                    console.warn(response.data.error);
                    return Promise.reject(response.data.error);
                }
            } else {
                // We should at least have an empty response here.
                //callback(null, null);
            }
        } else {
            //callback(xmlhttp.responseText);
        }

        return response;
      }, (error) => Promise.reject(error));

      const app = Vue.createApp(RootComponent);
      app.use(router);
      const vm = app.mount("#pneapp");
}

init();