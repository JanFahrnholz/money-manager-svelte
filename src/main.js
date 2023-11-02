// Import Framework7
import Framework7 from "framework7/lite-bundle";
import Framework7Svelte, { f7 } from "framework7-svelte";
import "framework7/css/bundle";
import "./css/icons.css";
import "./css/app.css";
import App from "./app.svelte";

Framework7.use(Framework7Svelte);

// Mount Svelte App
const app = new App({
  target: document.getElementById("app"),
});

export default app;
