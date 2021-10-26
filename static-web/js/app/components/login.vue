<template>
<div>
    <h1>Login</h1>
    <form @submit.prevent="login">
        <button class="btn btn-primary">Login</button>
    </form>
</div>
</template>

<script>
    //import { ref } from 'vue';

    export default {
        setup() {
            //const newRefVar = ref('');

            function login() {
                axios.get('/login')
                .then((response) => {
                    console.log(response.data);
                    console.log(response.status);
                    console.log(response.statusText);
                    console.log(response.headers);
                    console.log(response.config);
                    switch(response.data.status) {
                        case 'REDIRECT': 
                            window.location.href = response.data.url;
                            break;
                        case 'OK':
                            console.info(response.data.data)
                            break;
                        case 'ERROR':
                            console.error(response.data.error)
                            break;
                        default:
                            break;
                    }
                });
            }

            // Return all objects to the template.
            return {
                //newRefVar,
                login
            }
        }
    }
</script>

<style scoped>

</style>