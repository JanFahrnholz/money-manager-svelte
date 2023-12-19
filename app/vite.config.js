import { SvelteKitPWA } from "@vite-pwa/sveltekit";
import path from "path";
import {nodePolyfills} from "vite-plugin-node-polyfills";

const SRC_DIR = path.resolve(__dirname, "./");
const PUBLIC_DIR = path.resolve(__dirname, "./public");
const BUILD_DIR = path.resolve(__dirname, "./www");
export default async () => {
  const { svelte } = await import("@sveltejs/vite-plugin-svelte");
  return {
    plugins: [
      svelte(),
      SvelteKitPWA(),
    ],
    root: SRC_DIR,
    base: "",
    publicDir: PUBLIC_DIR,
    build: {
      outDir: BUILD_DIR,
      assetsInlineLimit: 0,
      emptyOutDir: true,
      rollupOptions: {
        treeshake: false,
      },
    },
    optimizeDeps: {
      include: ['mongodb'],
    },
    ssr: {
      noExternal: ['mongodb'],
    },
    resolve: {
      alias: {
        "@": SRC_DIR,
      },
    },
    server: {
      host: true,
    },
  };
};
