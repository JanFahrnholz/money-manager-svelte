<script lang="ts">
  import { App, View } from "framework7-svelte";
  import { onMount } from "svelte";
  import {
    addMessages,
    getLocaleFromNavigator,
    init
  } from "svelte-i18n";
  import de from "./locales/de.json";
  import en from "./locales/en.json";
  import { client } from "./pocketbase";
  import routes from "./routes";
  import store from "./store";
  addMessages("en", en);
  addMessages("de", de);

  init({
    fallbackLocale: getLocaleFromNavigator() || "en",
    initialLocale: localStorage.getItem("last-language"),
  });

  let f7params = {
    name: "MoneyManager", // App name
    theme: "auto", // Automatic theme detection
    colors: {
      primary: "#ffd600",
    },
    darkMode: true,
    store,
    routes,
    // Register service worker (only on production build)
    serviceWorker: {
      path: "/service-worker.js",
    },
  };

  onMount(async () => {
    try {
      await client.collection("users").getOne(client.authStore.model.id);
    } catch (error) {
      client.authStore.clear();
    }
  });
</script>

<App {...f7params}>
  <!-- Views/Tabs container -->
  <View main url="/" />
</App>
