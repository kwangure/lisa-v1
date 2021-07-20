import routes, { error, layout } from "./routes/index.js";
import router from "@kwangure/svelte-pagejs-router";

router(routes, {
    hashbang: true,
    base: "/dashboard/index.html",
    error,
    layout,
});
