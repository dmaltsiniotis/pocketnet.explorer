const VueLoaderOptions = {
    moduleCache: {
        vue: Vue,
        bootstrap: bootstrap
    },
    async getFile (url) {
        const res = await fetch(url);
        if ( !res.ok ) {
             throw Object.assign(new Error(res.statusText + " " + url), { res });
        }
        return res.text();
        // return {
        //     getContentData: asBinary => asBinary ? res.arrayBuffer() : res.text(),
        // }
    },
    addStyle (textContent) {
        const style = Object.assign(document.createElement("style"), { textContent });
        const ref = document.head.getElementsByTagName("style")[0] || null;
        document.head.insertBefore(style, ref);
    }
}

const { loadModule } = window["vue3-sfc-loader"];

const LoadVue = function (path) {
    return loadModule(path, VueLoaderOptions);
};