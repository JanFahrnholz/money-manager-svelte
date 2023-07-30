<script lang="ts">
  import { onMount } from "svelte";

  import { App, View, Views, f7ready } from "framework7-svelte";

  import routes from "./routes";
  import store from "./store";

  // Framework7 Parameters
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
      process.env.NODE_ENV === "production"
        ? {
            path: "/service-worker.js",
          }
        : {},
  };
  onMount(() => {
    f7ready(() => {
      // Call F7 APIs here
    });
  });
</script>

<App {...f7params}>
  <!-- Views/Tabs container -->

  <View main tabActive url="/" />
  <View main url="/login/" />
</App>
