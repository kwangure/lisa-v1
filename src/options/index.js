import root from "./_root.svelte";
import router from "@kwangure/svelte-pagejs-router";
import routes from "./routes/index.js";

router(root, routes, {
    hashbang: true,
    base: "/options/index.html",
});
