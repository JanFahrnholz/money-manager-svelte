<script lang="ts">
    import {App, View, Views} from "framework7-svelte";
    import routes from "./routes";
    import store from "./store";
    import {client} from "./pocketbase";
    import {onMount} from "svelte";

    let f7params = {
        name: "MoneyManager", // App name
        theme: "auto", // Automatic theme detection
        colors: {
            primary: "#ffd600",
        },
        darkMode: "auto",
        store,
        routes,
        // Register service worker (only on production build)
        serviceWorker:
            {
                path: "/service-worker.js",
            }
    };
</script>

<App {...f7params}>
    <!-- Views/Tabs container -->
    <View main url="/"/>
</App>
