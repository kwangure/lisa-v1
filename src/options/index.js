import routes, { error, layout } from "./routes/index.js";
import router from "@kwangure/svelte-pagejs-router";

router(routes, {
    hashbang: true,
    base: "/options/index.html",
    error: error,
    layout: layout,
});
