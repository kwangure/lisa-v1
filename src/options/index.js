import root from "./_root.svelte";
import routes from "./routes/index.js";
import router from "@kwangure/svelte-pagejs-router";

router(root, routes, {
    hashbang: true,
    base: "/options/index.html",
});